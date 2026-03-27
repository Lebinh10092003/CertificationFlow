from __future__ import annotations

from dataclasses import dataclass

from rapidfuzz import fuzz

from apps.common.text import (
    infer_competition_code,
    normalize_award_value,
    normalize_grade_value,
    normalize_text,
)
from apps.competitions.models import Competition
from apps.participants.models import CompetitionEnrollment, CompetitionResult

from ..models import CertificateExtraction, CertificateMatch, CertificatePage


def _normalize_certificate_code(value: str) -> str:
    if not value:
        return ""
    return value.upper().replace(" ", "").replace("--", "-").strip()


def _values_align(left: str, right: str) -> bool:
    if not left or not right:
        return False
    return left == right or left in right or right in left


def _confidence_label(score: float) -> str:
    if score >= 90:
        return CertificateMatch.ConfidenceLabel.HIGH
    if score >= 75:
        return CertificateMatch.ConfidenceLabel.MEDIUM
    return CertificateMatch.ConfidenceLabel.LOW


@dataclass
class CandidateState:
    enrollment: CompetitionEnrollment
    result: CompetitionResult | None
    normalized_name: str
    normalized_grade: str
    normalized_subject: str
    normalized_school: str
    normalized_award: str


def _candidate_states(competition: Competition) -> list[CandidateState]:
    states: list[CandidateState] = []
    candidates = CompetitionEnrollment.objects.select_related("participant").prefetch_related("results").filter(
        competition=competition
    )
    for candidate in candidates:
        result = candidate.results.first()
        states.append(
            CandidateState(
                enrollment=candidate,
                result=result,
                normalized_name=candidate.participant.normalized_name,
                normalized_grade=normalize_grade_value(candidate.participant.grade),
                normalized_subject=infer_competition_code(candidate.subject or competition.subject),
                normalized_school=normalize_text(candidate.participant.school_name),
                normalized_award=normalize_award_value(result.award if result else ""),
            )
        )
    return states


def _match_defaults(rationale: str = "No match candidates found") -> dict:
    return {
        "competition_enrollment": None,
        "competition_result": None,
        "confidence_score": 0,
        "confidence_label": CertificateMatch.ConfidenceLabel.LOW,
        "matched_by": CertificateMatch.MatchedBy.UNMATCHED,
        "requires_review": True,
        "is_approved": False,
        "rationale": rationale,
    }


def _save_match(certificate_page: CertificatePage, defaults: dict) -> CertificateMatch:
    return CertificateMatch.objects.update_or_create(
        certificate_page=certificate_page,
        defaults=defaults,
    )[0]


def _disambiguate_exact_candidates(
    candidates: list[CandidateState],
    *,
    extracted_school: str,
    extracted_award: str,
) -> list[CandidateState]:
    if len(candidates) <= 1:
        return candidates

    school_filtered = [candidate for candidate in candidates if _values_align(extracted_school, candidate.normalized_school)]
    if len(school_filtered) == 1:
        return school_filtered
    if school_filtered:
        candidates = school_filtered

    award_filtered = [candidate for candidate in candidates if _values_align(extracted_award, candidate.normalized_award)]
    if len(award_filtered) == 1:
        return award_filtered
    if award_filtered:
        candidates = award_filtered

    return candidates


