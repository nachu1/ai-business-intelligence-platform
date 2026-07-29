from langchain_classic.chains.combine_documents import (
    create_stuff_documents_chain,
)
from langchain_classic.chains.retrieval import (
    create_retrieval_chain,
)

from app.ai.langchain_llm import llm
from app.ai.langchain_vectordb import get_retriever
from app.ai.prompt import prompt

document_chain = create_stuff_documents_chain(
    llm,
    prompt
)

def get_rag_chain(company_id: str):
    retriever = get_retriever(company_id)

    return create_retrieval_chain(
        retriever,
        document_chain
    )