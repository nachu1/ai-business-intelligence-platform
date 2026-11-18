
import asyncio

from app.ai.company_context import get_rag_company_context
from app.ai.retrieval.hybrid import hybrid_search
from app.ai.retrieval.retrieval_analyzer import analyze_retrieval
from app.ai.retrieval.retrieval_evaluator import evaluate_retrieval
from app.services.user_service import get_user_by_email

EVALUATION_USER_EMAIL = "nasarc530@gmail.com"

QUESTION ="How did net profit change from March through June 2026?"


async def debug_retrieval():
    user = await get_user_by_email(EVALUATION_USER_EMAIL)

    if not user:
        print("Evaluation user not found.")
        return

    # Use the same query as the existing evaluation.
    documents = await asyncio.to_thread(
        hybrid_search,
        QUESTION,
        user,
        20,
    )

    print("\n===== INITIAL RETRIEVAL =====")
    print("Retrieved chunks:", len(documents))

    for index, document in enumerate(documents):
        print(f"\n[{index}] Score: {document.metadata.get('rerank_score')}")
        print(document.page_content[:500])

    analysis = analyze_retrieval(
        question=QUESTION,
        search_query=QUESTION,
        documents=documents,
    )

    print("\n===== RETRIEVAL ANALYSIS =====")
    print("Confidence:", analysis.confidence)
    print("Selected chunks:", len(analysis.selected_documents))
    print("Signals:", analysis.signals)

    if analysis.confidence == "uncertain":
        evaluation = await evaluate_retrieval(
            question=QUESTION,
            search_query=QUESTION,
            documents=documents,
        )

        print("\n===== LLM EVALUATOR =====")
        print("Answerable:", evaluation["answerable"])
        print("Selected indexes:", evaluation["selected_document_indexes"])
        print("Selected chunks:", len(evaluation["selected_documents"]))
        print("Reason:", evaluation["reason"])

    elif analysis.confidence == "insufficient":
        print("\nEvaluator skipped: analyzer classified retrieval as insufficient.")

    else:
        print("\nEvaluator skipped: analyzer classified retrieval as high confidence.")


if __name__ == "__main__":
    asyncio.run(debug_retrieval())
