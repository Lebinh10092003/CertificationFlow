from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "competition", "action", "status", "object_type")
    search_fields = ("message", "object_type", "object_id", "action")
    list_filter = ("status", "action")
