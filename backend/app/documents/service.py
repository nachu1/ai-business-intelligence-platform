import os
import shutil
import re
import uuid
from pathlib import Path
from datetime import datetime


import fitz

from bson import ObjectId
from fastapi import UploadFile, HTTPException

from langchain_core.documents import Document

from app.ai.langchain_vectordb import vector_store
from app.ai.text_splitter import split_text
from app.jobs.service import create_analysis_job

from app.database.mongodb import (
    document_collection,
    user_collection,
)
from app.documents.ocr.ocr_service import (
    ocr_page,
)


from app.documents.schemas import DocumentStatus


UPLOAD_FOLDER = "uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True,
)


# =========================================================
# HELPERS
# =========================================================

def convert_object_id(value: str | None):
    if not value:
        return None

    try:
        return ObjectId(value)
    except Exception:
        return None


def utc_now():
    return datetime.utcnow()


# =========================================================
# SAVE FILE
# =========================================================

async def save_document(
    file: UploadFile,
):
    extension = Path(
        file.filename or ""
    ).suffix

    unique_filename = (
        f"{uuid.uuid4()}{extension}"
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        unique_filename,
    )

    with open(
        file_path,
        "wb",
    ) as buffer:
        shutil.copyfileobj(
            file.file,
            buffer,
        )

    return {
        "original_filename": file.filename,
        "stored_filename": unique_filename,
        "file_path": file_path,
        "mime_type": (
            file.content_type
            or "application/octet-stream"
        ),
        "file_size": os.path.getsize(
            file_path
        ),
    }


# =========================================================
# CREATE DOCUMENT METADATA
# =========================================================

async def create_document_metadata(
    file_info: dict,
    document_type: str,
    company_id: str,
    uploaded_by: str,
    department_id: str | None = None,
):
    company_object_id = convert_object_id(
        company_id
    )

    uploaded_by_object_id = convert_object_id(
        uploaded_by
    )

    department_object_id = (
        convert_object_id(
            department_id
        )
        if department_id
        else None
    )

    if not company_object_id:
        raise ValueError(
            "Invalid company ID"
        )

    if not uploaded_by_object_id:
        raise ValueError(
            "Invalid uploader ID"
        )

    document = {
        "company_id": company_object_id,

        "uploaded_by": uploaded_by_object_id,

        "department_id": department_object_id,

        "original_filename": file_info[
            "original_filename"
        ],

        "stored_filename": file_info[
            "stored_filename"
        ],

        "storage_path": file_info[
            "file_path"
        ],

        "document_type": document_type,

        "mime_type": file_info[
            "mime_type"
        ],

        "file_size": file_info[
            "file_size"
        ],

        "status": DocumentStatus.UPLOADED,

        "created_at": utc_now(),

        "updated_at": utc_now(),

        "processed_at": None,
    }

    result = await document_collection.insert_one(
        document
    )

    return str(
        result.inserted_id
    )


# =========================================================
# INDEX DOCUMENT CHUNKS
# =========================================================

def index_document_chunks(
    chunks,
    document,
    document_id,
):
    for index, chunk in enumerate(
        chunks
    ):
        print(
            f"Processing Chunk {index + 1}"
        )

        metadata = {
            "document_id": document_id,

            "company_id": str(
                document["company_id"]
            ),

            "chunk_number": index,

            "document_type": document[
                "document_type"
            ],

            "source": document[
                "original_filename"
            ],
        }

        if document.get(
            "uploaded_by"
        ):
            metadata["uploaded_by"] = str(
                document["uploaded_by"]
            )

        if document.get(
            "department_id"
        ):
            metadata["department_id"] = str(
                document["department_id"]
            )

        doc = Document(
            page_content=chunk,
            metadata=metadata,
        )

        vector_store.add_documents(
            documents=[doc],
            ids=[
                f"{document_id}_{index}"
            ],
        )

    print(
        "All chunks stored in ChromaDB"
    )


# =========================================================
# PROCESS DOCUMENT
# =========================================================

async def process_document(
    document_id: str,
):
    object_id = convert_object_id(
        document_id
    )

    if not object_id:
        return

    await document_collection.update_one(
        {
            "_id": object_id
        },
        {
            "$set": {
                "status":
                    DocumentStatus.PROCESSING,
                "updated_at":
                    utc_now(),
            }
        },
    )

    document = await document_collection.find_one(
        {
            "_id": object_id
        }
    )

    if not document:
        return

    try:
        file_path = document[
            "storage_path"
        ]

        text = extract_document_text(
            file_path
        )

        await document_collection.update_one(
            {
                "_id": object_id
            },
            {
                "$set": {
                    "extracted_text": text,
                    "updated_at": utc_now(),
                }
            },
        )

        print(
            "========== EXTRACTED TEXT =========="
        )
        print(text)
        print(
            "===================================="
        )

        chunks = split_text(text)

        print(
            f"Total Chunks: {len(chunks)}"
        )

        index_document_chunks(
            chunks,
            document,
            document_id,
        )

        await document_collection.update_one(
            {
                "_id": object_id
            },
            {
                "$set": {
                    "status":
                        DocumentStatus.COMPLETED,
                    "updated_at":
                        utc_now(),
                    "processed_at":
                        utc_now(),
                }
            },
        )

        await create_analysis_job(
            document_id
        )

        print(
            f"Completed: {document_id}"
        )

    except Exception as error:
        print(
            f"Document processing failed: {error}"
        )

        await document_collection.update_one(
            {
                "_id": object_id
            },
            {
                "$set": {
                    "status":
                        DocumentStatus.FAILED,
                    "updated_at":
                        utc_now(),
                }
            },
        )


