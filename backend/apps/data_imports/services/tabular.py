from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd
from django.db import transaction
from django.utils import timezone

from apps.certificates.services.matching import rematch_competition_pages
from apps.common.logging import write_audit_log
from apps.common.text import infer_competition_code, normalize_award_value, normalize_grade_value, normalize_text, safe_get
from apps.competitions.models import Competition
from apps.participants.models import CompetitionEnrollment, CompetitionResult, Participant

from ..models import DataImportJob


@dataclass
class ImportSummary:
    row_count: int = 0
    created_count: int = 0
    updated_count: int = 0
    skipped_count: int = 0
    error_count: int = 0


def _sheet_priority(sheet_name: str) -> tuple[int, str]:
    normalized = normalize_text(sheet_name)
    if "_output" in normalized or normalized.endswith(" output"):
        return (0, normalized)
    if "reg master" in normalized or "reg_master" in normalized:
        return (1, normalized)
    if "results" in normalized:
        return (2, normalized)
    if "ban sao" in normalized:
        return (3, normalized)
    return (4, normalized)


def load_dataframe(file_path: Path) -> pd.DataFrame:
    suffix = file_path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(file_path)
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(file_path)
    raise ValueError(f"Unsupported import file: {file_path.name}")


def _normalize_source_data(row: dict) -> dict:
    return {
        str(key): "" if value is None else str(value).strip()
        for key, value in row.items()
        if not str(key).startswith("_")
    }


def _participant_lookup(student_id: str, full_name: str, school_name: str, grade: str) -> dict:
    if student_id:
        return {"external_student_id": student_id}
    return {
        "full_name": full_name,
        "school_name": school_name,
        "grade": grade,
    }


def _row_to_payload(row: dict) -> dict:
    return {
        "student_id": safe_get(row, "student_id", "student id", "id", "ma hoc sinh", "mã học sinh"),
        "full_name": safe_get(
            row,
            "student_name",
            "student name",
            "candidate's name",
            "candidate name",
            "student",
            "name",
            "full_name",
            "full name",
            "ho ten",
            "họ tên",
        ),
        "email": safe_get(row, "parent email", "email", "mail", "teacher email"),
        "school_name": safe_get(
            row,
            "school",
            "school_name",
            "school name",
            "school/ institution name",
            "organization",
            "truong",
            "trường",
        ),
        "grade": normalize_grade_value(safe_get(row, "grade", "class", "khoi", "khối")),
        "subject": infer_competition_code(safe_get(row, "subject", "competition", "category", "mon", "môn")),
        "award": safe_get(row, "award", "award status", "result", "giai", "giải"),
        "certificate_code": safe_get(
            row,
            "certificate_code",
            "certificate code",
            "cert_code",
            "cert code",
            "code",
            "mã chứng chỉ",
        ),
        "qualified_round": safe_get(
            row,
            "qualified_round",
            "qualification status",
            "qualified round",
            "round",
            "vong",
            "vòng",
        ),
        "notes": safe_get(row, "registration status", "notes", "ghi chu", "ghi chú"),
    }


def _stable_prepared_row_key(prepared_row: dict) -> str:
    source_data = prepared_row.get("source_data_json", {})
    explicit_merge_key = safe_get(source_data, "merge key")
    if explicit_merge_key:
        return normalize_text(explicit_merge_key)

    payload = prepared_row.get("payload", {})
    student_name = normalize_text(payload.get("student_name", ""))
    grade = normalize_grade_value(payload.get("grade", ""))
    competition = infer_competition_code(payload.get("competition", ""))
    if student_name and grade and competition:
        return f"{student_name}|{grade}|{competition}"

    return f"__row__:{prepared_row.get('sheet_name', '')}:{prepared_row.get('sheet_row_key', '')}"


