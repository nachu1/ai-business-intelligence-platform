
import asyncio

from app.ai.retrieval.retrieval_analyzer import analyze_retrieval
from app.ai.retrieval.retrieval_evaluator import evaluate_retrieval

from langchain_classic.chains.combine_documents import (
    create_stuff_documents_chain,
)

from app.ai.langchain_llm import llm, groq_llm
from app.ai.prompt import prompt
from app.ai.retrieval.hybrid import hybrid_search


# Create separate document chains for each provider.
gemini_document_chain = create_stuff_documents_chain(
    llm,
    prompt,
)

groq_document_chain = create_stuff_documents_chain(
    groq_llm,
    prompt,
)


async def run_rag(
    question: str,
    current_user: dict,
    chat_history: list,
    company_context: str,
    search_query: str | None = None,
    provider: str = "gemini",
):

    search_query = search_query or question

    documents = await asyncio.to_thread(
        hybrid_search,
        search_query,
        current_user,
        20,
    )

    # Retrieval analyzer does not receive provider.
    analysis = analyze_retrieval(
        question=question,
        search_query=search_query,
        documents=documents,
    )

    print("\n===== RETRIEVAL ANALYSIS =====")
    print("Confidence:", analysis.confidence)
    print("Signals:", analysis.signals)
    print("==============================\n")

    if analysis.confidence == "high":

        documents = analysis.selected_documents

    elif analysis.confidence == "uncertain":

        # Pass the Supervisor-selected provider to the evaluator.
        evaluation = await evaluate_retrieval(
            question=question,
            search_query=search_query,
            documents=documents,
            provider=provider,
        )

        print("\n===== LLM RETRIEVAL EVALUATION =====")
        print("Answerable:", evaluation["answerable"])
        print(
            "Selected indexes:",
            evaluation["selected_document_indexes"],
        )
        print("Reason:", evaluation["reason"])
        print("====================================\n")

        if evaluation["answerable"]:
            documents = evaluation["selected_documents"]
        else:
            documents = []

    elif analysis.confidence == "insufficient":

        return {
            "answer": (
                "I couldn't find sufficient supporting evidence "
                "in the available documents to answer this question."
            ),
            "context": [],
        }

    print("FINAL CONTEXT CHUNK COUNT:", len(documents))

    recent_history = chat_history[-6:]

    # Select the provider chosen by the Supervisor.
    document_chain = (
        groq_document_chain
        if provider.lower() == "groq"
        else gemini_document_chain
    )

    print("RAG ANSWER PROVIDER:", provider, flush=True)

    response = await document_chain.ainvoke(
        {
            "context": documents,
            "input": question,
            "chat_history": recent_history,
            "company_context": company_context,
        }
    )

    return {
        "answer": response,
        "context": documents,
    }
