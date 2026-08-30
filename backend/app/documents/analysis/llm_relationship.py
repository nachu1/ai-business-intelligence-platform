import asyncio
import json
import re
from typing import Any

from app.ai.langchain_llm import llm


MAX_SEMANTIC_RELATIONSHIPS = 3


def clean_json_response(content: str) -> str:
    content = content.strip()

    content = re.sub(
        r"^```(?:json)?\s*",
        "",
        content,
    )

    content = re.sub(
        r"\s*```$",
        "",
        content,
    )

    return content.strip()


def is_duplicate_relationship(
    relationship: dict[str, Any],
    existing_relationships: list[dict[str, Any]],
) -> bool:

    document_id = relationship.get(
        "document_id"
    )

    relationship_name = (
        relationship.get(
            "relationship",
            ""
        )
        .lower()
    )

    description = (
        relationship.get(
            "description",
            ""
        )
        .lower()
    )

    for existing in existing_relationships:

        if existing.get("document_id") != document_id:
            continue

        existing_type = existing.get(
            "type"
        )

        if existing_type == "metric_change":

            metric = (
                existing.get(
                    "metric",
                    ""
                )
                .lower()
            )

            if (
                metric
                and (
                    metric in relationship_name
                    or metric in description
                )
            ):
                return True

        elif existing_type == "attribute_change":

            attribute = (
                existing.get(
                    "attribute",
                    ""
                )
                .lower()
            )

            previous_value = str(
                existing.get(
                    "previous_value",
                    ""
                )
            ).lower()

            current_value = str(
                existing.get(
                    "current_value",
                    ""
                )
            ).lower()

            values_match = (
                previous_value in description
                and current_value in description
            )

            if attribute and (
                attribute in relationship_name
                or (
                    values_match
                    and (
                        previous_value
                        or current_value
                    )
                )
            ):
                return True

        elif existing_type == "status_change":

            context = str(
                existing.get(
                    "context",
                    ""
                )
            ).lower()

            subject = str(
                existing.get(
                    "subject",
                    ""
                )
            ).lower()

            if (
                subject
                and subject in description
                and (
                    not context
                    or context in description
                )
            ):
                return True

    return False


async def find_llm_relationships(
    current_text: str,
    current_facts: list[dict[str, Any]],
    relevant_documents: list[dict[str, Any]],
    existing_relationships: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:

    if not relevant_documents:
        return []

    existing_relationships = (
        existing_relationships or []
    )

    previous_context = []

    for document in relevant_documents:
        previous_context.append(
            {
                "document_id": document.get(
                    "document_id"
                ),
                "source": document.get(
                    "source"
                ),
                "document_type": document.get(
                    "document_type"
                ),
                "content": document.get(
                    "content",
                    "",
                ),
            }
        )

    prompt = f"""
You are an expert Business Intelligence analyst.

Analyze the CURRENT DOCUMENT against ALL RELEVANT
PREVIOUS DOCUMENTS.

Your goal is to find ONLY the most important semantic
relationships that provide additional business insight.

CURRENT DOCUMENT:
{current_text}

CURRENT FACTS:
{json.dumps(current_facts, ensure_ascii=False)}

RELEVANT PREVIOUS DOCUMENTS:
{json.dumps(previous_context, ensure_ascii=False)}

RELATIONSHIPS ALREADY FOUND BY THE RULE-BASED ENGINE:
{json.dumps(existing_relationships, ensure_ascii=False)}

The rule-based engine already detects:
- metric changes
- attribute changes
- status changes
- exact numerical calculations

DO NOT repeat, rephrase, summarize, or rename any
relationship already represented by the rule-based engine.

For example, if the rule engine detected:

"top_product changed from Laptop to Smartphone"

DO NOT return:

"Product Performance Shift"

because that describes the same change.

Also do not return relationships such as:
- revenue growth
- expense growth
- profit growth
- product change
- region change
- stock status change

when those facts are already represented by the
rule-based relationships.

Only return semantic relationships that add NEW information.

Good examples include:
- strong cause-and-effect relationships
- explicit connections between business events
- meaningful long-term developments
- important context that cannot be represented by a
  simple metric, attribute, or status change
- connections between different business areas

Do NOT create a semantic relationship merely because
two documents contain the same product, region, metric,
company, or reporting period.

Do NOT invent information.

IMPORTANT:

- Consider ALL previous documents together.
- Return AT MOST 3 semantic relationships TOTAL.
- Prefer 1 strong relationship over several weak ones.
- Do not return duplicate or highly similar relationships.
- Do not return a relationship that is already represented
  by the rule-based relationships.
- Do not calculate numeric changes.
- Only use evidence present in the documents.

Return ONLY valid JSON.

Each relationship must have exactly:

{{
  "type": "semantic_relationship",
  "document_id": "ID_OF_MOST_RELEVANT_DOCUMENT",
  "relationship": "short_relationship_name",
  "description": "brief evidence-based explanation"
}}

If there is no genuinely useful additional relationship,
return [].
"""

    try:
        response = await asyncio.to_thread(
            llm.invoke,
            prompt,
        )

        content = response.content

        if isinstance(content, list):
            content = "".join(
                str(item)
                for item in content
            )

        content = clean_json_response(
            str(content)
        )

        relationships = json.loads(
            content
        )

        if not isinstance(
            relationships,
            list,
        ):
            return []

        valid_document_ids = {
            document["document_id"]
            for document in relevant_documents
            if document.get("document_id")
        }

        valid_relationships = []
        seen = set()

        for relationship in relationships:

            if not isinstance(
                relationship,
                dict,
            ):
                continue

            document_id = relationship.get(
                "document_id"
            )

            relationship_name = relationship.get(
                "relationship"
            )

            description = relationship.get(
                "description"
            )

            if document_id not in valid_document_ids:
                continue

            if not relationship_name:
                continue

            if not description:
                continue

            if is_duplicate_relationship(
                relationship,
                existing_relationships,
            ):
                continue

            key = (
                document_id,
                relationship_name.lower(),
            )

            if key in seen:
                continue

            seen.add(key)

            relationship["type"] = (
                "semantic_relationship"
            )

            valid_relationships.append(
                relationship
            )

            if (
                len(valid_relationships)
                >= MAX_SEMANTIC_RELATIONSHIPS
            ):
                break

        return valid_relationships

    except Exception as error:
        print(
            f"LLM relationship analysis failed: "
            f"{error}"
        )

        return []