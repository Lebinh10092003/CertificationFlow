from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.parse import urlparse

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from openpyxl.utils import get_column_letter

from apps.common.logging import write_audit_log
from apps.common.text import normalize_text
from apps.competitions.models import IntegrationConfig

from ..models import CertificatePage, SourcePdfBatch
from .parsing import infer_competition_code


SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly"
SHEETS_RW_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
DRIVE_SCOPE = "https://www.googleapis.com/auth/drive"
PLACEHOLDER_PUBLIC_DOMAINS = {"yourdomain.com", "www.yourdomain.com"}


@dataclass
class BatchDeliverySummary:
    total_pages: int
    processed_pages: int
    failed_pages: int


def _load_service_account_credentials(config: IntegrationConfig, scopes: list[str]):
    credentials_payload = config.sheets_credentials_json or settings.GOOGLE_SERVICE_ACCOUNT_JSON
    if not credentials_payload:
        raise ValidationError("Missing Google service account credentials")
    credentials_info = json.loads(credentials_payload)
    return service_account.Credentials.from_service_account_info(credentials_info, scopes=scopes)


def _build_google_service(config: IntegrationConfig, service_name: str, version: str, scopes: list[str]):
    credentials = _load_service_account_credentials(config, scopes)
    return build(service_name, version, credentials=credentials, cache_discovery=False)


def _sheet_a1_range(sheet_name: str, cell_range: str) -> str:
    escaped_sheet = sheet_name.replace("'", "''")
    return f"'{escaped_sheet}'!{cell_range}"


def _sheet_row_number(page: CertificatePage) -> int | None:
    enrollment = page.match.competition_enrollment if page.match else None
    if not enrollment:
        return None
    raw_value = enrollment.sheet_row_key or enrollment.source_row_number
    if raw_value in (None, ""):
        return None
    try:
        return int(raw_value)
    except (TypeError, ValueError):
        return None


def delivery_pages_for_batch_ids(batch_ids: list[int]):
    return (
        CertificatePage.objects.select_related(
            "source_batch",
            "extraction",
            "match",
            "match__competition_enrollment__participant",
            "match__competition_result",
        )
        .filter(source_batch_id__in=batch_ids)
        .filter(match__competition_enrollment__isnull=False)
        .filter(match__requires_review=False)
        .filter(match__is_approved=True)
        .order_by("source_batch_id", "page_number")
    )


def batch_delivery_pages(batch: SourcePdfBatch):
    if not batch.pk:
        return CertificatePage.objects.none()
    return delivery_pages_for_batch_ids([batch.pk])


def page_competition_code(page: CertificatePage) -> str:
    extraction = page.extraction
    if extraction.subject:
        return extraction.subject.strip()
    if extraction.competition_name:
        code = infer_competition_code(extraction.competition_name)
        if code:
            return code
    if page.match and page.match.competition_enrollment and page.match.competition_enrollment.subject:
        return page.match.competition_enrollment.subject.strip()
    if page.source_batch.competition and page.source_batch.competition.subject:
        return page.source_batch.competition.subject.strip()
    return ""


def _is_placeholder_public_base_url(value: str) -> bool:
    if not value:
        return True
    parsed = urlparse(value)
    host = (parsed.netloc or parsed.path).split(":", 1)[0].lower()
    return host in PLACEHOLDER_PUBLIC_DOMAINS


def resolve_public_site_base_url(request=None) -> str:
    configured = settings.PUBLIC_SITE_BASE_URL.rstrip("/")
    if configured and not _is_placeholder_public_base_url(configured):
        return configured

    if request is not None:
        origin = (request.headers.get("Origin") or "").strip().rstrip("/")
        if origin and not _is_placeholder_public_base_url(origin):
            return origin

        referer = (request.headers.get("Referer") or "").strip()
        if referer:
            parsed = urlparse(referer)
            referer_base = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
            if parsed.scheme and parsed.netloc and not _is_placeholder_public_base_url(referer_base):
                return referer_base

        request_base = request.build_absolute_uri("/").rstrip("/")
        if request_base and not _is_placeholder_public_base_url(request_base):
            return request_base

    if settings.DEBUG:
        return "http://localhost:5173"
    return ""


def build_public_url(public_slug: str, request=None) -> str:
    base_url = resolve_public_site_base_url(request)
    if base_url:
        return f"{base_url}/c/{public_slug}"
    return f"/c/{public_slug}"


