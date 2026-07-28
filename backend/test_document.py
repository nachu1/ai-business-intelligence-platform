from langchain_core.documents import Document

doc = Document(
    page_content="Revenue increased by 15%",
    metadata={
        "document_type": "sales_report",
        "chunk_number": 0
    }
)

print(doc)