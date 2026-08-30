from langchain_classic.chains.combine_documents import (
    create_stuff_documents_chain,
)

from app.ai.langchain_llm import llm
from app.ai.prompt import prompt
from app.ai.retrieval.hybrid import hybrid_search
import asyncio


document_chain = create_stuff_documents_chain(
    llm,
    prompt,
)


async def run_rag(
    question: str,
    current_user: dict,
    chat_history: list,
    company_context: str,
):
    documents = await asyncio.to_thread(
        hybrid_search,
        question,
        current_user,
        5,
    )

    response = await document_chain.ainvoke(
        {
            "context": documents,
            "input": question,
            "chat_history": chat_history,
            "company_context": company_context,
        }
    )

    return {
        "answer": response,
        "context": documents,
    }