from django.db.models import Q
from rest_framework import generics

from .models import CompetitionEnrollment
from .serializers import CompetitionEnrollmentSerializer


class CompetitionStudentListView(generics.ListAPIView):
    serializer_class = CompetitionEnrollmentSerializer

    def get_queryset(self):
        queryset = (
            CompetitionEnrollment.objects.select_related("participant", "competition")
            .prefetch_related("results")
        )
        competition_id = self.request.query_params.get("competition")
        search = self.request.query_params.get("search", "").strip()
        award = self.request.query_params.get("award", "").strip()
        status = self.request.query_params.get("status", "").strip()

        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        if search:
            queryset = queryset.filter(
                Q(participant__full_name__icontains=search)
                | Q(participant__email__icontains=search)
                | Q(results__certificate_code__icontains=search)
            )
        if award:
            queryset = queryset.filter(results__award=award)
        if status:
            queryset = queryset.filter(results__certificate_matches__certificate_page__email_status=status)
        return queryset.distinct()
