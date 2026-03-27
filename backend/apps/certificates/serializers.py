from django.urls import reverse
from rest_framework import serializers

from apps.competitions.serializers import CompetitionSerializer
from apps.participants.models import CompetitionEnrollment, CompetitionResult

from .models import CertificateExtraction, CertificateMatch, CertificatePage, SourcePdfBatch
from .services.delivery import ensure_public_identity


class SourcePdfBatchSerializer(serializers.ModelSerializer):
    competition = CompetitionSerializer(read_only=True)
    page_total = serializers.SerializerMethodField()
    uploaded_file_url = serializers.SerializerMethodField()

    class Meta:
        model = SourcePdfBatch
        fields = [
            "id",
            "competition",
            "uploaded_file",
            "uploaded_file_url",
            "original_filename",
            "page_count",
            "page_total",
            "inferred_competition_name",
            "confirmed_competition_name",
            "competition_confirmation_status",
            "processing_mode",
            "options_json",
            "status",
            "started_at",
            "finished_at",
            "created_at",
        ]
        read_only_fields = [
            "page_count",
            "page_total",
            "inferred_competition_name",
            "confirmed_competition_name",
            "competition_confirmation_status",
            "status",
            "started_at",
            "finished_at",
            "created_at",
        ]

    def get_uploaded_file_url(self, obj):
        if not obj.uploaded_file:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.uploaded_file.url) if request else obj.uploaded_file.url

    def get_page_total(self, obj):
        return obj.pages.count()


class CertificateExtractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateExtraction
        fields = [
            "id",
            "extraction_method",
            "raw_text",
            "competition_name",
            "student_name",
            "normalized_student_name",
            "school_name",
            "normalized_school_name",
            "grade",
            "award",
            "subject",
            "certificate_code",
            "qualified_round",
            "warnings_json",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class CertificateMatchSerializer(serializers.ModelSerializer):
    matched_student_name = serializers.SerializerMethodField()
    matched_email = serializers.SerializerMethodField()
    matched_student_id = serializers.SerializerMethodField()

    class Meta:
        model = CertificateMatch
        fields = [
            "id",
            "certificate_page",
            "competition_enrollment",
            "competition_result",
            "confidence_score",
            "confidence_label",
            "matched_by",
            "requires_review",
            "is_approved",
            "reviewed_at",
            "rationale",
            "matched_student_name",
            "matched_email",
            "matched_student_id",
        ]
        read_only_fields = ["reviewed_at"]

    def get_matched_student_name(self, obj):
        return obj.competition_enrollment.participant.full_name if obj.competition_enrollment else ""

    def get_matched_email(self, obj):
        return obj.competition_enrollment.participant.email if obj.competition_enrollment else ""

    def get_matched_student_id(self, obj):
        return obj.competition_enrollment.participant.external_student_id if obj.competition_enrollment else ""


class CertificatePageSerializer(serializers.ModelSerializer):
    extraction = CertificateExtractionSerializer(read_only=True)
    match = CertificateMatchSerializer(read_only=True)
    preview_image_url = serializers.SerializerMethodField()
    split_pdf_url = serializers.SerializerMethodField()
    download_pdf_url = serializers.SerializerMethodField()
    public_url = serializers.SerializerMethodField()
    review_status = serializers.SerializerMethodField()
    export_ready = serializers.SerializerMethodField()

    class Meta:
        model = CertificatePage
        fields = [
            "id",
            "source_batch",
            "page_number",
            "split_pdf_url",
            "download_pdf_url",
            "preview_image_url",
            "output_filename",
            "processing_status",
            "has_text_layer",
            "public_slug",
            "public_url",
            "review_status",
            "export_ready",
            "email_status",
            "created_at",
            "updated_at",
            "extraction",
            "match",
        ]

    def get_preview_image_url(self, obj):
        if not obj.preview_image_file:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.preview_image_file.url) if request else obj.preview_image_file.url

    def get_split_pdf_url(self, obj):
        if not obj.split_pdf_file:
            return ""
        request = self.context.get("request")
        path = reverse("certificate-page-pdf", args=[obj.pk])
        return request.build_absolute_uri(path) if request else path

    def get_download_pdf_url(self, obj):
        if not obj.split_pdf_file:
            return ""
        request = self.context.get("request")
        path = f'{reverse("certificate-page-pdf", args=[obj.pk])}?download=1'
        return request.build_absolute_uri(path) if request else path

    def get_public_url(self, obj):
        request = self.context.get("request")
        return ensure_public_identity(obj, request=request).public_url

    def _match(self, obj):
        try:
            return obj.match
        except CertificateMatch.DoesNotExist:
            return None

    def _enrollment(self, obj):
        match = self._match(obj)
        return match.competition_enrollment if match and match.competition_enrollment else None

    def get_review_status(self, obj):
        match = self._match(obj)
        if not match or (not match.competition_enrollment and not match.competition_result):
            return "unmatched"
        if match.is_approved:
            return "approved"
        return "needs_review"

    def get_export_ready(self, obj):
        match = self._match(obj)
        return bool(match and match.is_approved and obj.public_url)


