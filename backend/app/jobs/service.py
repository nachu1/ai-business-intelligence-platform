from datetime import datetime

from app.database.mongodb import (
    document_analysis_job_collection,
)


def utc_now():
    return datetime.utcnow()


async def create_analysis_job(
    document_id: str,
):
    existing_job = await document_analysis_job_collection.find_one(
        {
            "document_id": document_id,
            "status": {
                "$in": [
                    "pending",
                    "processing",
                ]
            },
        }
    )

    if existing_job:
        return str(existing_job["_id"])

    job = {
        "document_id": document_id,
        "status": "pending",
        "attempts": 0,
        "created_at": utc_now(),
        "started_at": None,
        "completed_at": None,
        "error": None,
    }

    result = await document_analysis_job_collection.insert_one(
        job
    )

    print(
        f"Analysis job created: {document_id}"
    )

    return str(result.inserted_id)