from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
)

from app.auth.security import get_current_user

from app.messages.schemas import SendMessageRequest

from app.messages.service import (
    get_conversations,
    get_messages,
    search_message_users,
    create_message_conversation,
    send_message,
    mark_as_read,
    delete_message,
    clear_chat,
    set_user_online,
    set_user_offline,
    get_message_contacts,
)

from app.messages.websocket import manager


router = APIRouter(
    prefix="/messages",
    tags=["Messages"],
)


@router.get("/conversations")
async def conversations(
    current_user=Depends(get_current_user),
):
    return await get_conversations(
        str(current_user["_id"])
    )


@router.get("/users")
async def search_users(
    search: str = "",
    current_user=Depends(get_current_user),
):
    return await search_message_users(
        str(current_user["_id"]),
        search,
    )


@router.post("/conversations/{receiver_id}")
async def create_conversation(
    receiver_id: str,
    current_user=Depends(get_current_user),
):
    return await create_message_conversation(
        str(current_user["_id"]),
        receiver_id,
    )


@router.delete("/message/{message_id}")
async def delete_message_endpoint(
    message_id: str,
    current_user=Depends(get_current_user),
):
    result = await delete_message(
        message_id,
        str(current_user["_id"]),
    )

    await manager.send_to_user(
        result["receiver_id"],
        {
            "type": "message_deleted",
            **result,
        },
    )

    return result


@router.delete(
    "/conversation/{conversation_id}"
)
async def clear_chat_endpoint(
    conversation_id: str,
    current_user=Depends(get_current_user),
):
    return await clear_chat(
        conversation_id,
        str(current_user["_id"]),
    )


@router.get("/{conversation_id}")
async def messages(
    conversation_id: str,
    current_user=Depends(get_current_user),
):
    return await get_messages(
        conversation_id,
        str(current_user["_id"]),
    )


@router.post("/send")
async def send(
    request: SendMessageRequest,
    current_user=Depends(get_current_user),
):
    sender_id = str(current_user["_id"])

    result = await send_message(
        sender_id,
        request.receiver_id,
        request.content,
    )

    await manager.send_to_user(
      request.receiver_id,
      {
        "type": "message",
        **result,
      },
    )

    return result


@router.patch("/{conversation_id}/read")
async def read_messages(
    conversation_id: str,
    current_user=Depends(get_current_user),
):
    return await mark_as_read(
        conversation_id,
        str(current_user["_id"]),
    )


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
):
    # Accept the WebSocket BEFORE receiving data
    await websocket.accept()

    try:
        # Receive JWT token from frontend
        token = await websocket.receive_text()

        user_id = await manager.connect(
            websocket,
            token,
        )

        if not user_id:
            return

        print(
            "WEBSOCKET USER CONNECTED:",
            user_id,
        )

        # Mark user online
        await set_user_online(user_id)

        print(
            "USER MARKED ONLINE:",
            user_id,
        )

        # Get users this person can message
        contacts = await get_message_contacts(
            user_id
        )

        print(
            "CONTACTS:",
            contacts,
        )

        # Tell currently connected contacts
        # that this user is online
        await manager.send_to_users(
            contacts,
            {
                "type": "presence",
                "user_id": user_id,
                "is_online": True,
                "last_seen": None,
            },
        )

        # Keep connection alive
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        print(
            "WEBSOCKET DISCONNECTED:",
            user_id if "user_id" in locals() else None,
        )

        if "user_id" not in locals():
            return

        manager.disconnect(
            user_id,
            websocket,
        )

        # Only mark offline when the user has
        # no other active WebSocket connections
        if not manager.is_online(user_id):

            last_seen = await set_user_offline(
                user_id
            )

            contacts = await get_message_contacts(
                user_id
            )

            await manager.send_to_users(
                contacts,
                {
                    "type": "presence",
                    "user_id": user_id,
                    "is_online": False,
                    "last_seen": last_seen.isoformat(),
                },
            )