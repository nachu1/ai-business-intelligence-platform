import asyncio
import json
import re
from typing import Any

from app.ai.langchain_llm import llm


MAX_INSIGHTS = 5


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


async def generate_insights(
    relationships: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    if not relationships:
        return []

    prompt = f"""
You are a Business Intelligence insight generator.

Generate only the most important business insights from
the relationships below.

RELATIONSHIPS:
{json.dumps(relationships, ensure_ascii=False)}

Rules:

- Return AT MOST 5 insights.
- Prefer 3 strong insights when enough evidence exists.
- Do not invent facts, values, causes, or conclusions.
- Use ONLY information present in the relationships.
- Do not simply repeat every relationship.
- Combine closely related relationships when appropriate.
- Prioritize financially important or strategically important
  changes.
- Prefer meaningful trends over minor changes.
- Do not create an insight when the evidence is weak.
- Each insight must be understandable without seeing the
  underlying relationship data.
- Keep descriptions concise.
- Do not calculate new numerical values.
- Do not create duplicate insights.

Possible categories:
- financial
- product
- regional
- inventory
- operational
- strategic
- trend

Return ONLY a valid JSON array.

Each insight must have exactly this structure:

{{
  "title": "short insight title",
  "description": "brief evidence-based explanation",
  "category": "financial"
}}

If there are no meaningful insights, return:

[]
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

        insights = json.loads(content)

        if not isinstance(
            insights,
            list,
        ):
            return []

        valid_insights = []
        seen_titles = set()

        allowed_categories = {
            "financial",
            "product",
            "regional",
            "inventory",
            "operational",
            "strategic",
            "trend",
        }

        for insight in insights:

            if not isinstance(
                insight,
                dict,
            ):
                continue

            title = insight.get("title")
            description = insight.get(
                "description"
            )
            category = insight.get(
                "category"
            )

            if not title or not description:
                continue

            if category not in allowed_categories:
                category = "strategic"

            title_key = title.strip().lower()

            if title_key in seen_titles:
                continue

            seen_titles.add(title_key)

            valid_insights.append(
                {
                    "title": title.strip(),
                    "description": description.strip(),
                    "category": category,
                }
            )

            if len(valid_insights) >= MAX_INSIGHTS:
                break

        return valid_insights

    except Exception as error:
        print(
            f"Insight generation failed: "
            f"{error}"
        )

        return []