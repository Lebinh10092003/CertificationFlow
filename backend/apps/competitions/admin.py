from django.contrib import admin

from .models import Competition, IntegrationConfig


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ("name", "academic_year", "competition_type", "subject", "is_active")
    search_fields = ("name", "academic_year", "subject")
    list_filter = ("competition_type", "is_active")


@admin.register(IntegrationConfig)
class IntegrationConfigAdmin(admin.ModelAdmin):
    list_display = ("competition", "is_sheets_connected", "is_drive_connected", "is_email_connected")
