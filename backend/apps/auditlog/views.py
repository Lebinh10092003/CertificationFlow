from rest_framework import generics

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        queryset = AuditLog.objects.select_related("competition", "actor")
        competition_id = self.request.query_params.get("competition")
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        return queryset
