from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auditlog.models import AuditLog
from apps.certificates.models import CertificateMatch, CertificatePage, SourcePdfBatch
from apps.participants.models import CompetitionEnrollment

from .models import Competition
from .serializers import CompetitionSerializer


class CompetitionListCreateView(generics.ListCreateAPIView):
    queryset = Competition.objects.all().prefetch_related("integration_config")
    serializer_class = CompetitionSerializer


class CompetitionDetailView(generics.RetrieveUpdateAPIView):
    queryset = Competition.objects.all().prefetch_related("integration_config")
    serializer_class = CompetitionSerializer


class DashboardSummaryView(APIView):
    def get(self, request):
        competition_id = request.query_params.get("competition")
        competition = Competition.objects.filter(pk=competition_id).first() if competition_id else Competition.objects.first()

        if not competition:
            return Response(
                {
                    "competition": None,
                    "stats": {
                    "total_students": 0,
                    "certificates_processed": 0,
                    "emails_sent": 0,
                    "public_links": 0,
                },
                "recent_activities": [],
                "pending_tasks": [],
                }
            )

        total_students = CompetitionEnrollment.objects.filter(competition=competition).count()
        page_stats = CertificatePage.objects.filter(source_batch__competition=competition).aggregate(
            certificates_processed=Count("id"),
            public_links=Count("id", filter=Q(public_url__gt="")),
            emails_sent=Count("id", filter=Q(email_status=CertificatePage.ExternalStatus.UPDATED)),
        )
        recent_logs = AuditLog.objects.filter(competition=competition)[:10]
        pending_review = CertificateMatch.objects.filter(
            certificate_page__source_batch__competition=competition,
            requires_review=True,
            is_approved=False,
        ).count()
        pending_batches = SourcePdfBatch.objects.filter(
            competition=competition,
            status__in=[SourcePdfBatch.Status.AWAITING_CONFIRMATION, SourcePdfBatch.Status.PROCESSING],
        ).count()

        payload = {
            "competition": CompetitionSerializer(competition).data,
            "stats": {
                "total_students": total_students,
                "certificates_processed": page_stats["certificates_processed"] or 0,
                "emails_sent": page_stats["emails_sent"] or 0,
                "public_links": page_stats["public_links"] or 0,
            },
            "recent_activities": [
                {
                    "id": log.id,
                    "action": log.action,
                    "status": log.status,
                    "message": log.message,
                    "timestamp": log.created_at,
                }
                for log in recent_logs
            ],
            "pending_tasks": [
                {
                    "task": "Review unmatched certificates",
                    "count": pending_review,
                    "priority": "high",
                    "link": "/match",
                },
                {
                    "task": "Check active PDF batches",
                    "count": pending_batches,
                    "priority": "medium",
                    "link": "/certificates",
                },
            ],
        }
        return Response(payload)
