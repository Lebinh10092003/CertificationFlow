from django.db import models


class Participant(models.Model):
    external_student_id = models.CharField(max_length=120, blank=True, db_index=True)
    full_name = models.CharField(max_length=255)
    normalized_name = models.CharField(max_length=255, db_index=True)
    email = models.EmailField(blank=True)
    school_name = models.CharField(max_length=255, blank=True)
    normalized_school_name = models.CharField(max_length=255, blank=True, db_index=True)
    grade = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name", "external_student_id"]

    def __str__(self):
        return self.full_name


class CompetitionEnrollment(models.Model):
    competition = models.ForeignKey(
        "competitions.Competition",
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    source_row_number = models.PositiveIntegerField(null=True, blank=True)
    source_sheet_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    sheet_row_key = models.CharField(max_length=120, blank=True)
    source_data_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("competition", "participant", "subject")
        ordering = ["competition", "source_row_number", "participant__full_name"]

    def __str__(self):
        return f"{self.participant} @ {self.competition}"


class CompetitionResult(models.Model):
    competition_enrollment = models.ForeignKey(
        CompetitionEnrollment,
        on_delete=models.CASCADE,
        related_name="results",
    )
    award = models.CharField(max_length=120, blank=True)
    certificate_code = models.CharField(max_length=120, blank=True, db_index=True)
    qualified_round = models.CharField(max_length=120, blank=True)
    imported_source = models.CharField(max_length=50, blank=True)
    import_job = models.ForeignKey(
        "data_imports.DataImportJob",
        on_delete=models.SET_NULL,
        related_name="results",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["competition_enrollment__source_row_number", "certificate_code", "pk"]

    def __str__(self):
        return self.certificate_code or f"Result #{self.pk}"
