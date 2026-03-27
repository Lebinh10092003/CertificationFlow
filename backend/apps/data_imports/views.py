from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.competitions.models import Competition

from .models import DataImportJob
from .serializers import DataImportJobSerializer, ImportExecutionSerializer
from .services.cleanup import delete_import_job
from .services.tabular import import_prepared_rows
from .services.workbook import inspect_tabular_file, normalize_selected_sheets
from .tasks import process_import_job


class DataImportJobListView(generics.ListAPIView):
    serializer_class = DataImportJobSerializer

    def get_queryset(self):
        queryset = DataImportJob.objects.select_related("competition")
        competition_id = self.request.query_params.get("competition")
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        return queryset


class DataImportJobDetailView(generics.RetrieveDestroyAPIView):
    queryset = DataImportJob.objects.select_related("competition")
    serializer_class = DataImportJobSerializer

    def delete(self, request, *args, **kwargs):
        job = self.get_object()
        try:
            delete_import_job(job)
        except ValidationError as error:
            return Response({"detail": error.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ImportFileUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, competition_id: int):
        competition = Competition.objects.get(pk=competition_id)
        upload = request.FILES.get("file")
        if upload is None:
            return Response({"detail": "Missing file"}, status=status.HTTP_400_BAD_REQUEST)

        lower_name = upload.name.lower()
        source_type = DataImportJob.SourceType.CSV if lower_name.endswith(".csv") else DataImportJob.SourceType.XLSX
        job = DataImportJob.objects.create(
            competition=competition,
            source_type=source_type,
            source_filename=upload.name,
            source_file=upload,
        )
        process_import_job.delay(job.id)
        return Response(DataImportJobSerializer(job).data, status=status.HTTP_201_CREATED)


class ImportFileInspectView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, competition_id: int):
        competition = get_object_or_404(Competition, pk=competition_id)
        upload = request.FILES.get("file")
        if upload is None:
            return Response({"detail": "Missing file"}, status=status.HTTP_400_BAD_REQUEST)

        lower_name = upload.name.lower()
        if lower_name.endswith(".csv"):
            source_type = DataImportJob.SourceType.CSV
        elif lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):
            source_type = DataImportJob.SourceType.XLSX
        else:
            return Response({"detail": "Unsupported import file type"}, status=status.HTTP_400_BAD_REQUEST)

        job = DataImportJob.objects.create(
            competition=competition,
            source_type=source_type,
            source_filename=upload.name,
            source_file=upload,
            status=DataImportJob.Status.INSPECTED,
        )
        try:
            inspection = inspect_tabular_file(job.source_file.path)
        except Exception as error:
            job.status = DataImportJob.Status.FAILED
            job.error_summary = str(error)
            job.save(update_fields=["status", "error_summary"])
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        job.details_json = {
            **(job.details_json or {}),
            "inspection": inspection,
        }
        job.save(update_fields=["details_json"])
        return Response(
            {
                "import_job": DataImportJobSerializer(job).data,
                "inspection": inspection,
            },
            status=status.HTTP_201_CREATED,
        )


class ImportFileExecuteView(APIView):
    def post(self, request, competition_id: int):
        competition = get_object_or_404(Competition, pk=competition_id)
        serializer = ImportExecutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        job = get_object_or_404(
            DataImportJob.objects.select_related("competition"),
            pk=serializer.validated_data["import_job_id"],
            competition=competition,
        )
        if not job.source_file:
            return Response({"detail": "The inspected upload file is missing"}, status=status.HTTP_400_BAD_REQUEST)
        if job.status != DataImportJob.Status.INSPECTED:
            return Response(
                {"detail": "This import job is no longer executable. Upload and inspect the file again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            prepared_rows = normalize_selected_sheets(
                job.source_file.path,
                selected_sheets=serializer.validated_data["selected_sheets"],
                has_header=serializer.validated_data["has_header"],
                mapping=serializer.validated_data["mapping"],
            )
            import_prepared_rows(
                competition=competition,
                prepared_rows=prepared_rows,
                import_job=job,
                imported_source=job.source_type,
            )
        except Exception as error:
            job.status = DataImportJob.Status.FAILED
            job.error_summary = str(error)
            job.save(update_fields=["status", "error_summary"])
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DataImportJobSerializer(job).data)
