import chromadb

# Create a persistent ChromaDB client
client = chromadb.PersistentClient(path="chroma_db")

# Create or get a collection
collection = client.get_or_create_collection(
    name="business_documents"
)
# add documents
def add_document(
    document_id: str,
    text: str,
    embedding: list,
    metadata: dict
):
    """
    Store a document chunk in ChromaDB.
    """

    collection.add(
        ids=[document_id],
        documents=[text],
        embeddings=[embedding],
        metadatas=[metadata]
    )

# search document
def search_documents(query_embedding: list, n_results: int = 3):
    """
    Search for the most similar document chunks.
    """

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    return results