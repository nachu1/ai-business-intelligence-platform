from typing import Any

from app.documents.analysis.extractor import (
    extract_facts,
)
from app.documents.analysis.relationship import (
    find_relationships,
)
from app.documents.analysis.llm_relationship import (
    find_llm_relationships,
)
from app.database.mongodb import (
    document_analysis_collection,
)
from app.documents.analysis.insight import (
    generate_insights,
)

from app.services.insight_email_service import (
    send_insight_email,
)

async def analyze_document(
    document_id: str,
    text: str,
    company_id: str,
    previous_documents: list[dict[str, Any]] | None = None,
    relevant_documents: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:

    facts = extract_facts(text)

    previous_documents = (
        previous_documents or []
    )

    relevant_documents = (
        relevant_documents or []
    )

    # -----------------------------------------------------
    # RULE-BASED RELATIONSHIPS
    # -----------------------------------------------------

    relationships = find_relationships(
        current_facts=facts,
        previous_documents=previous_documents,
    )

    # -----------------------------------------------------
    # LLM RELATIONSHIPS
    # -----------------------------------------------------

    llm_relationships = (
        await find_llm_relationships(
            current_text=text,
            current_facts=facts,
            relevant_documents=relevant_documents,
            existing_relationships=relationships,
        )
    )

    relationships.extend(
        llm_relationships
    )
    insights = await generate_insights(
       relationships=relationships,
    )
    analysis = {
        "document_id": document_id,
        "company_id": company_id,
        "summary": None,
        "entities": [],
        "facts": facts,
        "relationships": relationships,
        "insights": insights,
        "status": "completed",
    }

    await document_analysis_collection.update_one(
        {
            "document_id": document_id,
        },
        {
            "$set": analysis,
        },
        upsert=True,
    )
    if insights:
     await send_insight_email(
        company_id=company_id,
        insights=insights,
     )

    return analysis