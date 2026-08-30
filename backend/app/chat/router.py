from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.chat.schemas import (
    CreateChatRequest,
    SendMessageRequest,
)
from app.auth.security import get_current_user
from app.chat.service import (
    create_chat,
    get_user_chats,
    get_chat_messages,
    verify_chat_owner,
    send_message,
    stream_message,
    delete_chat
)


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


# =========================================================
# CREATE CHAT
# =========================================================

@router.post("/create")
async def create_chat_endpoint(
    request: CreateChatRequest,
    current_user=Depends(get_current_user),
):
    chat_id = await create_chat(
        company_id=str(current_user["company_id"]),
        user_id=str(current_user["_id"]),
        title=request.title,
    )

    return {
        "message": "Chat created successfully",
        "chat_id": chat_id,
    }


# =========================================================
# GET USER CHATS
# =========================================================

@router.get("")
async def get_chats(
    current_user=Depends(get_current_user),
):
    chats = await get_user_chats(
        str(current_user["_id"])
    )

    return [
        {
            "chat_id": str(chat["_id"]),
            "title": chat["title"],
            "updated_at": chat["updated_at"],
        }
        for chat in chats
    ]


# =========================================================
# GET CHAT MESSAGES
# =========================================================

@router.get("/{chat_id}")
async def get_chat(
    chat_id: str,
    current_user=Depends(get_current_user),
):
    await verify_chat_owner(
        chat_id,
        str(current_user["_id"]),
    )

    messages = await get_chat_messages(chat_id)

    return {
        "chat_id": chat_id,
        "messages": [
            {
                "role": message["role"],
                "content": message["content"],
                "created_at": message["created_at"],
            }
            for message in messages
        ],
    }


@router.delete("/{chat_id}")
async def delete_chat_endpoint(
    chat_id: str,
    current_user=Depends(get_current_user),
):
    await verify_chat_owner(
        chat_id,
        str(current_user["_id"]),
    )

    await delete_chat(chat_id)

    return {
        "message": "Chat deleted successfully"
    }

# =========================================================
# SEND MESSAGE
# =========================================================

@router.post("/{chat_id}/message")
async def send_message_endpoint(
    chat_id: str,
    request: SendMessageRequest,
    current_user=Depends(get_current_user),
):
    await verify_chat_owner(
        chat_id,
        str(current_user["_id"]),
    )

    return await send_message(
        chat_id=chat_id,
        company_id=str(current_user["company_id"]),
        content=request.content,
        current_user=current_user,
    )


# =========================================================
# STREAM MESSAGE
# =========================================================

@router.post("/{chat_id}/stream")
async def stream_chat(
    chat_id: str,
    request: SendMessageRequest,
    current_user=Depends(get_current_user),
):
    await verify_chat_owner(
        chat_id,
        str(current_user["_id"]),
    )

    return StreamingResponse(
        stream_message(
            chat_id=chat_id,
            company_id=str(current_user["company_id"]),
            content=request.content,
            current_user=current_user,
        ),
        media_type="text/plain",
    )