def ensure_public_identity(page: CertificatePage, request=None) -> CertificatePage:
    extraction = page.extraction
    enrollment = page.match.competition_enrollment if page.match else None
    result = page.match.competition_result if page.match else None

    student_name = (
        enrollment.participant.full_name
        if enrollment and enrollment.participant.full_name
        else extraction.student_name
    )
    award = result.award if result and result.award else extraction.award
    competition_code = page_competition_code(page)
    grade = extraction.grade or (enrollment.participant.grade if enrollment else "")

    slug_parts = [student_name, award, competition_code, grade]
    base_slug = slugify(" ".join(part for part in slug_parts if part).strip()) or f"certificate-{page.id}"
    public_slug = base_slug
    if CertificatePage.objects.exclude(pk=page.pk).filter(public_slug=public_slug).exists():
        public_slug = f"{base_slug}-{page.id}"

    public_url = build_public_url(public_slug, request=request)
    updates = []
    if page.public_slug != public_slug:
        page.public_slug = public_slug
        updates.append("public_slug")
    if page.public_url != public_url:
        page.public_url = public_url
        updates.append("public_url")
    if updates:
        updates.append("updated_at")
        page.save(update_fields=updates)
    return page


def fetch_sheet_columns(config: IntegrationConfig) -> list[str]:
    if not config.sheets_spreadsheet_id or not config.sheets_worksheet_name:
        raise ValidationError("Google Sheets integration is not configured")
    sheets = _build_google_service(config, "sheets", "v4", [SHEETS_READONLY_SCOPE])
    values = (
        sheets.spreadsheets()
        .values()
        .get(
            spreadsheetId=config.sheets_spreadsheet_id,
            range=_sheet_a1_range(config.sheets_worksheet_name, "1:1"),
        )
        .execute()
        .get("values", [])
    )
    config.is_sheets_connected = True
    config.last_sheets_sync_at = timezone.now()
    config.save(update_fields=["is_sheets_connected", "last_sheets_sync_at", "updated_at"])
    return values[0] if values else []


def _fetch_sheet_headers(sheets, config: IntegrationConfig, worksheet_name: str) -> list[str]:
    try:
        header_values = (
            sheets.spreadsheets()
            .values()
            .get(
                spreadsheetId=config.sheets_spreadsheet_id,
                range=_sheet_a1_range(worksheet_name, "1:1"),
            )
            .execute()
            .get("values", [[]])
        )
    except HttpError as error:
        raise ValidationError(f"Worksheet '{worksheet_name}' is not accessible") from error
    return list(header_values[0]) if header_values else []


def _ensure_sheet_columns(
    sheets,
    config: IntegrationConfig,
    worksheet_name: str,
    required_columns: list[str],
) -> dict[str, int]:
    headers = _fetch_sheet_headers(sheets, config, worksheet_name)
    changed = False
    for column_name in required_columns:
        if column_name and column_name not in headers:
            headers.append(column_name)
            changed = True
    if changed:
        try:
            sheets.spreadsheets().values().update(
                spreadsheetId=config.sheets_spreadsheet_id,
                range=_sheet_a1_range(worksheet_name, "1:1"),
                valueInputOption="RAW",
                body={"values": [headers]},
            ).execute()
        except HttpError as error:
            raise ValidationError(f"Unable to update headers for worksheet '{worksheet_name}'") from error
    return {header: index + 1 for index, header in enumerate(headers)}


def _page_sheet_name(page: CertificatePage, config: IntegrationConfig) -> str:
    enrollment = page.match.competition_enrollment if page.match else None
    if enrollment and enrollment.source_sheet_name:
        return enrollment.source_sheet_name
    return config.sheets_worksheet_name


def deliver_batch_to_drive(batch: SourcePdfBatch) -> BatchDeliverySummary:
    if not batch.competition_id:
        raise ValidationError("Batch must be attached to a competition before delivery")
    config = batch.competition.integration_config
    if not config.drive_folder_id:
        raise ValidationError("Drive Folder ID is not configured")

    drive = _build_google_service(config, "drive", "v3", [DRIVE_SCOPE])
    pages = list(batch_delivery_pages(batch))
    processed_pages = 0
    failed_pages = 0

    for page in pages:
        if not page.split_pdf_file:
            failed_pages += 1
            continue
        try:
            ensure_public_identity(page)
            if page.drive_file_id and page.drive_file_url:
                processed_pages += 1
                continue
            metadata = {
                "name": page.output_filename or page.split_pdf_file.name.rsplit("/", 1)[-1],
                "parents": [config.drive_folder_id],
            }
            media = MediaFileUpload(page.split_pdf_file.path, mimetype="application/pdf", resumable=False)
            response = drive.files().create(body=metadata, media_body=media, fields="id").execute()
            file_id = response["id"]
            drive.permissions().create(fileId=file_id, body={"role": "reader", "type": "anyone"}).execute()
            page.drive_file_id = file_id
            page.drive_file_url = f"https://drive.google.com/file/d/{file_id}/view"
            page.save(update_fields=["drive_file_id", "drive_file_url", "updated_at"])
            processed_pages += 1
        except Exception:
            failed_pages += 1

    config.is_drive_connected = True
    config.last_drive_check_at = timezone.now()
    config.save(update_fields=["is_drive_connected", "last_drive_check_at", "updated_at"])
    write_audit_log(
        competition=batch.competition,
        object_type="SourcePdfBatch",
        object_id=batch.id,
        action="drive_upload",
        status="success" if failed_pages == 0 else "partial",
        message=f"Uploaded {processed_pages}/{len(pages)} certificates to Drive",
    )
    return BatchDeliverySummary(total_pages=len(pages), processed_pages=processed_pages, failed_pages=failed_pages)


