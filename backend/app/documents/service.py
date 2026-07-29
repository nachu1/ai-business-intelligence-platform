import os
import shutil
import uuid
import os
import shutil
import fitz
from fastapi import UploadFile
from fastapi import UploadFile
from datetime import datetime
from app.database.mongodb import document_collection
from app.documents.schemas import DocumentStatus
from datetime import datetime
from bson import ObjectId
from app.ai.embeddings import generate_embedding
from app.ai.vectordb import add_document
from app.ai.text_splitter import split_text
from langchain_core.documents import Document
from app.ai.langchain_vectordb import vector_store

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


from pathlib import Path

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


async def save_document(file: UploadFile):

    extension = Path(file.filename).suffix

    unique_filename = f"{uuid.uuid4()}{extension}"

    file_path = os.path.join(
        UPLOAD_FOLDER,
        unique_filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
    "original_filename": file.filename,
    "stored_filename": unique_filename,
    "file_path": file_path,
    "mime_type": file.content_type,
    "file_size": os.path.getsize(file_path)
}
async def create_document_metadata(
    file_info: dict,
    document_type: str,
    company_id: str
):

    document = {
        "company_id": ObjectId(company_id),
        "original_filename": file_info["original_filename"],
        "stored_filename": file_info["stored_filename"],
        "storage_path": file_info["file_path"],
        "document_type": document_type,
        "mime_type": file_info["mime_type"],
        "file_size": file_info["file_size"],        # We'll improve this later
        "status": DocumentStatus.UPLOADED,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "processed_at": None
    }

    result = await document_collection.insert_one(document)

    return str(result.inserted_id)
async def process_document(document_id: str):

    # Mark as processing
    await document_collection.update_one(
        {"_id": ObjectId(document_id)},
        {
            "$set": {
                "status": DocumentStatus.PROCESSING,
                "updated_at": datetime.utcnow()
            }
        }
    )

    document = await document_collection.find_one(
    {"_id": ObjectId(document_id)}
)

    file_path = document["storage_path"]

    text = extract_text_from_pdf(file_path)

    print("Extracted Text:")
    chunks = split_text(text)

    print(f"Total Chunks: {len(chunks)}")

    for index, chunk in enumerate(chunks):

       print(f"Processing Chunk {index + 1}")

       doc = Document(
         page_content=chunk,
         metadata={
            "document_id": document_id,
            "company_id": str(document["company_id"]),
            "chunk_number": index,
            "document_type": document["document_type"],
            "source": document["original_filename"]
         }
       )

    vector_store.add_documents(
    documents=[doc],
    ids=[f"{document_id}_{index}"]
    )

    print("All chunks stored in ChromaDB")

    # Temporary delay to simulate AI work
    import asyncio
    await asyncio.sleep(5)

    # Mark as completed
    await document_collection.update_one(
        {"_id": ObjectId(document_id)},
        {
            "$set": {
                "status": DocumentStatus.COMPLETED,
                "updated_at": datetime.utcnow(),
                "processed_at": datetime.utcnow()
            }
        }
    )

    print(f"Completed: {document_id}")

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""

    text = ""

    doc = fitz.open(file_path)

    for page in doc:
        text += page.get_text()

    doc.close()

    return text
