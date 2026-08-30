import asyncio
from datetime import datetime

from bson import ObjectId

from app.database.mongodb import (
    document_analysis_job_collection,
    document_collection,
    document_analysis_collection,
)
from app.documents.analysis.service import (
    process_document_analysis,
)
from app.documents.analysis.retriever import (
    retrieve_relevant_documents,
)
from app.services.insight_email_service import (
    send_insight_email,
)


def utc_now():
    return datetime.utcnow()


async def process_analysis_job(job):
    job_id = job["_id"]
    document_id = job["document_id"]

    try:
        document_object_id = ObjectId(
            document_id
        )

        document = await document_collection.find_one(
            {
                "_id": document_object_id
            }
        )

        if not document:
            raise ValueError(
                f"Document not found: {document_id}"
            )

        text = document.get(
            "extracted_text"
        )

        if not text:
            raise ValueError(
                f"Extracted text not found: {document_id}"
            )

        await document_analysis_job_collection.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": "processing",
                    "started_at": utc_now(),
                    "error": None,
                },
                "$inc": {
                    "attempts": 1,
                },
            },
        )

        # -------------------------------------------------
        # FIND RELEVANT PREVIOUS DOCUMENTS
        # -------------------------------------------------

        relevant_documents = (
            retrieve_relevant_documents(
                text=text,
                company_id=str(
                    document["company_id"]
                ),
                current_document_id=document_id,
            )
        )

        print(
            f"Relevant documents found: "
            f"{len(relevant_documents)}"
        )

        # -------------------------------------------------
        # GET ANALYSES FOR RELEVANT DOCUMENTS
        # -------------------------------------------------

        previous_documents = []

        for related_document in relevant_documents:

            analysis = (
                await document_analysis_collection.find_one(
                    {
                        "document_id":
                            related_document[
                                "document_id"
                            ],
                        "status": "completed",
                    }
                )
            )

            if analysis:
                previous_documents.append(
                    analysis
                )

        print(
            f"Relevant previous analyses found: "
            f"{len(previous_documents)}"
        )

        # -------------------------------------------------
        # ANALYZE DOCUMENT
        # -------------------------------------------------

        analysis = await process_document_analysis(
          document_id=document_id,
          text=text,
          company_id=str(
            document["company_id"]
          ),
          previous_documents=previous_documents,
          relevant_documents=relevant_documents,
        )
        if analysis and analysis.get("insights"):
           asyncio.create_task(
              send_insight_email(
                company_id=str(
                   document["company_id"]
                ),
                insights=analysis["insights"],
              )
           )
        # -------------------------------------------------
        # COMPLETE JOB
        # -------------------------------------------------

        await document_analysis_job_collection.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": utc_now(),
                }
            },
        )

        print(
            f"Analysis completed: {document_id}"
        )

    except Exception as error:
        print(
            f"Analysis job failed for "
            f"{document_id}: {error}"
        )

        await document_analysis_job_collection.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(error),
                }
            },
        )


async def analysis_worker():
    print(
        "Document analysis worker started."
    )

    while True:
        job = await document_analysis_job_collection.find_one(
            {
                "status": "pending"
            }
        )

        if job:
            await process_analysis_job(job)
        else:
            await asyncio.sleep(2)