from langchain_chroma import Chroma
from app.ai.langchain_embeddings import embeddings

vector_store = Chroma(
    collection_name="business_documents",
    embedding_function=embeddings,
    persist_directory="chroma_db"
)

def get_retriever(company_id: str):
    return vector_store.as_retriever(
        search_kwargs={
            "k": 3,
            "filter": {
                "company_id": company_id
            }
        }
    )

# Keep this for now (we'll remove it in the next step)
retriever = vector_store.as_retriever(
    search_kwargs={"k": 3}
)