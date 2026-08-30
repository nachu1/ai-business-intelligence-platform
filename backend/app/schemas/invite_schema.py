from pydantic import BaseModel, EmailStr


class InviteUserSchema(BaseModel):
    name: str
    email: EmailStr
    department_id: str
    designation_id: str
    role: str