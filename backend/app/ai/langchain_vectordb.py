from langchain_chroma import Chroma
from app.ai.langchain_embeddings import embeddings

vector_store = Chroma(
    collection_name="business_documents",
    embedding_function=embeddings,
    persist_directory="chroma_db"
)
retriever = vector_store.as_retriever(
    search_kwargs={"k": 3}
)