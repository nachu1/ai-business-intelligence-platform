

from app.ai.retrieval.bm25 import search_bm25
from app.ai.retrieval.fusion import reciprocal_rank_fusion
from app.ai.langchain_vectordb import vector_store
from app.ai.retrieval.reranker import rerank


def get_document_filter(current_user: dict):
    company_id = str(current_user["company_id"])
    role = current_user.get("role")

    if role == "admin":
        return {"company_id": company_id}

    if role == "manager":
        department_id = current_user.get("department_id")

        if not department_id:
            return {"company_id": "__no_access__"}

        return {
            "$and": [
                {"company_id": company_id},
                {"department_id": str(department_id)},
            ]
        }

    return {
        "$and": [
            {"company_id": company_id},
            {"uploaded_by": str(current_user["_id"])},
        ]
    }


def get_authorized_documents(current_user: dict):
    document_filter = get_document_filter(current_user)

    results = vector_store.get(
        where=document_filter,
        include=["documents", "metadatas"],
    )

    from langchain_core.documents import Document

    return [
        Document(
            page_content=text,
            metadata=metadata,
        )
        for text, metadata in zip(
            results["documents"] or [],
            results["metadatas"] or [],
        )
    ]


def hybrid_search(
    query: str,
    current_user: dict,
    k: int = 20,
):
    print("\nHYBRID SEARCH QUERY:", query)

    document_filter = get_document_filter(current_user)
    authorized_documents = get_authorized_documents(current_user)

    if not authorized_documents:
        print("No authorized documents found.")
        return []

    print(
        "TOTAL AUTHORIZED DOCUMENT CHUNKS:",
        len(authorized_documents),
    )

    semantic_results = vector_store.similarity_search(
        query,
        k=k,
        filter=document_filter,
    )

    bm25_results = search_bm25(
        query,
        authorized_documents,
        k=k,
    )

    # Debug 1: Semantic search
    print("\n===== SEMANTIC SEARCH RESULTS =====")
    for i, doc in enumerate(semantic_results, start=1):
        print(f"\n{i}. {doc.page_content[:250]!r}")

    # Debug 2: BM25 search
    print("\n===== BM25 SEARCH RESULTS =====")
    for i, doc in enumerate(bm25_results, start=1):
        print(f"\n{i}. {doc.page_content[:250]!r}")

    # Reciprocal Rank Fusion
    fused_results = reciprocal_rank_fusion(
        [semantic_results, bm25_results],
        top_k=20,
    )

    # Debug 3: Fused results
    print("\n===== RRF FUSED RESULTS =====")
    for i, doc in enumerate(fused_results, start=1):
        print(f"\n{i}. {doc.page_content[:250]!r}")

    # Cross-encoder reranking
    reranked_results = rerank(
        query,
        fused_results,
        k=20,
    )

    print("\n===== FINAL RERANKED RESULTS =====")
    for i, doc in enumerate(reranked_results, start=1):
        print(f"\n{i}. {doc.page_content[:250]!r}")

    return reranked_results