def match_certificate_page(certificate_page: CertificatePage) -> CertificateMatch:
    competition = certificate_page.source_batch.competition
    extraction: CertificateExtraction = certificate_page.extraction

    if not competition:
        return _save_match(certificate_page, _match_defaults())

    candidate_states = _candidate_states(competition)
    if not candidate_states:
        return _save_match(certificate_page, _match_defaults())

    extracted_code = _normalize_certificate_code(extraction.certificate_code.strip())
    extracted_name = normalize_text(extraction.student_name)
    extracted_award = normalize_award_value(extraction.award)
    extracted_grade = normalize_grade_value(extraction.grade)
    extracted_school = normalize_text(extraction.school_name)
    extracted_subject = infer_competition_code(extraction.subject or competition.subject)

    if extracted_code:
        exact_code_candidates = [
            candidate
            for candidate in candidate_states
            if candidate.result and _normalize_certificate_code(candidate.result.certificate_code) == extracted_code
        ]
        exact_code_candidates = _disambiguate_exact_candidates(
            exact_code_candidates,
            extracted_school=extracted_school,
            extracted_award=extracted_award,
        )
        if len(exact_code_candidates) == 1:
            exact = exact_code_candidates[0]
            return _save_match(
                certificate_page,
                {
                    "competition_enrollment": exact.enrollment,
                    "competition_result": exact.result,
                    "confidence_score": 100,
                    "confidence_label": CertificateMatch.ConfidenceLabel.HIGH,
                    "matched_by": CertificateMatch.MatchedBy.CERTIFICATE_CODE,
                    "requires_review": False,
                    "is_approved": False,
                    "rationale": "Exact certificate code match",
                },
            )
        if len(exact_code_candidates) > 1:
            return _save_match(
                certificate_page,
                _match_defaults("Certificate code is duplicated across multiple candidate rows"),
            )

    exact_key_candidates = [
        candidate
        for candidate in candidate_states
        if candidate.normalized_name == extracted_name
        and candidate.normalized_grade == extracted_grade
        and candidate.normalized_subject == extracted_subject
    ]
    exact_key_candidates = _disambiguate_exact_candidates(
        exact_key_candidates,
        extracted_school=extracted_school,
        extracted_award=extracted_award,
    )
    if len(exact_key_candidates) == 1:
        exact_candidate = exact_key_candidates[0]
        rationale = "Exact name, grade, and competition match"
        if extracted_school and _values_align(extracted_school, exact_candidate.normalized_school):
            rationale += "; school confirmed"
        if extracted_award and _values_align(extracted_award, exact_candidate.normalized_award):
            rationale += "; award confirmed"
        return _save_match(
            certificate_page,
            {
                "competition_enrollment": exact_candidate.enrollment,
                "competition_result": exact_candidate.result,
                "confidence_score": 98,
                "confidence_label": CertificateMatch.ConfidenceLabel.HIGH,
                "matched_by": CertificateMatch.MatchedBy.FUZZY_NAME,
                "requires_review": False,
                "is_approved": False,
                "rationale": rationale,
            },
        )
    if len(exact_key_candidates) > 1:
        return _save_match(
            certificate_page,
            _match_defaults("Duplicate workbook rows share the same name, grade, and competition"),
        )

    best_score = 0.0
    best_candidate: CandidateState | None = None
    for candidate in candidate_states:
        score = fuzz.token_sort_ratio(extracted_name, candidate.normalized_name) if extracted_name else 0.0

        if extracted_grade and candidate.normalized_grade == extracted_grade:
            score += 15
        elif extracted_grade:
            score -= 20

        if extracted_subject and candidate.normalized_subject == extracted_subject:
            score += 15
        elif extracted_subject:
            score -= 15

        if extracted_school and _values_align(extracted_school, candidate.normalized_school):
            score += 10
        elif extracted_school:
            score -= 5

        if extracted_award and _values_align(extracted_award, candidate.normalized_award):
            score += 8

        if score > best_score:
            best_score = score
            best_candidate = candidate

    if not best_candidate or best_score < 70:
        return _save_match(certificate_page, _match_defaults())

    medium_score = min(best_score, 89)
    return _save_match(
        certificate_page,
        {
            "competition_enrollment": best_candidate.enrollment,
            "competition_result": best_candidate.result,
            "confidence_score": medium_score,
            "confidence_label": _confidence_label(medium_score),
            "matched_by": CertificateMatch.MatchedBy.FUZZY_NAME,
            "requires_review": True,
            "is_approved": False,
            "rationale": f"Best fuzzy match after exact-key checks with score {medium_score}",
        },
    )


def rematch_competition_pages(competition: Competition) -> int:
    pages = (
        CertificatePage.objects.select_related("extraction", "match", "source_batch__competition")
        .filter(source_batch__competition=competition, extraction__isnull=False)
        .exclude(match__is_approved=True)
    )

    rematched_count = 0
    for page in pages:
        match = match_certificate_page(page)
        page.processing_status = (
            CertificatePage.ProcessingStatus.REVIEW_REQUIRED
            if match.requires_review
            else CertificatePage.ProcessingStatus.MATCHED
        )
        page.save(update_fields=["processing_status", "updated_at"])
        rematched_count += 1

    return rematched_count
