import os

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    BackgroundTasks,
    HTTPException,
    Depends,
    Query,
)

from fastapi.responses import FileResponse

from app.auth.security import get_current_user
from app.ai.retrieval.hybrid import hybrid_search

from app.documents.schemas import (
    DocumentType,
    SearchRequest,
)


from app.documents.service import (
    save_document,
    create_document_metadata,
    process_document,
    get_company_documents,
    delete_document,
    get_document_file,
)
from app.notifications.notification_service import (
    get_document_notification_recipients,
    create_notifications,
)




router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


# =========================================================
# UPLOAD DOCUMENT
# =========================================================

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,

    file: UploadFile = File(...),

    document_type: DocumentType = Form(...),

    current_user=Depends(
        get_current_user
    ),
):
    file_info = await save_document(
        file
    )

    try:
        document_id = (
            await create_document_metadata(
                file_info=file_info,

                document_type=(
                    document_type.value
                ),

                company_id=str(
                    current_user[
                        "company_id"
                    ]
                ),

                uploaded_by=str(
                    current_user[
                        "_id"
                    ]
                ),

                department_id=(
                    str(
                        current_user[
                            "department_id"
                        ]
                    )
                    if current_user.get(
                        "department_id"
                    )
                    else None
                ),
            )
        )

        background_tasks.add_task(
            process_document,
            document_id,
        )

        recipient_ids = (
            await get_document_notification_recipients(
                current_user
            )
        )

        if recipient_ids:
          background_tasks.add_task(
           create_notifications,
           str(
              current_user[
                "company_id"
              ]
            ),
            recipient_ids,
            "New Document Uploaded",
            (
               f"{current_user.get('name', 'A user')} "
               f"uploaded {file_info['original_filename']}."
            ),
            "document",
            "/documents",
          )

        return {
            "message":
                "Upload successful",

            "document_id":
                document_id,

            **file_info,
        }

    except Exception as error:

        if os.path.exists(
            file_info["file_path"]
        ):
            os.remove(
                file_info["file_path"]
            )

        print(
            f"Document upload failed: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to save document.",
        )


# =========================================================
# LIST DOCUMENTS
# =========================================================

@router.get("/")
async def list_documents(
    search: str | None = Query(
        default=None
    ),

    document_type: DocumentType | None = Query(
        default=None
    ),

    sort: str = Query(
        default="newest"
    ),

    current_user=Depends(
        get_current_user
    ),
):
    return await get_company_documents(
       company_id=str(current_user["company_id"]),
       user_id=str(current_user["_id"]),
       role=current_user["role"],
       department_id=(
         str(current_user["department_id"])
         if current_user.get("department_id")
         else None
       ),
       search=search,
       document_type=(
         document_type.value
         if document_type
         else None
      ),
      sort=sort,
    )


# =========================================================
# DOWNLOAD DOCUMENT
# =========================================================

@router.get(
    "/{document_id}/download"
)
async def download_document(
    document_id: str,

    current_user=Depends(
        get_current_user
    ),
):
    document = await get_document_file(
        document_id,
        current_user,
    )

    return FileResponse(
        path=document[
            "storage_path"
        ],

        filename=document[
            "original_filename"
        ],

        media_type=document[
            "mime_type"
        ],
    )


# =========================================================
# DELETE DOCUMENT
# =========================================================

@router.delete(
    "/{document_id}"
)
async def remove_document(
    document_id: str,

    current_user=Depends(
        get_current_user
    ),
):
    return await delete_document(
        document_id,
        current_user,
    )


# =========================================================
# RAG SEARCH
# =========================================================

# =========================================================
# HYBRID RAG SEARCH
# =========================================================

@router.post("/search")
async def search_documents_endpoint(
    request: SearchRequest,
    current_user=Depends(
        get_current_user
    ),
):
    documents = hybrid_search(
        query=request.question,
        current_user=current_user,
        k=5,
    )

    results = []

    for doc in documents:
        results.append(
            {
                "document": doc.metadata.get(
                    "source",
                    "Unknown document",
                ),
                "document_type": doc.metadata.get(
                    "document_type",
                    "other",
                ),
                "chunk": doc.metadata.get(
                    "chunk_number",
                    0,
                ),
                "text": doc.page_content,
            }
        )

    return {
        "question": request.question,
        "results": results,
    }