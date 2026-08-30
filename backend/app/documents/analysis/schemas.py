from typing import Any, Optional

from pydantic import BaseModel, Field


class DocumentAnalysis(BaseModel):
    document_id: str

    summary: Optional[str] = None

    entities: list[dict[str, Any]] = Field(
        default_factory=list
    )

    facts: list[dict[str, Any]] = Field(
        default_factory=list
    )

    relationships: list[dict[str, Any]] = Field(
        default_factory=list
    )

    status: str = "completed"