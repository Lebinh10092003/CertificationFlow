from django.contrib import admin

from .models import CertificateExtraction, CertificateMatch, CertificatePage, SourcePdfBatch


@admin.register(SourcePdfBatch)
class SourcePdfBatchAdmin(admin.ModelAdmin):
    list_display = ("original_filename", "competition", "status", "page_count", "created_at")
    search_fields = ("original_filename", "inferred_competition_name", "confirmed_competition_name")
    list_filter = ("status", "competition_confirmation_status", "processing_mode")


@admin.register(CertificatePage)
class CertificatePageAdmin(admin.ModelAdmin):
    list_display = ("source_batch", "page_number", "processing_status", "has_text_layer")
    list_filter = ("processing_status", "has_text_layer")


@admin.register(CertificateExtraction)
class CertificateExtractionAdmin(admin.ModelAdmin):
    list_display = ("certificate_page", "student_name", "award", "certificate_code", "extraction_method")
    search_fields = ("student_name", "certificate_code", "competition_name")


@admin.register(CertificateMatch)
class CertificateMatchAdmin(admin.ModelAdmin):
    list_display = ("certificate_page", "confidence_label", "matched_by", "requires_review", "is_approved")
    list_filter = ("confidence_label", "matched_by", "requires_review", "is_approved")
