from __future__ import annotations

from dataclasses import dataclass

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from apps.certificates.models import CertificateMatch, CertificatePage
from apps.certificates.services.matching import rematch_competition_pages
from apps.common.logging import write_audit_log
from apps.participants.models import CompetitionEnrollment, CompetitionResult, Participant

from ..models import DataImportJob


@dataclass
class ImportDeletionSummary:
    deleted_results: int = 0
    deleted_enrollments: int = 0
    deleted_participants: int = 0
    rematched_pages: int = 0
    affected_matches: int = 0


@transaction.atomic
def delete_import_job(job: DataImportJob) -> ImportDeletionSummary:
    if job.status == DataImportJob.Status.PROCESSING:
        raise ValidationError("Cannot delete an import job while it is processing")

    summary = ImportDeletionSummary()
    competition = job.competition

    results = CompetitionResult.objects.select_related(
        "competition_enrollment__participant",
    ).filter(import_job=job)
    result_ids = list(results.values_list("id", flat=True))
    enrollment_ids = list(results.values_list("competition_enrollment_id", flat=True))

    affected_matches = CertificateMatch.objects.filter(
        Q(competition_result_id__in=result_ids) | Q(competition_enrollment_id__in=enrollment_ids)
    )
    affected_page_ids = list(affected_matches.values_list("certificate_page_id", flat=True).distinct())
    summary.affected_matches = affected_matches.count()

    now = timezone.now()
    if summary.affected_matches:
        affected_matches.update(
            competition_enrollment=None,
            competition_result=None,
            confidence_score=0,
            confidence_label=CertificateMatch.ConfidenceLabel.LOW,
            matched_by=CertificateMatch.MatchedBy.UNMATCHED,
            requires_review=True,
            is_approved=False,
            reviewed_at=None,
            rationale="Source import job deleted",
            updated_at=now,
        )
        CertificatePage.objects.filter(pk__in=affected_page_ids).update(
            processing_status=CertificatePage.ProcessingStatus.REVIEW_REQUIRED,
            updated_at=now,
        )

    summary.deleted_results = results.count()
    if summary.deleted_results:
        results.delete()

    empty_enrollments = CompetitionEnrollment.objects.filter(pk__in=enrollment_ids).annotate(
        result_count=Count("results"),
    ).filter(result_count=0)
    participant_ids = list(empty_enrollments.values_list("participant_id", flat=True))
    summary.deleted_enrollments = empty_enrollments.count()
    if summary.deleted_enrollments:
        empty_enrollments.delete()

    empty_participants = Participant.objects.filter(pk__in=participant_ids).annotate(
        enrollment_count=Count("enrollments"),
    ).filter(enrollment_count=0)
    summary.deleted_participants = empty_participants.count()
    if summary.deleted_participants:
        empty_participants.delete()

    summary.rematched_pages = rematch_competition_pages(competition)

    if job.source_file:
        job.source_file.delete(save=False)

    job_id = job.id
    source_filename = job.source_filename or job.source_type
    job.delete()

    write_audit_log(
        competition=competition,
        object_type="DataImportJob",
        object_id=job_id,
        action="import_deleted",
        status="success",
        message=f"Deleted import job {source_filename}",
        details=summary.__dict__,
    )
    return summary
