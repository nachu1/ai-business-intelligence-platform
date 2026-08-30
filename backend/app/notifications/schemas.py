from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: Literal[
        "info",
        "success",
        "warning",
        "task",
        "document",
        "user",
        "security",
    ]
    is_read: bool
    created_at: datetime
    action_url: str | None = None