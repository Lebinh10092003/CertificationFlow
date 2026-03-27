from django.db import models


class AuditLog(models.Model):
    class Status(models.TextChoices):
        INFO = "info", "Info"
        SUCCESS = "success", "Success"
        WARNING = "warning", "Warning"
        ERROR = "error", "Error"

    competition = models.ForeignKey(
        "competitions.Competition",
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        null=True,
        blank=True,
    )
    actor = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        null=True,
        blank=True,
    )
    object_type = models.CharField(max_length=120, blank=True)
    object_id = models.CharField(max_length=120, blank=True)
    action = models.CharField(max_length=120)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.INFO)
    message = models.TextField()
    details_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} [{self.status}]"
