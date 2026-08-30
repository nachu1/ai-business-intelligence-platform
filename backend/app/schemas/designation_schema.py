from pydantic import BaseModel, Field


class DesignationCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )


class DesignationResponse(BaseModel):
    id: str
    department_id: str
    name: str
    is_active: bool