class PublicCertificateSerializer(serializers.ModelSerializer):
    split_pdf_url = serializers.SerializerMethodField()
    download_pdf_url = serializers.SerializerMethodField()
    public_url = serializers.SerializerMethodField()
    competition = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()
    grade = serializers.SerializerMethodField()
    award = serializers.SerializerMethodField()
    competition_name = serializers.SerializerMethodField()
    competition_code = serializers.SerializerMethodField()
    certificate_code = serializers.SerializerMethodField()
    qualified_round = serializers.SerializerMethodField()

    class Meta:
        model = CertificatePage
        fields = [
            "id",
            "page_number",
            "output_filename",
            "public_slug",
            "public_url",
            "split_pdf_url",
            "download_pdf_url",
            "student_name",
            "school_name",
            "grade",
            "award",
            "competition_name",
            "competition_code",
            "certificate_code",
            "qualified_round",
            "competition",
        ]

    def _extraction(self, obj):
        try:
            return obj.extraction
        except CertificateExtraction.DoesNotExist:
            return None

    def get_split_pdf_url(self, obj):
        if not obj.split_pdf_file:
            return ""
        request = self.context.get("request")
        path = reverse("certificate-page-pdf", args=[obj.pk])
        return request.build_absolute_uri(path) if request else path

    def get_download_pdf_url(self, obj):
        if not obj.split_pdf_file:
            return ""
        request = self.context.get("request")
        path = f'{reverse("certificate-page-pdf", args=[obj.pk])}?download=1'
        return request.build_absolute_uri(path) if request else path

    def get_public_url(self, obj):
        request = self.context.get("request")
        return ensure_public_identity(obj, request=request).public_url

    def get_competition(self, obj):
        competition = obj.source_batch.competition
        if not competition:
            return None
        return {
            "id": competition.id,
            "name": competition.name,
            "slug": competition.slug,
            "academic_year": competition.academic_year,
            "subject": competition.subject,
        }

    def get_student_name(self, obj):
        extraction = self._extraction(obj)
        if obj.match and obj.match.competition_enrollment:
            return obj.match.competition_enrollment.participant.full_name
        return extraction.student_name if extraction else ""

    def get_school_name(self, obj):
        extraction = self._extraction(obj)
        if obj.match and obj.match.competition_enrollment:
            return obj.match.competition_enrollment.participant.school_name
        return extraction.school_name if extraction else ""

    def get_grade(self, obj):
        extraction = self._extraction(obj)
        if extraction and extraction.grade:
            return extraction.grade
        if obj.match and obj.match.competition_enrollment:
            return obj.match.competition_enrollment.participant.grade
        return ""

    def get_award(self, obj):
        extraction = self._extraction(obj)
        if obj.match and obj.match.competition_result and obj.match.competition_result.award:
            return obj.match.competition_result.award
        return extraction.award if extraction else ""

    def get_competition_name(self, obj):
        extraction = self._extraction(obj)
        if extraction and extraction.competition_name:
            return extraction.competition_name
        return obj.source_batch.confirmed_competition_name or obj.source_batch.inferred_competition_name

    def get_competition_code(self, obj):
        extraction = self._extraction(obj)
        if extraction and extraction.subject:
            return extraction.subject
        if obj.source_batch.competition:
            return obj.source_batch.competition.subject
        return ""

    def get_certificate_code(self, obj):
        extraction = self._extraction(obj)
        return extraction.certificate_code if extraction else ""

    def get_qualified_round(self, obj):
        extraction = self._extraction(obj)
        return extraction.qualified_round if extraction else ""


class BatchCompetitionConfirmationSerializer(serializers.Serializer):
    competition_id = serializers.IntegerField()
    confirmed_competition_name = serializers.CharField(required=False, allow_blank=True)


class BulkMatchReviewSerializer(serializers.Serializer):
    match_ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False)
    approved = serializers.BooleanField()


class BatchPageCorrectionSerializer(serializers.ModelSerializer):
    competition_enrollment = serializers.PrimaryKeyRelatedField(
        queryset=CompetitionEnrollment.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    competition_result = serializers.PrimaryKeyRelatedField(
        queryset=CompetitionResult.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = CertificateExtraction
        fields = [
            "student_name",
            "school_name",
            "grade",
            "award",
            "subject",
            "certificate_code",
            "qualified_round",
            "competition_enrollment",
            "competition_result",
        ]


class ExportColumnSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()
    source_type = serializers.ChoiceField(choices=["source", "system"])


class BatchExportRequestSerializer(serializers.Serializer):
    columns = ExportColumnSerializer(many=True)
    sheet_mode = serializers.ChoiceField(choices=["split_by_competition", "single_sheet"], required=False, default="split_by_competition")
    format_mode = serializers.ChoiceField(choices=["business", "compact", "presentation"], required=False, default="business")


class CompetitionExportRequestSerializer(BatchExportRequestSerializer):
    batch_ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False)
