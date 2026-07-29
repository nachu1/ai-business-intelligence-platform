from fastapi import APIRouter, UploadFile, File, Form
from app.documents.schemas import DocumentType
from fastapi import BackgroundTasks
from app.ai.rag_chain import rag_chain
from app.documents.schemas import SearchRequest
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
    document_type: DocumentType = Form(...)
):
    file_info = await save_document(file)

    try:
        document_id = await create_document_metadata(
            file_info,
            document_type.value
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
async def search_documents_endpoint(request: SearchRequest):

    response = rag_chain.invoke({
    "input": request.question
    })

    return {
     "question": request.question,
     "answer": response["answer"]
}