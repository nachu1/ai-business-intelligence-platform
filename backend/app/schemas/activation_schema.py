


from pydantic import BaseModel


class ActivateAccountSchema(BaseModel):
    token: str
    password: str
    confirm_password: str