from langchain_classic.chains.combine_documents import (
    create_stuff_documents_chain,
)
from langchain_classic.chains.retrieval import (
    create_retrieval_chain,
)

from app.ai.langchain_llm import llm
from app.ai.langchain_vectordb import retriever
from app.ai.prompt import prompt

document_chain = create_stuff_documents_chain(
    llm,
    prompt
)

rag_chain = create_retrieval_chain(
    retriever,
    document_chain
)