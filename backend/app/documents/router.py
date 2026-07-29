from fastapi import APIRouter, UploadFile, File, Form
from app.documents.schemas import DocumentType
from fastapi import BackgroundTasks
from app.ai.rag_chain import get_rag_chain
from app.documents.schemas import SearchRequest
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains.retrieval import create_retrieval_chain
from app.auth.security import get_current_user
from fastapi import Depends

from app.ai.langchain_vectordb import vector_store
from app.ai.langchain_llm import llm
from app.ai.prompt import prompt
from app.documents.service import (
    save_document,
    create_document_metadata,
    process_document
)
import os
from fastapi import HTTPException

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_type: DocumentType = Form(...),
    current_user=Depends(get_current_user)
):
    file_info = await save_document(file)

    try:
        document_id = await create_document_metadata(
           file_info,
           document_type.value,
           str(current_user["company_id"])
        )
        background_tasks.add_task(
            process_document,
            document_id
        )

        return {
            "message": "Upload successful",
            "document_id": document_id,
            **file_info
        }

    except Exception as e:

        if os.path.exists(file_info["file_path"]):
            os.remove(file_info["file_path"])

        raise HTTPException(
            status_code=500,
            detail="Failed to save document."
        )
@router.post("/search")
async def search_documents_endpoint(
    request: SearchRequest,
    current_user=Depends(get_current_user)
):
    rag_chain = get_rag_chain(
      str(current_user["company_id"])
    )

    response = rag_chain.invoke({
      "input": request.question
    })

    sources = []

    for doc in response["context"]:
        sources.append({
            "document": doc.metadata["source"],
            "document_type": doc.metadata["document_type"],
            "chunk": doc.metadata["chunk_number"]
        })

    return {
        "question": request.question,
        "answer": response["answer"],
        "sources": sources
    }