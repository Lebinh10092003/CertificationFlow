import re
import unicodedata


def normalize_text(value: str) -> str:
    if not value:
        return ""
    value = str(value).replace("\u0110", "D").replace("\u0111", "d")
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"\s+", " ", value).strip().lower()
    return value


def normalize_grade_value(value: str) -> str:
    if value is None:
        return ""
    text = str(value).strip().replace(",", ".")
    if not text:
        return ""
    if re.fullmatch(r"\d+\.0+", text):
        return text.split(".", 1)[0]
    return text


def normalize_award_value(value: str) -> str:
    text = normalize_text(value)
    if not text:
        return ""

    replacements = {
        "gold medal": "gold",
        "silver medal": "silver",
        "bronze medal": "bronze",
        "certificate of merit": "merit",
        "consolation prize": "consolation",
        "first prize": "first prize",
        "second prize": "second prize",
        "third prize": "third prize",
        "no prize": "no prize",
        "participation": "participation",
    }
    for source, target in replacements.items():
        if text == source:
            return target
    return text


def infer_competition_code(value: str) -> str:
    normalized = normalize_text(value)
    if not normalized:
        return ""
    if re.search(r"\biaio\b|\biaoi\b", normalized) or "artificial intelligence" in normalized:
        return "IAIO"
    if re.search(r"\bico\b", normalized) or "coding" in normalized:
        return "ICO"
    return str(value).strip().upper()


def slugify_filename(value: str) -> str:
    normalized = normalize_text(value).replace(" ", "_")
    normalized = re.sub(r"[^a-z0-9._-]", "", normalized)
    return normalized or "certificate"


def safe_get(row: dict, *candidates: str) -> str:
    normalized = {normalize_text(str(key)): key for key in row.keys()}
    for candidate in candidates:
        key = normalized.get(normalize_text(candidate))
        if key is not None:
            value = row.get(key)
            return "" if value is None else str(value).strip()
    return ""
