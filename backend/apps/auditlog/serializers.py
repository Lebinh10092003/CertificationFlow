from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "competition",
            "actor",
            "object_type",
            "object_id",
            "action",
            "status",
            "message",
            "details_json",
            "created_at",
        ]
