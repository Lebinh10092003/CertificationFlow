from django.contrib import admin

from .models import DataImportJob


@admin.register(DataImportJob)
class DataImportJobAdmin(admin.ModelAdmin):
    list_display = ("id", "competition", "source_type", "status", "row_count", "created_at")
    search_fields = ("source_filename", "competition__name")
    list_filter = ("source_type", "status")
