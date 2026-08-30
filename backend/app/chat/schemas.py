from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateChatRequest(BaseModel):
    title: Optional[str] = None
class SendMessageRequest(BaseModel):
    content: str