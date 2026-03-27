from __future__ import annotations

import re

from apps.common.text import infer_competition_code, normalize_grade_value, normalize_text


CODE_PATTERN = re.compile(r"\b[A-Z]{2,}(?:\s*-\s*[A-Z0-9]{1,}){2,}\b")
AWARDED_TO_PATTERN = re.compile(r"awarded to(?:\s*[:\-])?\s*(.*)$", re.IGNORECASE)
SCHOOL_PATTERN = re.compile(r"(?:school(?:\s+name)?|truong)\s*[:\-]\s*(.*)$", re.IGNORECASE)
ACHIEVED_PATTERN = re.compile(r"achieved\s*[:\-]\s*(.*)$", re.IGNORECASE)
QUALIFIED_PATTERN = re.compile(r"qualified(?:\s+\w+)*\s*[:\-]\s*(.*)$", re.IGNORECASE)
GRADE_PATTERN = re.compile(r"grade\s*(?:[:\-]\s*)?(\d+(?:\.\d+)?)\b", re.IGNORECASE)

AWARD_KEYWORDS = [
    ("gold medal", "Gold Medal"),
    ("silver medal", "Silver Medal"),
    ("bronze medal", "Bronze Medal"),
    ("consolation prize", "Consolation Prize"),
    ("first prize", "First Prize"),
    ("second prize", "Second Prize"),
    ("third prize", "Third Prize"),
    ("participation", "Participation"),
    ("gold", "Gold"),
    ("silver", "Silver"),
    ("bronze", "Bronze"),
    ("giai nhat", "Giai Nhat"),
    ("giai nhi", "Giai Nhi"),
    ("giai ba", "Giai Ba"),
    ("khuyen khich", "Khuyen Khich"),
]

def _clean_value(value: str) -> str:
    return " ".join(value.replace("\u2013", "-").split()).strip(" -:\t")


def _extract_labeled_value(lines: list[str], pattern: re.Pattern[str]) -> str:
    for index, line in enumerate(lines):
        cleaned = _clean_value(line)
        match = pattern.search(cleaned)
        if not match:
            continue
        value = _clean_value(match.group(1))
        if value:
            return value
        if index + 1 < len(lines):
            next_line = _clean_value(lines[index + 1])
            if next_line:
                return next_line
    return ""

def text_is_sparse(text: str) -> bool:
    compact = "".join(text.split())
    return len(compact) < 80


def detect_award(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    achieved_value = _extract_labeled_value(lines, ACHIEVED_PATTERN)
    if achieved_value:
        return achieved_value

    lowered = normalize_text(text)
    for key, value in AWARD_KEYWORDS:
        if key in lowered:
            return value
    return ""


def detect_certificate_code(text: str) -> str:
    candidates = []
    for match in CODE_PATTERN.finditer(text.upper()):
        candidate = re.sub(r"\s*-\s*", "-", match.group(0)).replace(" ", "")
        if any(token in candidate for token in ["GRADE-", "ACHIEVED-", "QUALIFIED-", "SCHOOL-", "AWARDED-"]):
            continue
        candidates.append(candidate)
    if not candidates:
        return ""
    return max(candidates, key=lambda candidate: (sum(ch.isalpha() for ch in candidate), len(candidate)))


def detect_title_line(lines: list[str]) -> str:
    preferred: list[str] = []
    candidates: list[str] = []
    for line in lines[:12]:
        cleaned = _clean_value(line)
        if len(cleaned) < 8:
            continue
        alpha_ratio = sum(ch.isalpha() for ch in cleaned) / max(len(cleaned), 1)
        if alpha_ratio < 0.5:
            continue
        normalized = normalize_text(cleaned)
        if (
            "certificate" in normalized
            or "awarded to" in normalized
            or "achieved" in normalized
            or "this recognises your participation" in normalized
        ):
            continue
        if any(
            keyword in normalized
            for keyword in ["artificial intelligence", "coding", "olympiad", "competition", "contest"]
        ):
            preferred.append(cleaned)
        candidates.append(cleaned)
    if preferred:
        return max(preferred, key=len)
    return max(candidates, key=len) if candidates else ""


def detect_student_name(lines: list[str]) -> str:
    labeled_name = _extract_labeled_value(lines, AWARDED_TO_PATTERN)
    if labeled_name:
        return labeled_name

    exclusions = {
        "certificate",
        "award",
        "olympiad",
        "contest",
        "competition",
        "school",
        "truong",
        "giai",
        "medal",
        "prize",
        "qualified",
        "round",
        "founder",
        "co-founder",
        "content head",
        "director",
        "principal",
        "support",
        "supported by",
    }
    best = ""
    for line in lines:
        cleaned = _clean_value(line)
        if not cleaned or len(cleaned) < 4 or len(cleaned) > 80:
            continue
        normalized = normalize_text(cleaned)
        if any(token in normalized for token in exclusions):
            continue
        alpha_words = [word for word in cleaned.split() if any(ch.isalpha() for ch in word)]
        if len(alpha_words) < 2:
            continue
        if len(cleaned) > len(best):
            best = cleaned
    return best


def detect_school_name(lines: list[str]) -> str:
    labeled_school = _extract_labeled_value(lines, SCHOOL_PATTERN)
    if labeled_school:
        return labeled_school

    for line in lines:
        normalized = normalize_text(line)
        if any(keyword in normalized for keyword in ["school", "truong", "thpt", "secondary", "high school"]):
            return _clean_value(line)
    return ""


def detect_qualified_round(lines: list[str]) -> str:
    return _extract_labeled_value(lines, QUALIFIED_PATTERN)


def detect_grade(lines: list[str]) -> str:
    for line in lines:
        cleaned = _clean_value(line)
        match = GRADE_PATTERN.search(cleaned)
        if match:
            return normalize_grade_value(match.group(1).strip())
    return ""


def parse_certificate_text(raw_text: str) -> dict:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    certificate_code = detect_certificate_code(raw_text)
    award = detect_award(raw_text)
    competition_name = detect_title_line(lines)
    competition_code = infer_competition_code(competition_name) or infer_competition_code(raw_text)
    student_name = detect_student_name(lines)
    school_name = detect_school_name(lines)
    grade = detect_grade(lines)
    qualified_round = detect_qualified_round(lines)

    warnings = []
    if not student_name:
        warnings.append("student_name_missing")
    if not certificate_code:
        warnings.append("certificate_code_missing")
    if not competition_name:
        warnings.append("competition_name_unclear")

    return {
        "competition_name": competition_name,
        "student_name": student_name,
        "normalized_student_name": normalize_text(student_name),
        "school_name": school_name,
        "normalized_school_name": normalize_text(school_name),
        "grade": grade,
        "award": award,
        "subject": competition_code,
        "certificate_code": certificate_code,
        "qualified_round": qualified_round,
        "warnings_json": warnings,
    }
