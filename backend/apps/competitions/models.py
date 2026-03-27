from django.db import models
from django.utils.text import slugify


class Competition(models.Model):
    class CompetitionType(models.TextChoices):
        OLYMPIAD = "olympiad", "Olympiad"
        CONTEST = "contest", "Contest"
        EXAM = "exam", "Exam"
        FAIR = "fair", "Fair"
        OTHER = "other", "Other"

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    academic_year = models.CharField(max_length=100, blank=True)
    competition_type = models.CharField(
        max_length=32,
        choices=CompetitionType.choices,
        default=CompetitionType.CONTEST,
    )
    subject = models.CharField(max_length=120, blank=True)
    email_template_subject = models.CharField(max_length=255, blank=True)
    email_template_body = models.TextField(blank=True)
    folder_naming_rule = models.CharField(max_length=255, default="{competition}_{year}")
    file_naming_rule = models.CharField(
        max_length=255,
        default="{student_name}_{award}_{subject}.pdf",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "academic_year"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f"{self.name}-{self.academic_year}".strip("-")) or slugify(self.name) or "competition"
            slug = base_slug
            counter = 2
            while Competition.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} {self.academic_year}".strip()


class IntegrationConfig(models.Model):
    competition = models.OneToOneField(
        Competition,
        on_delete=models.CASCADE,
        related_name="integration_config",
    )
    sheets_spreadsheet_id = models.CharField(max_length=255, blank=True)
    sheets_worksheet_name = models.CharField(max_length=255, blank=True)
    sheets_credentials_json = models.TextField(blank=True)
    drive_folder_id = models.CharField(max_length=255, blank=True)
    drive_folder_url = models.URLField(blank=True)
    gmail_sender = models.EmailField(blank=True)
    is_sheets_connected = models.BooleanField(default=False)
    is_drive_connected = models.BooleanField(default=False)
    is_email_connected = models.BooleanField(default=False)
    last_sheets_sync_at = models.DateTimeField(null=True, blank=True)
    last_drive_check_at = models.DateTimeField(null=True, blank=True)
    last_email_check_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Integrations for {self.competition}"
