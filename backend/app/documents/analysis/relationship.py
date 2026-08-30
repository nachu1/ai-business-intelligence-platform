from typing import Any


MAX_RELATIONSHIPS = 15
OLDER_DOCUMENT_THRESHOLD = 5.0


def calculate_change(
    previous_value: float,
    current_value: float,
) -> dict[str, Any]:

    change = current_value - previous_value

    percentage_change = (
        (change / previous_value) * 100
        if previous_value != 0
        else None
    )

    if change > 0:
        direction = "increase"
    elif change < 0:
        direction = "decrease"
    else:
        direction = "unchanged"

    return {
        "previous_value": previous_value,
        "current_value": current_value,
        "absolute_change": change,
        "percentage_change": (
            round(percentage_change, 2)
            if percentage_change is not None
            else None
        ),
        "direction": direction,
    }


def find_relationships(
    current_facts: list[dict[str, Any]],
    previous_documents: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    all_relationships = []

    for index, document in enumerate(
        previous_documents
    ):

        previous_facts = document.get(
            "facts",
            [],
        )

        relationships = []

        relationships.extend(
            compare_metrics(
                current_facts,
                previous_facts,
                document,
            )
        )

        relationships.extend(
            compare_attributes(
                current_facts,
                previous_facts,
                document,
            )
        )

        relationships.extend(
            compare_statuses(
                current_facts,
                previous_facts,
                document,
            )
        )

        for relationship in relationships:
            relationship["_document_index"] = index

        all_relationships.extend(
            relationships
        )

    if not all_relationships:
        return []

    # Remove exact duplicates
    unique = []
    seen = set()

    for relationship in all_relationships:

        key = (
            relationship.get("type"),
            relationship.get("metric"),
            relationship.get("attribute"),
            relationship.get("context"),
            relationship.get("subject"),
            relationship.get("document_id"),
            relationship.get("previous_value"),
            relationship.get("current_value"),
            relationship.get("previous_status"),
            relationship.get("current_status"),
        )

        if key in seen:
            continue

        seen.add(key)
        unique.append(relationship)

    # Keep recent-document relationships first.
    # Within them, prioritize larger metric changes.
    unique.sort(
        key=lambda relationship: (
            relationship.get(
                "_document_index",
                999999,
            ),
            -abs(
                relationship.get(
                    "percentage_change",
                    0,
                )
                or 0
            ),
        )
    )

    # Always prefer relationships from the
    # most relevant/recent documents.
    selected = []

    for relationship in unique:

        document_index = relationship.get(
            "_document_index",
            999999,
        )

        if document_index == 0:
            selected.append(
                relationship
            )
            continue

        if relationship.get(
            "type"
        ) in {
            "attribute_change",
            "status_change",
        }:
            selected.append(
                relationship
            )
            continue

        percentage_change = abs(
            relationship.get(
                "percentage_change",
                0,
            )
            or 0
        )

        if (
            percentage_change
            >= OLDER_DOCUMENT_THRESHOLD
        ):
            selected.append(
                relationship
            )

    selected.sort(
        key=lambda relationship: (
            relationship.get(
                "_document_index",
                999999,
            ),
            -abs(
                relationship.get(
                    "percentage_change",
                    0,
                )
                or 0
            ),
        )
    )

    selected = selected[
        :MAX_RELATIONSHIPS
    ]

    for relationship in selected:
        relationship.pop(
            "_document_index",
            None,
        )

    return selected


def compare_metrics(
    current_facts: list[dict[str, Any]],
    previous_facts: list[dict[str, Any]],
    document: dict[str, Any],
) -> list[dict[str, Any]]:

    relationships = []

    previous_metrics = {
        fact.get("metric"): fact
        for fact in previous_facts
        if fact.get("type") == "metric"
        and fact.get("metric")
    }

    for current in current_facts:

        if current.get("type") != "metric":
            continue

        metric = current.get("metric")

        if metric not in previous_metrics:
            continue

        previous = previous_metrics[metric]

        previous_value = previous.get("value")
        current_value = current.get("value")

        if not isinstance(
            previous_value,
            (int, float),
        ):
            continue

        if not isinstance(
            current_value,
            (int, float),
        ):
            continue

        if previous.get("unit") != current.get(
            "unit"
        ):
            continue

        change = calculate_change(
            previous_value,
            current_value,
        )

        if change["direction"] == "unchanged":
            continue

        relationships.append(
            {
                "type": "metric_change",
                "metric": metric,
                "document_id": str(
                    document.get(
                        "document_id"
                    )
                ),
                **change,
            }
        )

    return relationships


def compare_attributes(
    current_facts: list[dict[str, Any]],
    previous_facts: list[dict[str, Any]],
    document: dict[str, Any],
) -> list[dict[str, Any]]:

    relationships = []

    previous_attributes = {
        fact.get("label"): fact
        for fact in previous_facts
        if fact.get("type") == "attribute"
        and fact.get("label")
    }

    for current in current_facts:

        if current.get("type") != "attribute":
            continue

        label = current.get("label")

        if label not in previous_attributes:
            continue

        previous = previous_attributes[label]

        previous_value = previous.get("value")
        current_value = current.get("value")

        if previous_value == current_value:
            continue

        relationships.append(
            {
                "type": "attribute_change",
                "attribute": label,
                "document_id": str(
                    document.get(
                        "document_id"
                    )
                ),
                "previous_value": previous_value,
                "current_value": current_value,
                "direction": "changed",
            }
        )

    return relationships


def compare_statuses(
    current_facts: list[dict[str, Any]],
    previous_facts: list[dict[str, Any]],
    document: dict[str, Any],
) -> list[dict[str, Any]]:

    relationships = []

    previous_statuses = {
        (
            fact.get("context"),
            fact.get("subject"),
        ): fact
        for fact in previous_facts
        if fact.get("type") == "status"
    }

    for current in current_facts:

        if current.get("type") != "status":
            continue

        key = (
            current.get("context"),
            current.get("subject"),
        )

        if key not in previous_statuses:
            continue

        previous = previous_statuses[key]

        previous_status = previous.get(
            "status"
        )

        current_status = current.get(
            "status"
        )

        if previous_status == current_status:
            continue

        relationships.append(
            {
                "type": "status_change",
                "context": current.get(
                    "context"
                ),
                "subject": current.get(
                    "subject"
                ),
                "document_id": str(
                    document.get(
                        "document_id"
                    )
                ),
                "previous_status": previous_status,
                "current_status": current_status,
                "direction": "changed",
            }
        )

    return relationships