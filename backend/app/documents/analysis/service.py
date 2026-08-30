from typing import Any

from app.documents.analysis.analyzer import (
    analyze_document,
)


async def process_document_analysis(
    document_id: str,
    text: str,
    company_id: str,
    previous_documents: list[dict[str, Any]] | None = None,
    relevant_documents: list[dict[str, Any]] | None = None,
):
    try:
        return await analyze_document(
            document_id=document_id,
            text=text,
            company_id=company_id,
            previous_documents=previous_documents,
            relevant_documents=relevant_documents,
        )

    except Exception as error:
        print(
            f"Document analysis failed for "
            f"{document_id}: {error}"
        )

        return None