# =========================================================
# TEXT EXTRACTION
# =========================================================

def extract_document_text(
    file_path: str,
) -> str:
    return extract_text_from_pdf(
        file_path
    )

def clean_extracted_text(
    text: str,
) -> str:
    text = re.sub(
        r"\bI(?=\d[\d,]*(?:\.\d+)?)",
        "₹",
        text,
    )

    return text


def extract_text_from_pdf(
    file_path: str,
) -> str:
    text_parts = []

    doc = fitz.open(
        file_path
    )

    for page_number, page in enumerate(
        doc,
        start=1,
    ):
        page_text = page.get_text().strip()

        if len(page_text) >= 50:
            text_parts.append(
                page_text
            )

            print(
                f"Page {page_number}: "
                "PyMuPDF text used"
            )

        else:
            print(
                f"Page {page_number}: "
                "Insufficient text, using OCR"
            )

            ocr_text = ocr_page(
                page
            )

            if ocr_text:
                text_parts.append(
                    ocr_text
                )

    doc.close()

    text = "\n\n".join(
        text_parts
    )

    text = clean_extracted_text(
        text
    )

    print(
        "========== EXTRACTED TEXT =========="
    )
    print(text)
    print(
        "===================================="
    )

    return text

# =========================================================
# BUILD DOCUMENT ACCESS QUERY
# =========================================================

def build_document_access_query(
    company_id: str,
    user_id: str,
    role: str,
    department_id: str | None = None,
):
    company_object_id = convert_object_id(
        company_id
    )

    user_object_id = convert_object_id(
        user_id
    )

    if not company_object_id:
        return {
            "_id": None
        }

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    if role == "admin":
        return {
            "company_id":
                company_object_id
        }

    # -----------------------------------------------------
    # MANAGER
    # -----------------------------------------------------

    if role == "manager":
        department_object_id = (
            convert_object_id(
                department_id
            )
        )

        if not department_object_id:
            return {
                "_id": None
            }

        return {
            "company_id":
                company_object_id,

            "department_id":
                department_object_id,
        }

    # -----------------------------------------------------
    # EMPLOYEE
    # -----------------------------------------------------

    if not user_object_id:
        return {
            "_id": None
        }

    return {
        "company_id":
            company_object_id,

        "uploaded_by":
            user_object_id,
    }


# =========================================================
# GET COMPANY DOCUMENTS
# =========================================================

async def get_company_documents(
    company_id: str,
    user_id: str,
    role: str,
    department_id: str | None = None,
    search: str | None = None,
    document_type: str | None = None,
    sort: str = "newest",
):
    query = build_document_access_query(
        company_id=company_id,
        user_id=user_id,
        role=role,
        department_id=department_id,
    )

    # -----------------------------------------------------
    # SEARCH
    # -----------------------------------------------------

    if search and search.strip():
        query[
            "original_filename"
        ] = {
            "$regex": search.strip(),
            "$options": "i",
        }

    # -----------------------------------------------------
    # DOCUMENT TYPE
    # -----------------------------------------------------

    if document_type:
        query[
            "document_type"
        ] = document_type

    # -----------------------------------------------------
    # SORT
    # -----------------------------------------------------

    sort_field = "created_at"
    sort_direction = -1

    if sort == "oldest":
        sort_direction = 1

    elif sort == "name_asc":
        sort_field = "original_filename"
        sort_direction = 1

    elif sort == "name_desc":
        sort_field = "original_filename"
        sort_direction = -1

    elif sort == "updated":
        sort_field = "updated_at"
        sort_direction = -1

    documents = (
        await document_collection
        .find(query)
        .sort(
            sort_field,
            sort_direction,
        )
        .to_list(length=None)
    )

    result = []

    for document in documents:
        uploader = None

        if document.get(
            "uploaded_by"
        ):
            uploader = (
                await user_collection.find_one(
                    {
                        "_id":
                            document[
                                "uploaded_by"
                            ]
                    }
                )
            )

        result.append(
            {
                "id": str(
                    document["_id"]
                ),

                "company_id": str(
                    document["company_id"]
                ),

                "uploaded_by": str(
                    document.get(
                        "uploaded_by"
                    )
                ),

                "uploader_name": (
                    uploader["name"]
                    if uploader
                    else "Unknown user"
                ),

                "department_id": (
                    str(
                        document[
                            "department_id"
                        ]
                    )
                    if document.get(
                        "department_id"
                    )
                    else None
                ),

                "original_filename":
                    document[
                        "original_filename"
                    ],

                "stored_filename":
                    document[
                        "stored_filename"
                    ],

                "storage_path":
                    document[
                        "storage_path"
                    ],

                "document_type":
                    document[
                        "document_type"
                    ],

                "mime_type":
                    document[
                        "mime_type"
                    ],

                "file_size":
                    document[
                        "file_size"
                    ],

                "status":
                    document[
                        "status"
                    ],

                "created_at":
                    document[
                        "created_at"
                    ],

                "updated_at":
                    document[
                        "updated_at"
                    ],

                "processed_at":
                    document.get(
                        "processed_at"
                    ),
            }
        )

    return result