def write_batch_links_to_sheet(
    batch: SourcePdfBatch,
    *,
    drive_link_column: str,
    public_link_column: str,
    status_column: str = "",
) -> BatchDeliverySummary:
    if not batch.competition_id:
        raise ValidationError("Batch must be attached to a competition before delivery")
    config = batch.competition.integration_config
    if not config.sheets_spreadsheet_id or not config.sheets_worksheet_name:
        raise ValidationError("Google Sheets integration is not configured")

    required_columns = [column for column in [drive_link_column, public_link_column, status_column] if column]
    sheets = _build_google_service(config, "sheets", "v4", [SHEETS_RW_SCOPE])

    pages = list(batch_delivery_pages(batch))
    column_maps: dict[str, dict[str, int]] = {}
    worksheet_names = {_page_sheet_name(page, config) for page in pages if _page_sheet_name(page, config)}
    for worksheet_name in sorted(worksheet_names):
        column_maps[worksheet_name] = _ensure_sheet_columns(sheets, config, worksheet_name, required_columns)

    data = []
    processed_pages = 0
    failed_pages = 0
    successful_pages = []

    for page in pages:
        row_number = _sheet_row_number(page)
        if row_number is None:
            page.sheet_write_status = CertificatePage.ExternalStatus.FAILED
            page.save(update_fields=["sheet_write_status", "updated_at"])
            failed_pages += 1
            continue

        if not page.drive_file_url:
            page.sheet_write_status = CertificatePage.ExternalStatus.FAILED
            page.save(update_fields=["sheet_write_status", "updated_at"])
            failed_pages += 1
            continue

        ensure_public_identity(page)
        worksheet_name = _page_sheet_name(page, config)
        column_map = column_maps.get(worksheet_name)
        if not column_map:
            page.sheet_write_status = CertificatePage.ExternalStatus.FAILED
            page.save(update_fields=["sheet_write_status", "updated_at"])
            failed_pages += 1
            continue
        page_data = [
            (drive_link_column, page.drive_file_url),
            (public_link_column, page.public_url),
        ]
        if status_column:
            page_data.append((status_column, "Ready"))

        for column_name, value in page_data:
            column_index = column_map[column_name]
            data.append(
                {
                    "range": _sheet_a1_range(worksheet_name, f"{get_column_letter(column_index)}{row_number}"),
                    "values": [[value]],
                }
            )

        successful_pages.append(page)

    if data:
        sheets.spreadsheets().values().batchUpdate(
            spreadsheetId=config.sheets_spreadsheet_id,
            body={"valueInputOption": "RAW", "data": data},
        ).execute()
        for page in successful_pages:
            page.sheet_write_status = CertificatePage.ExternalStatus.UPDATED
            page.save(update_fields=["sheet_write_status", "updated_at"])
        processed_pages = len(successful_pages)

    write_audit_log(
        competition=batch.competition,
        object_type="SourcePdfBatch",
        object_id=batch.id,
        action="sheet_writeback",
        status="success" if failed_pages == 0 else "partial",
        message=f"Wrote links for {processed_pages}/{len(pages)} certificates to Google Sheets",
    )
    return BatchDeliverySummary(total_pages=len(pages), processed_pages=processed_pages, failed_pages=failed_pages)


@transaction.atomic
def delete_source_batch(batch: SourcePdfBatch):
    if batch.status == SourcePdfBatch.Status.PROCESSING:
        raise ValidationError("Cannot delete a batch while it is processing")

    for page in batch.pages.select_related("extraction", "match"):
        if page.split_pdf_file:
            page.split_pdf_file.delete(save=False)
        if page.preview_image_file:
            page.preview_image_file.delete(save=False)
    if batch.uploaded_file:
        batch.uploaded_file.delete(save=False)

    competition = batch.competition
    filename = batch.original_filename
    batch_id = batch.id
    batch.delete()
    write_audit_log(
        competition=competition,
        object_type="SourcePdfBatch",
        object_id=batch_id,
        action="batch_deleted",
        status="success",
        message=f"Deleted uploaded batch {filename}",
    )
