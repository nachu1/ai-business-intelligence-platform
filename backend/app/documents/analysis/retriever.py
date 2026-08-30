from typing import Any

from app.ai.langchain_vectordb import vector_store


def retrieve_relevant_documents(
    text: str,
    company_id: str,
    current_document_id: str,
    k: int = 10,
) -> list[dict[str, Any]]:

    if not text.strip():
        return []

    results = vector_store.similarity_search(
        text,
        k=k,
        filter={
            "company_id": company_id,
        },
    )

    documents = []
    seen_document_ids = set()

    for doc in results:

        document_id = doc.metadata.get(
            "document_id"
        )

        if not document_id:
            continue

        if document_id == current_document_id:
            continue

        if document_id in seen_document_ids:
            continue

        seen_document_ids.add(document_id)

        documents.append(
            {
                "document_id": document_id,
                "source": doc.metadata.get(
                    "source"
                ),
                "document_type": doc.metadata.get(
                    "document_type"
                ),
                "content": doc.page_content,
            }
        )

    return documents