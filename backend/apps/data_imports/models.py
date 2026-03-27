from django.db import models


class DataImportJob(models.Model):
    class SourceType(models.TextChoices):
        CSV = "csv", "CSV"
        XLSX = "xlsx", "Excel"
        GOOGLE_SHEETS = "google_sheets", "Google Sheets"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        INSPECTED = "inspected", "Inspected"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    competition = models.ForeignKey(
        "competitions.Competition",
        on_delete=models.CASCADE,
        related_name="import_jobs",
    )
    source_type = models.CharField(max_length=32, choices=SourceType.choices)
    source_filename = models.CharField(max_length=255, blank=True)
    source_file = models.FileField(upload_to="imports/%Y/%m/%d/", null=True, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING)
    row_count = models.PositiveIntegerField(default=0)
    created_count = models.PositiveIntegerField(default=0)
    updated_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    details_json = models.JSONField(default=dict, blank=True)
    error_summary = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_source_type_display()} import #{self.pk}"
