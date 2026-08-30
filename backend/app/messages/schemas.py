from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    receiver_id: str
    content: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    last_message: str | None
    last_message_at: str | None
    unread_count: int
    is_online: bool
    last_seen: str | None


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    is_read: bool
    created_at: str


class MessageUserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_online: bool
    last_seen: str | None