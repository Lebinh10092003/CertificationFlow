from rest_framework import serializers

from .models import Competition


class CompetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = [
            "id",
            "name",
            "slug",
            "academic_year",
            "competition_type",
            "subject",
            "email_template_subject",
            "email_template_body",
            "folder_naming_rule",
            "file_naming_rule",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["slug", "created_at", "updated_at"]
