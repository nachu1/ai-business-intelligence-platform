from datetime import datetime
from pydantic import BaseModel, Field


class CreateTaskRequest(BaseModel):
    receiver_id: str
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    due_date: datetime | None = None


class SubmitTaskRequest(BaseModel):
    document_id: str


class TaskResponse(BaseModel):
    id: str
    company_id: str
    assigned_by: str
    assigned_to: str
    title: str
    description: str
    due_date: str | None
    status: str
    document_id: str | None
    created_at: str
    submitted_at: str | None
    reviewed_at: str | None
    rejection_reason: str | None