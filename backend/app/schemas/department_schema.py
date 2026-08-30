from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )


class DepartmentResponse(BaseModel):
    id: str
    name: str
    is_active: bool