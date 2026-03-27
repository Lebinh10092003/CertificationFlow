from rest_framework import serializers

from apps.certificates.models import CertificateMatch
from apps.certificates.services.delivery import ensure_public_identity

from .models import CompetitionEnrollment, CompetitionResult, Participant


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = [
            "id",
            "external_student_id",
            "full_name",
            "normalized_name",
            "email",
            "school_name",
            "normalized_school_name",
            "grade",
        ]


class CompetitionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompetitionResult
        fields = ["id", "award", "certificate_code", "qualified_round"]


class CompetitionEnrollmentSerializer(serializers.ModelSerializer):
    participant = ParticipantSerializer()
    results = CompetitionResultSerializer(many=True)
    certificate_url = serializers.SerializerMethodField()
    mail_status = serializers.SerializerMethodField()

    class Meta:
        model = CompetitionEnrollment
        fields = [
            "id",
            "source_row_number",
            "subject",
            "notes",
            "participant",
            "results",
            "certificate_url",
            "mail_status",
        ]

    def get_certificate_url(self, obj):
        result_ids = [result.id for result in obj.results.all()]
        match = (
            CertificateMatch.objects.select_related("certificate_page")
            .filter(competition_result_id__in=result_ids, is_approved=True)
            .first()
        )
        if not match:
            match = (
                CertificateMatch.objects.select_related("certificate_page")
                .filter(competition_enrollment=obj, is_approved=True)
                .first()
        )
        if not match:
            return ""
        return ensure_public_identity(match.certificate_page, request=self.context.get("request")).public_url or ""

    def get_mail_status(self, obj):
        result_ids = [result.id for result in obj.results.all()]
        match = (
            CertificateMatch.objects.select_related("certificate_page")
            .filter(competition_result_id__in=result_ids)
            .first()
        )
        return match.certificate_page.email_status if match else "pending"
