from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentType(str, Enum):
    SALES_REPORT = "sales_report"
    INVOICE = "invoice"
    INVENTORY = "inventory"
    FINANCIAL_STATEMENT = "financial_statement"
    PURCHASE_ORDER = "purchase_order"
    OTHER = "other"


class DocumentResponse(BaseModel):
    id: str
    company_id: str
    uploaded_by: str

    original_filename: str
    stored_filename: str
    storage_path: str

    document_type: DocumentType

    mime_type: str
    file_size: int

    status: DocumentStatus

    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None
    
class SearchRequest(BaseModel):
    question: str