def _merge_source_data_rows(group_rows: list[dict], primary_row: dict) -> dict:
    merged: dict[str, str] = {}
    primary_sheet_name = primary_row.get("sheet_name", "")

    for row in group_rows:
        source_data = row.get("source_data_json", {})
        sheet_name = row.get("sheet_name", "")
        for key, value in source_data.items():
            if str(key).startswith("_") or value in (None, ""):
                continue
            value_text = str(value).strip()
            if not value_text:
                continue
            if key not in merged:
                merged[key] = value_text
                continue
            if merged[key] == value_text:
                continue
            merged[f"[{sheet_name}] {key}"] = value_text

    merged["_merged_sheet_names"] = sorted({row.get("sheet_name", "") for row in group_rows if row.get("sheet_name")})
    merged["_primary_sheet_name"] = primary_sheet_name
    return merged


def _merge_prepared_rows(prepared_rows: list[dict]) -> list[dict]:
    grouped: dict[str, list[dict]] = {}
    for prepared_row in prepared_rows:
        grouped.setdefault(_stable_prepared_row_key(prepared_row), []).append(prepared_row)

    merged_rows: list[dict] = []
    for merge_key, group_rows in grouped.items():
        ordered_rows = sorted(
            group_rows,
            key=lambda row: (
                _sheet_priority(row.get("sheet_name", "")),
                -(sum(1 for value in row.get("payload", {}).values() if str(value).strip())),
                row.get("source_row_number") or 0,
            ),
        )
        primary_row = ordered_rows[0]
        merged_payload: dict[str, str] = {}
        for row in ordered_rows:
            for field_name, value in row.get("payload", {}).items():
                value_text = str(value).strip()
                if value_text and not merged_payload.get(field_name):
                    merged_payload[field_name] = value_text

        merged_source = _merge_source_data_rows(ordered_rows, primary_row)
        merged_rows.append(
            {
                **primary_row,
                "payload": merged_payload,
                "source_data_json": merged_source,
                "_stable_merge_key": merge_key,
            }
        )

    return merged_rows


def _import_payload(
    *,
    competition: Competition,
    payload: dict,
    source_data_json: dict,
    source_row_number: int | None,
    source_sheet_name: str,
    sheet_row_key: str,
    import_job: DataImportJob,
    imported_source: str,
    summary: ImportSummary,
):
    full_name = payload["full_name"].strip()
    if not full_name:
        summary.skipped_count += 1
        return

    subject = infer_competition_code(payload["subject"].strip())
    normalized_grade = normalize_grade_value(payload["grade"].strip())

    lookup = _participant_lookup(
        payload["student_id"].strip(),
        full_name,
        payload["school_name"].strip(),
        normalized_grade,
    )
    defaults = {
        "full_name": full_name,
        "normalized_name": normalize_text(full_name),
        "email": payload["email"].strip(),
        "school_name": payload["school_name"].strip(),
        "normalized_school_name": normalize_text(payload["school_name"]),
        "grade": normalized_grade,
    }
    participant, created = Participant.objects.get_or_create(defaults=defaults, **lookup)
    if created:
        summary.created_count += 1
    else:
        summary.updated_count += 1
        for key, value in defaults.items():
            setattr(participant, key, value)
        participant.save()

    enrollment, _ = CompetitionEnrollment.objects.update_or_create(
        competition=competition,
        participant=participant,
        subject=subject,
        defaults={
            "source_row_number": source_row_number,
            "source_sheet_name": source_sheet_name.strip(),
            "subject": subject,
            "notes": payload["notes"].strip(),
            "sheet_row_key": sheet_row_key,
            "source_data_json": _normalize_source_data(source_data_json),
        },
    )
    CompetitionResult.objects.update_or_create(
        competition_enrollment=enrollment,
        defaults={
            "award": payload["award"].strip(),
            "certificate_code": payload["certificate_code"].strip(),
            "qualified_round": payload["qualified_round"].strip(),
            "import_job": import_job,
            "imported_source": imported_source,
        },
    )


