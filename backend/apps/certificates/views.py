import json

from django.shortcuts import get_object_or_404
from django.http import FileResponse, HttpResponse
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.logging import write_audit_log
from apps.competitions.models import Competition

from .models import CertificateExtraction, CertificateMatch, CertificatePage, SourcePdfBatch
from .serializers import (
    BatchCompetitionConfirmationSerializer,
    BatchExportRequestSerializer,
    BatchPageCorrectionSerializer,
    BulkMatchReviewSerializer,
    CertificateMatchSerializer,
    CertificatePageSerializer,
    CompetitionExportRequestSerializer,
    PublicCertificateSerializer,
    SourcePdfBatchSerializer,
)
from .services.delivery import batch_delivery_pages, delete_source_batch, ensure_public_identity
from .services.exporting import (
    build_batch_export_workbook,
    build_batches_export_workbook,
    get_batch_export_columns,
    get_batches_export_columns,
)
from .tasks import analyze_source_batch_task, process_source_batch_task


def _request_payload(request):
    payload_json = request.data.get("payload_json")
    if not payload_json:
        return request.data
    try:
        return json.loads(payload_json)
    except json.JSONDecodeError as error:
        raise ValidationError("Invalid export payload") from error


class SourcePdfBatchListCreateView(generics.ListCreateAPIView):
    serializer_class = SourcePdfBatchSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = SourcePdfBatch.objects.select_related("competition").prefetch_related("pages")
        competition_id = self.request.query_params.get("competition")
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        return queryset

    def create(self, request, *args, **kwargs):
        upload = request.FILES.get("file") or request.FILES.get("uploaded_file")
        if upload is None:
            return Response({"detail": "Missing uploaded PDF"}, status=status.HTTP_400_BAD_REQUEST)

        competition = None
        competition_id = request.data.get("competition_id")
        if competition_id not in (None, ""):
            try:
                competition = Competition.objects.get(pk=competition_id)
            except Competition.DoesNotExist:
                return Response({"detail": "Competition does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        processing_mode = request.data.get(
            "processing_mode",
            SourcePdfBatch.ProcessingMode.SPLIT_EXTRACT_MATCH,
        )
        batch = SourcePdfBatch.objects.create(
            competition=competition,
            uploaded_file=upload,
            original_filename=upload.name,
            processing_mode=processing_mode,
            options_json={},
        )
        analyze_source_batch_task.delay(batch.id)
        serializer = self.get_serializer(batch)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SourcePdfBatchDetailView(generics.RetrieveDestroyAPIView):
    queryset = SourcePdfBatch.objects.select_related("competition").prefetch_related("pages__extraction", "pages__match")
    serializer_class = SourcePdfBatchSerializer

    def delete(self, request, *args, **kwargs):
        batch = self.get_object()
        try:
            delete_source_batch(batch)
        except ValidationError as error:
            return Response({"detail": error.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SourcePdfBatchConfirmCompetitionView(APIView):
    def post(self, request, batch_id: int):
        batch = get_object_or_404(SourcePdfBatch, pk=batch_id)
        serializer = BatchCompetitionConfirmationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        competition = get_object_or_404(Competition, pk=serializer.validated_data["competition_id"])
        confirmed_name = serializer.validated_data.get("confirmed_competition_name", "").strip() or competition.name

        batch.competition = competition
        batch.confirmed_competition_name = confirmed_name
        batch.competition_confirmation_status = (
            SourcePdfBatch.ConfirmationStatus.CONFIRMED
            if confirmed_name == batch.inferred_competition_name
            else SourcePdfBatch.ConfirmationStatus.OVERRIDDEN
        )
        batch.status = SourcePdfBatch.Status.READY
        batch.save()
        write_audit_log(
            competition=competition,
            object_type="SourcePdfBatch",
            object_id=batch.id,
            action="competition_confirmed",
            status="success",
            message=f"Confirmed competition for batch {batch.original_filename}",
        )
        return Response(SourcePdfBatchSerializer(batch).data)


class SourcePdfBatchProcessView(APIView):
    def post(self, request, batch_id: int):
        batch = get_object_or_404(SourcePdfBatch, pk=batch_id)
        if not batch.competition_id:
            return Response({"detail": "Competition must be confirmed before processing"}, status=status.HTTP_400_BAD_REQUEST)
        process_source_batch_task.delay(batch.id)
        return Response(SourcePdfBatchSerializer(batch).data)


class SourcePdfBatchExportView(APIView):
    def get(self, request, batch_id: int):
        batch = get_object_or_404(SourcePdfBatch.objects.select_related("competition"), pk=batch_id)
        if not batch_delivery_pages(batch).exists():
            return Response({"detail": "No approved certificate pages are ready for export"}, status=status.HTTP_400_BAD_REQUEST)
        filename, payload = build_batch_export_workbook(batch, request=request)
        response = HttpResponse(
            payload,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    def post(self, request, batch_id: int):
        batch = get_object_or_404(SourcePdfBatch.objects.select_related("competition"), pk=batch_id)
        if not batch_delivery_pages(batch).exists():
            return Response({"detail": "No approved certificate pages are ready for export"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            payload = _request_payload(request)
        except ValidationError as error:
            return Response({"detail": error.message}, status=status.HTTP_400_BAD_REQUEST)
        serializer = BatchExportRequestSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        columns = serializer.validated_data["columns"]
        if not columns:
            return Response({"detail": "Select at least one export column"}, status=status.HTTP_400_BAD_REQUEST)
        filename, payload = build_batch_export_workbook(
            batch,
            columns=columns,
            sheet_mode=serializer.validated_data["sheet_mode"],
            format_mode=serializer.validated_data["format_mode"],
            request=request,
        )
        response = HttpResponse(
            payload,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class SourcePdfBatchExportColumnsView(APIView):
    def get(self, request, batch_id: int):
        batch = get_object_or_404(SourcePdfBatch.objects.select_related("competition"), pk=batch_id)
        return Response(get_batch_export_columns(batch))


def _competition_export_batches(competition_id: int, batch_ids: list[int]):
    queryset = SourcePdfBatch.objects.select_related("competition").filter(
        competition_id=competition_id,
        pk__in=batch_ids,
    )
    batches = list(queryset)
    if len(batches) != len(set(batch_ids)):
        raise ValidationError("One or more selected uploaded files do not belong to this competition")
    return batches


class CompetitionExportColumnsView(APIView):
    def get(self, request, competition_id: int):
        raw_batch_ids = (request.query_params.get("batch_ids") or "").strip()
        if not raw_batch_ids:
            return Response({"detail": "Select at least one uploaded file"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            batch_ids = [int(value) for value in raw_batch_ids.split(",") if value.strip()]
        except ValueError:
            return Response({"detail": "Invalid uploaded file selection"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            batches = _competition_export_batches(competition_id, batch_ids)
        except ValidationError as error:
            return Response({"detail": error.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(get_batches_export_columns(batches))


class CompetitionExportView(APIView):
    def post(self, request, competition_id: int):
        try:
            payload = _request_payload(request)
        except ValidationError as error:
            return Response({"detail": error.message}, status=status.HTTP_400_BAD_REQUEST)
        serializer = CompetitionExportRequestSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        try:
            batches = _competition_export_batches(competition_id, serializer.validated_data["batch_ids"])
        except ValidationError as error:
            return Response({"detail": error.message}, status=status.HTTP_400_BAD_REQUEST)
        if not any(batch_delivery_pages(batch).exists() for batch in batches):
            return Response({"detail": "No approved certificate pages are ready for export"}, status=status.HTTP_400_BAD_REQUEST)
        columns = serializer.validated_data["columns"]
        if not columns:
            return Response({"detail": "Select at least one export column"}, status=status.HTTP_400_BAD_REQUEST)
        filename, payload = build_batches_export_workbook(
            batches,
            columns=columns,
            sheet_mode=serializer.validated_data["sheet_mode"],
            format_mode=serializer.validated_data["format_mode"],
            request=request,
        )
        response = HttpResponse(
            payload,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class CertificatePageListView(generics.ListAPIView):
    serializer_class = CertificatePageSerializer

    def get_queryset(self):
        queryset = CertificatePage.objects.select_related(
            "source_batch",
            "source_batch__competition",
            "extraction",
            "match",
            "match__competition_enrollment",
            "match__competition_enrollment__participant",
        )
        batch_id = self.request.query_params.get("batch")
        batch_ids = self.request.query_params.get("batch_ids")
        competition_id = self.request.query_params.get("competition")
        if batch_id:
            queryset = queryset.filter(source_batch_id=batch_id)
        if batch_ids:
            try:
                parsed_batch_ids = [int(value) for value in batch_ids.split(",") if value.strip()]
            except ValueError:
                parsed_batch_ids = []
            if parsed_batch_ids:
                queryset = queryset.filter(source_batch_id__in=parsed_batch_ids)
        if competition_id:
            queryset = queryset.filter(source_batch__competition_id=competition_id)
        return queryset


class CertificatePagePdfView(APIView):
    def get(self, request, page_id: int):
        page = get_object_or_404(CertificatePage, pk=page_id)
        if not page.split_pdf_file:
            return Response({"detail": "Split PDF is not available"}, status=status.HTTP_404_NOT_FOUND)

        filename = page.output_filename or page.split_pdf_file.name.rsplit("/", 1)[-1]
        response = FileResponse(
            page.split_pdf_file.open("rb"),
            content_type="application/pdf",
            as_attachment=False,
            filename=filename,
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response


class CertificatePageDetailUpdateView(generics.RetrieveUpdateAPIView):
    queryset = CertificatePage.objects.select_related("extraction", "match", "source_batch")
    serializer_class = CertificatePageSerializer

    def patch(self, request, *args, **kwargs):
        page = self.get_object()
        extraction = page.extraction
        serializer = BatchPageCorrectionSerializer(extraction, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        match_defaults = {}
        competition_enrollment = serializer.validated_data.get("competition_enrollment")
        competition_result = serializer.validated_data.get("competition_result")
        if competition_enrollment is not None or competition_result is not None:
            match_defaults.update(
                {
                    "competition_enrollment": competition_enrollment,
                    "competition_result": competition_result,
                    "matched_by": CertificateMatch.MatchedBy.MANUAL,
                    "confidence_score": 100,
                    "confidence_label": CertificateMatch.ConfidenceLabel.HIGH,
                    "requires_review": False,
                    "is_approved": True,
                    "reviewed_at": timezone.now(),
                    "rationale": "Manual match update",
                }
            )
            CertificateMatch.objects.update_or_create(certificate_page=page, defaults=match_defaults)
            page.processing_status = CertificatePage.ProcessingStatus.MATCHED
            page.save(update_fields=["processing_status", "updated_at"])
            ensure_public_identity(page, request=request)

        return Response(CertificatePageSerializer(page).data)


class CertificateMatchListView(generics.ListAPIView):
    serializer_class = CertificateMatchSerializer

    def get_queryset(self):
        queryset = CertificateMatch.objects.select_related(
            "certificate_page",
            "certificate_page__extraction",
            "competition_enrollment__participant",
            "competition_result",
        )
        competition_id = self.request.query_params.get("competition")
        confidence = self.request.query_params.get("confidence")
        if competition_id:
            queryset = queryset.filter(certificate_page__source_batch__competition_id=competition_id)
        if confidence and confidence != "all":
            queryset = queryset.filter(confidence_label=confidence)
        return queryset


class CertificateMatchApproveView(APIView):
    def post(self, request, match_id: int):
        match = get_object_or_404(CertificateMatch, pk=match_id)
        match.is_approved = True
        match.requires_review = False
        match.reviewed_at = timezone.now()
        match.save(update_fields=["is_approved", "requires_review", "reviewed_at", "updated_at"])
        page = match.certificate_page
        page.processing_status = CertificatePage.ProcessingStatus.MATCHED
        page.save(update_fields=["processing_status", "updated_at"])
        ensure_public_identity(page, request=request)
        return Response(CertificateMatchSerializer(match).data)


class CertificateMatchBulkReviewView(APIView):
    def post(self, request):
        serializer = BulkMatchReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        matches = list(
            CertificateMatch.objects.select_related("certificate_page")
            .filter(pk__in=serializer.validated_data["match_ids"])
        )
        approved = serializer.validated_data["approved"]
        reviewed_at = timezone.now()

        for match in matches:
            match.is_approved = approved
            match.requires_review = not approved
            match.reviewed_at = reviewed_at
            match.save(update_fields=["is_approved", "requires_review", "reviewed_at", "updated_at"])

            page = match.certificate_page
            if approved:
                page.processing_status = CertificatePage.ProcessingStatus.MATCHED
                page.save(update_fields=["processing_status", "updated_at"])
                ensure_public_identity(page, request=request)
            elif page.processing_status == CertificatePage.ProcessingStatus.MATCHED:
                page.processing_status = CertificatePage.ProcessingStatus.REVIEW_REQUIRED
                page.save(update_fields=["processing_status", "updated_at"])

        return Response(
            {
                "match_ids": [match.id for match in matches],
                "approved": approved,
                "processed_count": len(matches),
            }
        )


class PublicCertificateDetailView(generics.RetrieveAPIView):
    lookup_field = "public_slug"
    serializer_class = PublicCertificateSerializer
    queryset = CertificatePage.objects.select_related(
        "source_batch",
        "source_batch__competition",
        "extraction",
        "match",
        "match__competition_enrollment__participant",
        "match__competition_result",
    ).filter(match__is_approved=True)
