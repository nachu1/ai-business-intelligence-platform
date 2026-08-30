import re
from typing import Any


MONTHS = (
    "January|February|March|April|May|June|July|August|"
    "September|October|November|December"
)


def parse_number(value: str) -> float | int:
    value = value.replace(",", "").strip()
    number = float(value)
    return int(number) if number.is_integer() else number


def normalize_amount(
    value: str,
) -> tuple[float | int, str | None]:

    currency = None

    if "₹" in value:
        currency = "INR"
    elif "$" in value:
        currency = "USD"
    elif "€" in value:
        currency = "EUR"
    elif "£" in value:
        currency = "GBP"

    cleaned = re.sub(
        r"[₹$€£,\s]",
        "",
        value,
    )

    return parse_number(cleaned), currency


def normalize_name(
    value: str,
) -> str:

    value = value.lower().strip()

    value = re.sub(
        r"[^a-z0-9]+",
        "_",
        value,
    )

    return value.strip("_")


def extract_periods(
    text: str,
) -> list[dict[str, Any]]:

    facts = []

    patterns = [
        rf"\b(?:{MONTHS})\s+\d{{4}}\b",
        r"\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b",
        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
    ]

    for pattern in patterns:
        for value in re.findall(
            pattern,
            text,
            re.IGNORECASE,
        ):
            facts.append(
                {
                    "type": "date",
                    "value": value,
                }
            )

    return facts


def extract_percentages(
    text: str,
) -> list[dict[str, Any]]:

    facts = []

    for value in re.findall(
        r"\b\d+(?:\.\d+)?\s*%",
        text,
    ):
        facts.append(
            {
                "type": "percentage",
                "value": float(
                    value.replace("%", "").strip()
                ),
                "unit": "percent",
            }
        )

    return facts


def extract_amounts(
    text: str,
) -> list[dict[str, Any]]:

    facts = []

    pattern = (
        r"(?:₹|\$|€|£)\s?"
        r"\d[\d,]*(?:\.\d+)?"
    )

    for value in re.findall(
        pattern,
        text,
    ):
        number, currency = normalize_amount(
            value
        )

        facts.append(
            {
                "type": "amount",
                "value": number,
                "unit": currency,
                "raw_value": value.strip(),
            }
        )

    return facts


def extract_quantities(
    text: str,
) -> list[dict[str, Any]]:

    facts = []

    pattern = (
        r"\b\d+(?:\.\d+)?\s+"
        r"(?:units?|items?|pieces?|kg|kgs|"
        r"grams?|g|liters?|litres?|l|"
        r"boxes?|packs?)\b"
    )

    for value in re.findall(
        pattern,
        text,
        re.IGNORECASE,
    ):
        parts = value.split()

        facts.append(
            {
                "type": "quantity",
                "value": parse_number(parts[0]),
                "unit": " ".join(parts[1:]).lower(),
            }
        )

    return facts


def extract_metric_pairs(
    text: str,
) -> list[dict[str, Any]]:

    facts = []

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    for index, line in enumerate(lines):

        if index + 1 >= len(lines):
            continue

        next_line = lines[index + 1]

        amount_match = re.fullmatch(
            r"(?:₹|\$|€|£)\s?"
            r"\d[\d,]*(?:\.\d+)?",
            next_line,
        )

        if not amount_match:
            continue

        number, currency = normalize_amount(
            amount_match.group()
        )

        facts.append(
            {
                "type": "metric",
                "metric": normalize_name(line),
                "value": number,
                "unit": currency,
            }
        )

    return facts


def extract_labeled_values(
    text: str,
) -> list[dict[str, Any]]:

    facts = []

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    ignored = {
        "metric",
        "value",
        "date",
        "description",
        "business_summary",
    }

    for index, line in enumerate(lines):

        if index + 1 >= len(lines):
            continue

        next_line = lines[index + 1]

        if normalize_name(line) in ignored:
            continue

        if re.fullmatch(
            r"(?:₹|\$|€|£)\s?"
            r"\d[\d,]*(?:\.\d+)?",
            next_line,
        ):
            continue

        if re.fullmatch(
            r"\d+(?:\.\d+)?\s*%",
            next_line,
        ):
            continue

        if len(line) > 80:
            continue

        if re.match(
            r"^(?:Top|Lowest|Highest|Minimum|Maximum|"
            r"Current|Previous|Region|Product|Customer|"
            r"Supplier|Department|Status|Quantity|Balance)",
            line,
            re.IGNORECASE,
        ):
            facts.append(
                {
                    "type": "attribute",
                    "label": normalize_name(line),
                    "value": next_line,
                }
            )

    return facts


def extract_change_context(
    text: str,
) -> list[dict[str, Any]]:

    facts = []

    pattern = (
        r"\b(increased|decreased|increasing|decreasing|"
        r"grew|declined|reduced|rose|fell)\b"
        r"(?:\s+by)?\s*"
        r"(\d+(?:\.\d+)?)\s*%"
        r"(?:\s+(?:compared|from|over|against)\s+([^.\n]+))?"
    )

    for match in re.finditer(
        pattern,
        text,
        re.IGNORECASE,
    ):
        direction = match.group(1).lower()

        if direction in {
            "decreased",
            "decreasing",
            "declined",
            "reduced",
            "fell",
        }:
            direction = "decrease"
        else:
            direction = "increase"

        fact = {
            "type": "change",
            "value": float(match.group(2)),
            "unit": "percent",
            "direction": direction,
        }

        if match.group(3):
            fact["comparison"] = (
                match.group(3).strip()
            )

        facts.append(fact)

    return facts


def extract_status_context(
    text: str,
) -> list[dict[str, Any]]:

    facts = []

    pattern = (
        r"([A-Za-z][A-Za-z0-9\s-]*?)\s+"
        r"(?:inventory|stock)\s+"
        r"(?:is|remains|was|stays)\s+"
        r"(below|above|at)\s+"
        r"(?:the\s+)?"
        r"([A-Za-z][A-Za-z\s-]*?)"
        r"(?:\s+level|\s+threshold)?"
        r"(?:\.|,|$)"
    )

    for match in re.finditer(
        pattern,
        text,
        re.IGNORECASE,
    ):
        subject = match.group(1).strip()
        status = match.group(2).strip().lower()
        threshold = match.group(3).strip()

        facts.append(
            {
                "type": "status",
                "context": "inventory",
                "subject": subject,
                "status": status,
                "threshold": threshold,
            }
        )

    return facts


def extract_facts(
    text: str,
) -> list[dict[str, Any]]:

    facts = []

    facts.extend(
        extract_periods(text)
    )

    facts.extend(
        extract_percentages(text)
    )

    facts.extend(
        extract_amounts(text)
    )

    facts.extend(
        extract_quantities(text)
    )

    facts.extend(
        extract_metric_pairs(text)
    )

    facts.extend(
        extract_labeled_values(text)
    )

    facts.extend(
        extract_change_context(text)
    )

    facts.extend(
        extract_status_context(text)
    )

    return deduplicate_facts(facts)


def deduplicate_facts(
    facts: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    unique = []
    seen = set()

    for fact in facts:

        key = tuple(
            sorted(
                (
                    str(key),
                    str(value),
                )
                for key, value in fact.items()
            )
        )

        if key in seen:
            continue

        seen.add(key)
        unique.append(fact)

    return unique