@transaction.atomic
def import_rows(*, competition: Competition, rows: list[dict], import_job: DataImportJob, imported_source: str) -> ImportSummary:
    summary = ImportSummary(row_count=len(rows))
    import_job.status = DataImportJob.Status.PROCESSING
    import_job.started_at = timezone.now()
    import_job.row_count = len(rows)
    import_job.save(update_fields=["status", "started_at", "row_count"])

    for index, row in enumerate(rows, start=2):
        payload = _row_to_payload(row)
        _import_payload(
            competition=competition,
            payload=payload,
            source_data_json=row,
            source_row_number=index,
            source_sheet_name="",
            sheet_row_key=str(index),
            import_job=import_job,
            imported_source=imported_source,
            summary=summary,
        )

    import_job.status = DataImportJob.Status.COMPLETED
    import_job.created_count = summary.created_count
    import_job.updated_count = summary.updated_count
    import_job.skipped_count = summary.skipped_count
    import_job.error_count = summary.error_count
    import_job.details_json = {
        **(import_job.details_json or {}),
        "rematched_pages": rematch_competition_pages(competition),
    }
    import_job.finished_at = timezone.now()
    import_job.save()

    write_audit_log(
        competition=competition,
        object_type="DataImportJob",
        object_id=import_job.id,
        action="import_completed",
        status="success",
        message=f"Imported {summary.row_count} rows from {imported_source}",
        details={**summary.__dict__, **import_job.details_json},
    )
    return summary


@transaction.atomic
def import_prepared_rows(
    *,
    competition: Competition,
    prepared_rows: list[dict],
    import_job: DataImportJob,
    imported_source: str,
) -> ImportSummary:
    consolidated_rows = _merge_prepared_rows(prepared_rows)
    summary = ImportSummary(row_count=len(consolidated_rows))
    import_job.status = DataImportJob.Status.PROCESSING
    import_job.started_at = timezone.now()
    import_job.row_count = len(consolidated_rows)
    import_job.save(update_fields=["status", "started_at", "row_count"])

    for prepared_row in consolidated_rows:
        payload = prepared_row.get("payload", {})
        canonical_payload = {
            "student_id": payload.get("student_id", ""),
            "full_name": payload.get("student_name", ""),
            "email": payload.get("email", ""),
            "school_name": payload.get("school_name", ""),
            "grade": normalize_grade_value(payload.get("grade", "")),
            "subject": infer_competition_code(payload.get("competition", "")),
            "award": payload.get("award", ""),
            "certificate_code": payload.get("certificate_code", ""),
            "qualified_round": payload.get("qualified_round", ""),
            "notes": payload.get("notes", ""),
        }
        _import_payload(
            competition=competition,
            payload=canonical_payload,
            source_data_json=prepared_row.get("source_data_json", {}),
            source_row_number=prepared_row.get("source_row_number"),
            source_sheet_name=prepared_row.get("sheet_name", ""),
            sheet_row_key=str(prepared_row.get("sheet_row_key", "")),
            import_job=import_job,
            imported_source=imported_source,
            summary=summary,
        )

    import_job.status = DataImportJob.Status.COMPLETED
    import_job.created_count = summary.created_count
    import_job.updated_count = summary.updated_count
    import_job.skipped_count = summary.skipped_count
    import_job.error_count = summary.error_count
    import_job.details_json = {
        **(import_job.details_json or {}),
        "raw_input_row_count": len(prepared_rows),
        "consolidated_row_count": len(consolidated_rows),
        "selected_sheets": sorted(
            {
                prepared_row.get("sheet_name", "")
                for prepared_row in prepared_rows
                if prepared_row.get("sheet_name")
            }
        ),
        "rematched_pages": rematch_competition_pages(competition),
    }
    import_job.finished_at = timezone.now()
    import_job.save()

    write_audit_log(
        competition=competition,
        object_type="DataImportJob",
        object_id=import_job.id,
        action="import_completed",
        status="success",
        message=f"Imported {summary.row_count} mapped rows from {imported_source}",
        details={**summary.__dict__, **import_job.details_json},
    )
    return summary


def import_uploaded_file(job: DataImportJob) -> ImportSummary:
    if not job.source_file:
        raise ValueError("Import job has no uploaded file")
    dataframe = load_dataframe(Path(job.source_file.path))
    rows = dataframe.fillna("").to_dict(orient="records")
    return import_rows(
        competition=job.competition,
        rows=rows,
        import_job=job,
        imported_source=job.source_type,
    )
