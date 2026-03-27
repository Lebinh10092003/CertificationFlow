from django.db import models


class SourcePdfBatch(models.Model):
    class ConfirmationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        OVERRIDDEN = "overridden", "Overridden"

    class ProcessingMode(models.TextChoices):
        SPLIT_ONLY = "split_only", "Split Only"
        SPLIT_EXTRACT = "split_extract", "Split + Extract"
        SPLIT_EXTRACT_MATCH = "split_extract_match", "Split + Extract + Match"
        FULL_PIPELINE = "full_pipeline", "Full Pipeline"

    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        AWAITING_CONFIRMATION = "awaiting_confirmation", "Awaiting Confirmation"
        READY = "ready", "Ready"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    competition = models.ForeignKey(
        "competitions.Competition",
        on_delete=models.SET_NULL,
        related_name="pdf_batches",
        null=True,
        blank=True,
    )
    uploaded_file = models.FileField(upload_to="source_batches/%Y/%m/%d/")
    original_filename = models.CharField(max_length=255)
    page_count = models.PositiveIntegerField(default=0)
    inferred_competition_name = models.CharField(max_length=255, blank=True)
    confirmed_competition_name = models.CharField(max_length=255, blank=True)
    competition_confirmation_status = models.CharField(
        max_length=32,
        choices=ConfirmationStatus.choices,
        default=ConfirmationStatus.PENDING,
    )
    processing_mode = models.CharField(
        max_length=32,
        choices=ProcessingMode.choices,
        default=ProcessingMode.SPLIT_EXTRACT_MATCH,
    )
    options_json = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.UPLOADED)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.original_filename


class CertificatePage(models.Model):
    class ProcessingStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        SPLIT = "split", "Split"
        EXTRACTED = "extracted", "Extracted"
        MATCHED = "matched", "Matched"
        REVIEW_REQUIRED = "review_required", "Review Required"
        FAILED = "failed", "Failed"

    class ExternalStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        UPDATED = "updated", "Updated"
        FAILED = "failed", "Failed"

    source_batch = models.ForeignKey(
        SourcePdfBatch,
        on_delete=models.CASCADE,
        related_name="pages",
    )
    page_number = models.PositiveIntegerField()
    split_pdf_file = models.FileField(upload_to="certificate_pages/%Y/%m/%d/", null=True, blank=True)
    preview_image_file = models.ImageField(upload_to="certificate_previews/%Y/%m/%d/", null=True, blank=True)
    output_filename = models.CharField(max_length=255, blank=True)
    processing_status = models.CharField(
        max_length=32,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
    )
    has_text_layer = models.BooleanField(default=False)
    drive_file_id = models.CharField(max_length=255, blank=True)
    drive_file_url = models.URLField(blank=True)
    public_slug = models.SlugField(max_length=255, blank=True, null=True, unique=True)
    public_url = models.URLField(blank=True)
    sheet_write_status = models.CharField(
        max_length=32,
        choices=ExternalStatus.choices,
        default=ExternalStatus.PENDING,
    )
    email_status = models.CharField(
        max_length=32,
        choices=ExternalStatus.choices,
        default=ExternalStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("source_batch", "page_number")
        ordering = ["source_batch", "page_number"]

    def __str__(self):
        return f"{self.source_batch.original_filename} page {self.page_number}"


class CertificateExtraction(models.Model):
    class ExtractionMethod(models.TextChoices):
        TEXT = "text", "Text"
        OCR = "ocr", "OCR"
        TEXT_PLUS_OCR = "text_plus_ocr", "Text + OCR"

    certificate_page = models.OneToOneField(
        CertificatePage,
        on_delete=models.CASCADE,
        related_name="extraction",
    )
    extraction_method = models.CharField(
        max_length=32,
        choices=ExtractionMethod.choices,
        default=ExtractionMethod.TEXT,
    )
    raw_text = models.TextField(blank=True)
    competition_name = models.CharField(max_length=255, blank=True)
    student_name = models.CharField(max_length=255, blank=True)
    normalized_student_name = models.CharField(max_length=255, blank=True, db_index=True)
    school_name = models.CharField(max_length=255, blank=True)
    normalized_school_name = models.CharField(max_length=255, blank=True, db_index=True)
    grade = models.CharField(max_length=50, blank=True)
    award = models.CharField(max_length=120, blank=True)
    subject = models.CharField(max_length=120, blank=True)
    certificate_code = models.CharField(max_length=120, blank=True, db_index=True)
    qualified_round = models.CharField(max_length=120, blank=True)
    warnings_json = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Extraction for page {self.certificate_page_id}"


class CertificateMatch(models.Model):
    class ConfidenceLabel(models.TextChoices):
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"

    class MatchedBy(models.TextChoices):
        CERTIFICATE_CODE = "certificate_code", "Certificate Code"
        STUDENT_ID = "student_id", "Student ID"
        FUZZY_NAME = "fuzzy_name", "Fuzzy Name"
        MANUAL = "manual", "Manual"
        UNMATCHED = "unmatched", "Unmatched"

    certificate_page = models.OneToOneField(
        CertificatePage,
        on_delete=models.CASCADE,
        related_name="match",
    )
    competition_enrollment = models.ForeignKey(
        "participants.CompetitionEnrollment",
        on_delete=models.SET_NULL,
        related_name="certificate_matches",
        null=True,
        blank=True,
    )
    competition_result = models.ForeignKey(
        "participants.CompetitionResult",
        on_delete=models.SET_NULL,
        related_name="certificate_matches",
        null=True,
        blank=True,
    )
    confidence_score = models.FloatField(default=0)
    confidence_label = models.CharField(
        max_length=16,
        choices=ConfidenceLabel.choices,
        default=ConfidenceLabel.LOW,
    )
    matched_by = models.CharField(
        max_length=32,
        choices=MatchedBy.choices,
        default=MatchedBy.UNMATCHED,
    )
    requires_review = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rationale = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Match for page {self.certificate_page_id}"
