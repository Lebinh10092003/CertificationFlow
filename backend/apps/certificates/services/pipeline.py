from __future__ import annotations

import io
from pathlib import Path

import fitz
import pytesseract
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from PIL import Image
from rapidfuzz import fuzz, process
from pytesseract import TesseractNotFoundError

from apps.common.logging import write_audit_log
from apps.common.text import normalize_text, slugify_filename
from apps.competitions.models import Competition

from ..models import CertificateExtraction, CertificatePage, SourcePdfBatch
from .matching import match_certificate_page
from .parsing import parse_certificate_text, text_is_sparse


def _configure_tesseract():
    if settings.PYTESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = settings.PYTESSERACT_CMD


def _pixmap_png_bytes(page: fitz.Page) -> bytes:
    return page.get_pixmap(matrix=fitz.Matrix(2, 2)).tobytes("png")


def _ocr_png_bytes(image_bytes: bytes) -> str:
    _configure_tesseract()
    image = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(image, lang="eng")


def _extract_page_text(page: fitz.Page) -> tuple[str, str, bool]:
    text = page.get_text("text") or ""
    if not text_is_sparse(text):
        return text, CertificateExtraction.ExtractionMethod.TEXT, True

    image_bytes = _pixmap_png_bytes(page)
    try:
        ocr_text = _ocr_png_bytes(image_bytes)
    except TesseractNotFoundError:
        return text, CertificateExtraction.ExtractionMethod.TEXT, bool(text.strip())

    if text.strip():
        return f"{text}\n{ocr_text}".strip(), CertificateExtraction.ExtractionMethod.TEXT_PLUS_OCR, bool(text.strip())
    return ocr_text, CertificateExtraction.ExtractionMethod.OCR, False


def infer_competition_name(source_batch: SourcePdfBatch) -> str:
    document = fitz.open(source_batch.uploaded_file.path)
    snippets = []
    for page_number in range(min(3, document.page_count)):
        page = document.load_page(page_number)
        text, _, _ = _extract_page_text(page)
        snippets.append(text)
    combined_text = "\n".join(snippets)

    competition_names = list(Competition.objects.values_list("name", flat=True))
    if competition_names:
        best = process.extractOne(combined_text, competition_names, scorer=fuzz.partial_ratio)
        if best and best[1] >= 60:
            return best[0]

    lines = [line.strip() for line in combined_text.splitlines() if line.strip()]
    for line in lines[:10]:
        if len(line) > 10:
            return line
    return ""


def analyze_source_batch(source_batch: SourcePdfBatch) -> SourcePdfBatch:
    document = fitz.open(source_batch.uploaded_file.path)
    source_batch.page_count = document.page_count
    source_batch.inferred_competition_name = infer_competition_name(source_batch)
    source_batch.status = SourcePdfBatch.Status.AWAITING_CONFIRMATION
    source_batch.save(update_fields=["page_count", "inferred_competition_name", "status"])
    write_audit_log(
        competition=source_batch.competition,
        object_type="SourcePdfBatch",
        object_id=source_batch.id,
        action="batch_analyzed",
        status="success",
        message=f"Detected {source_batch.page_count} pages and inferred competition name",
        details={"inferred_competition_name": source_batch.inferred_competition_name},
    )
    return source_batch


def _render_output_filename(source_batch: SourcePdfBatch, extraction: CertificateExtraction, page_number: int) -> str:
    context = {
        "student_name": extraction.student_name or f"page_{page_number}",
        "award": extraction.award or "award",
        "subject": extraction.subject or source_batch.competition.subject if source_batch.competition else "",
        "competition": source_batch.competition.name if source_batch.competition else source_batch.confirmed_competition_name,
        "year": source_batch.competition.academic_year if source_batch.competition else "",
        "cert_code": extraction.certificate_code or "",
    }
    rule = source_batch.competition.file_naming_rule if source_batch.competition else "{student_name}_{award}_{subject}.pdf"
    rendered = rule.format_map({key: value or "" for key, value in context.items()})
    if not rendered.lower().endswith(".pdf"):
        rendered += ".pdf"
    return slugify_filename(rendered)


@transaction.atomic
def split_and_process_source_batch(source_batch: SourcePdfBatch):
    source_batch.status = SourcePdfBatch.Status.PROCESSING
    source_batch.started_at = timezone.now()
    source_batch.save(update_fields=["status", "started_at"])

    source_batch.pages.all().delete()
    document = fitz.open(source_batch.uploaded_file.path)

    for page_index in range(document.page_count):
        source_page = document.load_page(page_index)
        split_document = fitz.open()
        split_document.insert_pdf(document, from_page=page_index, to_page=page_index)
        split_pdf_bytes = split_document.tobytes()
        preview_bytes = _pixmap_png_bytes(source_page)

        certificate_page = CertificatePage(
            source_batch=source_batch,
            page_number=page_index + 1,
            processing_status=CertificatePage.ProcessingStatus.SPLIT,
            output_filename=f"page_{page_index + 1}.pdf",
        )
        certificate_page.split_pdf_file.save(
            f"page_{page_index + 1}.pdf",
            ContentFile(split_pdf_bytes),
            save=False,
        )
        certificate_page.preview_image_file.save(
            f"page_{page_index + 1}.png",
            ContentFile(preview_bytes),
            save=False,
        )
        certificate_page.save()

        if source_batch.processing_mode == SourcePdfBatch.ProcessingMode.SPLIT_ONLY:
            continue

        text, extraction_method, has_text_layer = _extract_page_text(source_page)
        parsed = parse_certificate_text(text)
        extraction, _ = CertificateExtraction.objects.update_or_create(
            certificate_page=certificate_page,
            defaults={
                "extraction_method": extraction_method,
                "raw_text": text,
                **parsed,
            },
        )
        certificate_page.has_text_layer = has_text_layer
        certificate_page.output_filename = _render_output_filename(source_batch, extraction, certificate_page.page_number)
        certificate_page.processing_status = CertificatePage.ProcessingStatus.EXTRACTED
        certificate_page.save(update_fields=["has_text_layer", "output_filename", "processing_status", "updated_at"])

        if source_batch.processing_mode in {
            SourcePdfBatch.ProcessingMode.SPLIT_EXTRACT_MATCH,
            SourcePdfBatch.ProcessingMode.FULL_PIPELINE,
        }:
            match = match_certificate_page(certificate_page)
            certificate_page.processing_status = (
                CertificatePage.ProcessingStatus.REVIEW_REQUIRED
                if match.requires_review
                else CertificatePage.ProcessingStatus.MATCHED
            )
            certificate_page.save(update_fields=["processing_status", "updated_at"])

    source_batch.status = SourcePdfBatch.Status.COMPLETED
    source_batch.finished_at = timezone.now()
    source_batch.save(update_fields=["status", "finished_at"])
    write_audit_log(
        competition=source_batch.competition,
        object_type="SourcePdfBatch",
        object_id=source_batch.id,
        action="batch_processed",
        status="success",
        message=f"Processed {document.page_count} certificate pages",
    )
    return source_batch