# =========================================================
# GET DOCUMENT FOR USER
# =========================================================

async def get_document_for_user(
    document_id: str,
    current_user,
):
    document_object_id = convert_object_id(
        document_id
    )

    if not document_object_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid document ID.",
        )

    document = await document_collection.find_one(
        {
            "_id":
                document_object_id
        }
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    # -----------------------------------------------------
    # COMPANY CHECK
    # -----------------------------------------------------

    if document[
        "company_id"
    ] != current_user[
        "company_id"
    ]:
        raise HTTPException(
            status_code=403,
            detail=(
                "You cannot access a document "
                "from another organization."
            ),
        )

    role = current_user.get(
        "role"
    )

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    if role == "admin":
        return document

    # -----------------------------------------------------
    # MANAGER
    # -----------------------------------------------------

    if role == "manager":
        manager_department = (
            current_user.get(
                "department_id"
            )
        )

        document_department = (
            document.get(
                "department_id"
            )
        )

        if (
            not manager_department
            or manager_department
            != document_department
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You are not allowed to "
                    "access documents from "
                    "another department."
                ),
            )

        return document

    # -----------------------------------------------------
    # EMPLOYEE
    # -----------------------------------------------------

    if document.get(
        "uploaded_by"
    ) != current_user[
        "_id"
    ]:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not allowed to "
                "access documents uploaded "
                "by another user."
            ),
        )

    return document


# =========================================================
# DELETE DOCUMENT
# =========================================================

async def delete_document(
    document_id: str,
    current_user,
):
    document = await get_document_for_user(
        document_id,
        current_user,
    )

    role = current_user.get(
        "role"
    )

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    if role == "admin":
        allowed = True

    # -----------------------------------------------------
    # MANAGER
    # -----------------------------------------------------

    elif role == "manager":
        allowed = (
            document.get(
                "department_id"
            )
            == current_user.get(
                "department_id"
            )
        )

    # -----------------------------------------------------
    # EMPLOYEE
    # -----------------------------------------------------

    else:
        allowed = (
            document.get(
                "uploaded_by"
            )
            == current_user["_id"]
        )

    if not allowed:
        raise HTTPException(
            status_code=403,
            detail=(
                "You don't have permission "
                "to delete this document."
            ),
        )

    # -----------------------------------------------------
    # DELETE CHROMADB DATA
    # -----------------------------------------------------

    try:
        vector_store._collection.delete(
            where={
                "document_id": document_id
            }
        )

        print(
            f"ChromaDB data deleted: "
            f"{document_id}"
        )

    except Exception as error:
        print(
            f"ChromaDB deletion failed for "
            f"{document_id}: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to remove document "
                "from vector storage."
            ),
        )

    # -----------------------------------------------------
    # DELETE FILE
    # -----------------------------------------------------

    storage_path = document.get(
        "storage_path"
    )

    if (
        storage_path
        and os.path.exists(
            storage_path
        )
    ):
        try:
            os.remove(
                storage_path
            )

        except OSError as error:
            print(
                f"Could not remove file: {error}"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to remove document file."
                ),
            )

    # -----------------------------------------------------
    # DELETE DATABASE RECORD
    # -----------------------------------------------------

    await document_collection.delete_one(
        {
            "_id":
                document["_id"]
        }
    )

    return {
        "message":
            "Document deleted successfully.",

        "document_id":
            document_id,
    }
   

   


# =========================================================
# GET DOCUMENT FOR DOWNLOAD
# =========================================================

async def get_document_file(
    document_id: str,
    current_user,
):
    document = await get_document_for_user(
        document_id,
        current_user,
    )

    file_path = document.get(
        "storage_path"
    )

    if (
        not file_path
        or not os.path.exists(
            file_path
        )
    ):
        raise HTTPException(
            status_code=404,
            detail="Document file not found.",
        )

    return document