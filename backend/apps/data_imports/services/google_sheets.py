from __future__ import annotations

import json

from django.conf import settings
from django.utils import timezone
from google.oauth2 import service_account
from googleapiclient.discovery import build

from apps.common.logging import write_audit_log
from apps.competitions.models import IntegrationConfig

from ..models import DataImportJob
from .tabular import import_rows


def fetch_google_sheet_rows(config: IntegrationConfig) -> list[dict]:
    if not config.sheets_spreadsheet_id or not config.sheets_worksheet_name:
        raise ValueError("Google Sheets integration is not configured")
    credentials_payload = config.sheets_credentials_json or settings.GOOGLE_SERVICE_ACCOUNT_JSON
    if not credentials_payload:
        raise ValueError("Missing Google service account credentials")

    credentials_info = json.loads(credentials_payload)
    credentials = service_account.Credentials.from_service_account_info(
        credentials_info,
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"],
    )
    service = build("sheets", "v4", credentials=credentials, cache_discovery=False)
    result = (
        service.spreadsheets()
        .values()
        .get(
            spreadsheetId=config.sheets_spreadsheet_id,
            range=config.sheets_worksheet_name,
        )
        .execute()
    )
    values = result.get("values", [])
    if not values:
        return []
    headers = values[0]
    return [dict(zip(headers, row + [""] * (len(headers) - len(row)))) for row in values[1:]]


def validate_google_sheet_config(config: IntegrationConfig):
    if not config.sheets_spreadsheet_id or not config.sheets_worksheet_name:
        raise ValueError("Google Sheets integration is not configured")
    if not (config.sheets_credentials_json or settings.GOOGLE_SERVICE_ACCOUNT_JSON):
        raise ValueError("Missing Google service account credentials")


def sync_google_sheet(job: DataImportJob):
    config = job.competition.integration_config
    rows = fetch_google_sheet_rows(config)
    summary = import_rows(
        competition=job.competition,
        rows=rows,
        import_job=job,
        imported_source=job.source_type,
    )
    config.last_sheets_sync_at = timezone.now()
    config.is_sheets_connected = True
    config.save(update_fields=["last_sheets_sync_at", "is_sheets_connected", "updated_at"])
    write_audit_log(
        competition=job.competition,
        object_type="IntegrationConfig",
        object_id=config.id,
        action="google_sheet_sync",
        status="success",
        message=f"Synchronized {summary.row_count} rows from Google Sheets",
    )
    return summary
