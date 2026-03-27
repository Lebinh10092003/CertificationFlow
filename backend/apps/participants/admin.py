from django.contrib import admin

from .models import CompetitionEnrollment, CompetitionResult, Participant


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("full_name", "external_student_id", "email", "school_name", "grade")
    search_fields = ("full_name", "external_student_id", "email", "school_name")


@admin.register(CompetitionEnrollment)
class CompetitionEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("competition", "participant", "source_row_number", "subject")
    search_fields = ("participant__full_name", "competition__name")
    list_filter = ("competition",)


@admin.register(CompetitionResult)
class CompetitionResultAdmin(admin.ModelAdmin):
    list_display = ("competition_enrollment", "award", "certificate_code", "qualified_round")
    search_fields = ("certificate_code", "competition_enrollment__participant__full_name")
