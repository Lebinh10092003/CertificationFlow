from rest_framework import serializers

from .models import DataImportJob


class DataImportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataImportJob
        fields = [
            "id",
            "competition",
            "source_type",
            "source_filename",
            "source_file",
            "status",
            "row_count",
            "created_count",
            "updated_count",
            "skipped_count",
            "error_count",
            "details_json",
            "error_summary",
            "started_at",
            "finished_at",
            "created_at",
        ]
        read_only_fields = [
            "status",
            "row_count",
            "created_count",
            "updated_count",
            "skipped_count",
            "error_count",
            "details_json",
            "error_summary",
            "started_at",
            "finished_at",
            "created_at",
        ]


class WorkbookSheetInspectionSerializer(serializers.Serializer):
    name = serializers.CharField()
    row_count = serializers.IntegerField()
    column_count = serializers.IntegerField()
    detected_has_header = serializers.BooleanField()
    columns = serializers.ListField(child=serializers.CharField())
    header_columns = serializers.ListField(child=serializers.CharField())
    positional_columns = serializers.ListField(child=serializers.CharField())
    preview_matrix = serializers.ListField(child=serializers.ListField(child=serializers.CharField()))


class WorkbookInspectionSerializer(serializers.Serializer):
    import_job = DataImportJobSerializer()
    inspection = serializers.DictField()


class ImportExecutionSerializer(serializers.Serializer):
    import_job_id = serializers.IntegerField()
    selected_sheets = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    has_header = serializers.BooleanField()
    mapping = serializers.DictField(child=serializers.CharField(allow_blank=True), allow_empty=False)
