from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException

from app.database.mongodb import (
    conversation_collection,
    user_message_collection,
    user_collection,
)


def oid(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


def utc_now():
    return datetime.now(timezone.utc)


def utc_iso(value):
    if not value:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc).isoformat()


async def can_message(sender_id: str, receiver_id: str):
    sender = await user_collection.find_one(
        {"_id": oid(sender_id)}
    )
    receiver = await user_collection.find_one(
        {"_id": oid(receiver_id)}
    )

    if not sender or not receiver:
        raise HTTPException(404, "User not found")

    if sender["company_id"] != receiver["company_id"]:
        raise HTTPException(
            403,
            "You cannot message users outside your organization.",
        )

    if not sender.get("is_active") or not receiver.get("is_active"):
        raise HTTPException(
            403,
            "Inactive users cannot use messaging.",
        )

    if (
        sender["role"] == "employee"
        and receiver["role"] == "employee"
    ):
        raise HTTPException(
            403,
            "Employees cannot message other employees.",
        )

    return sender, receiver


async def get_or_create_conversation(
    sender_id: str,
    receiver_id: str,
):
    sender, receiver = await can_message(
        sender_id,
        receiver_id,
    )

    participants = sorted([
        oid(sender_id),
        oid(receiver_id),
    ])

    conversation = await conversation_collection.find_one({
        "company_id": sender["company_id"],
        "participants": participants,
    })

    if conversation:
        return conversation

    now = utc_now()

    result = await conversation_collection.insert_one({
        "company_id": sender["company_id"],
        "participants": participants,
        "last_message": None,
        "last_message_at": None,
        "created_at": now,
        "updated_at": now,
    })

    return await conversation_collection.find_one(
        {"_id": result.inserted_id}
    )


async def get_conversations(user_id: str):
    conversations = await conversation_collection.find({
        "participants": oid(user_id)
    }).sort("updated_at", -1).to_list(length=None)

    result = []

    for chat in conversations:
        other_id = next(
            x for x in chat["participants"]
            if str(x) != user_id
        )

        other = await user_collection.find_one(
            {"_id": other_id}
        )

        if not other:
            continue

        unread = await user_message_collection.count_documents({
            "conversation_id": chat["_id"],
            "receiver_id": oid(user_id),
            "is_read": False,
        })

        result.append({
            "id": str(chat["_id"]),
            "user_id": str(other["_id"]),
            "name": other["name"],
            "email": other["email"],
            "role": other["role"],
            "last_message": chat.get("last_message"),
            "last_message_at": utc_iso(
                chat.get("last_message_at")
            ),
            "unread_count": unread,
            "is_online": other.get("is_online", False),
            "last_seen": utc_iso(
                other.get("last_seen")
            ),
        })

    return result


async def search_message_users(
    user_id: str,
    search: str = "",
):
    current_user = await user_collection.find_one(
        {"_id": oid(user_id)}
    )

    if not current_user:
        raise HTTPException(404, "User not found")

    query = {
        "company_id": current_user["company_id"],
        "is_active": True,
        "_id": {"$ne": oid(user_id)},
    }

    if search.strip():
        query["$or"] = [
            {
                "name": {
                    "$regex": search.strip(),
                    "$options": "i",
                }
            },
            {
                "email": {
                    "$regex": search.strip(),
                    "$options": "i",
                }
            },
        ]

    # Managers and employees should not see admins
    # in the "Search People" list.
    if current_user["role"] in ["manager", "employee"]:
        query["role"] = {"$ne": "admin"}

    users = await user_collection.find(
        query
    ).sort("name", 1).limit(20).to_list(length=20)

    return [
        {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "is_online": user.get(
                "is_online",
                False
            ),
            "last_seen": utc_iso(
                user.get("last_seen")
            ),
        }
        for user in users
    ]


async def get_messages(
    conversation_id: str,
    user_id: str,
):
    conversation = await conversation_collection.find_one({
        "_id": oid(conversation_id),
        "participants": oid(user_id),
    })

    if not conversation:
        raise HTTPException(
            404,
            "Conversation not found",
        )

    messages = await user_message_collection.find({
        "conversation_id": conversation["_id"]
    }).sort("created_at", 1).to_list(length=None)

    return [
        {
            "id": str(message["_id"]),
            "sender_id": str(message["sender_id"]),
            "receiver_id": str(message["receiver_id"]),
            "content": message["content"],
            "is_read": message["is_read"],
            "created_at": utc_iso(
                message["created_at"]
            ),
        }
        for message in messages
    ]


async def send_message(
    sender_id: str,
    receiver_id: str,
    content: str,
):
    sender, receiver = await can_message(
        sender_id,
        receiver_id,
    )

    conversation = await get_or_create_conversation(
        sender_id,
        receiver_id,
    )

    text = content.strip()

    now = utc_now()

    result = await user_message_collection.insert_one({
        "conversation_id": conversation["_id"],
        "sender_id": oid(sender_id),
        "receiver_id": oid(receiver_id),
        "content": text,
        "is_read": False,
        "created_at": now,
    })

    await conversation_collection.update_one(
        {"_id": conversation["_id"]},
        {
            "$set": {
                "last_message": text,
                "last_message_at": now,
                "updated_at": now,
            }
        },
    )

    return {
        "id": str(result.inserted_id),
        "conversation_id": str(conversation["_id"]),
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": text,
        "is_read": False,
        "created_at": utc_iso(now),
    }


async def mark_as_read(
    conversation_id: str,
    user_id: str,
):
    conversation = await conversation_collection.find_one({
        "_id": oid(conversation_id),
        "participants": oid(user_id),
    })

    if not conversation:
        raise HTTPException(
            404,
            "Conversation not found",
        )

    await user_message_collection.update_many(
        {
            "conversation_id": conversation["_id"],
            "receiver_id": oid(user_id),
            "is_read": False,
        },
        {
            "$set": {
                "is_read": True
            }
        },
    )

    return {
        "message": "Messages marked as read"
    }


# =========================================================
# PRESENCE
# =========================================================

async def set_user_online(user_id: str):
    await user_collection.update_one(
        {"_id": oid(user_id)},
        {
            "$set": {
                "is_online": True,
            }
        },
    )


async def set_user_offline(user_id: str):
    now = utc_now()

    await user_collection.update_one(
        {"_id": oid(user_id)},
        {
            "$set": {
                "is_online": False,
                "last_seen": now,
            }
        },
    )

    return now


async def get_message_contacts(user_id: str):
    user = await user_collection.find_one(
        {"_id": oid(user_id)}
    )

    if not user:
        return []

    users = await user_collection.find({
        "company_id": user["company_id"],
        "is_active": True,
        "_id": {"$ne": oid(user_id)},
    }).to_list(length=None)

    contacts = []

    for contact in users:
        if (
            user["role"] == "employee"
            and contact["role"] == "employee"
        ):
            continue

        contacts.append(str(contact["_id"]))

    return contacts

async def delete_message(
    message_id: str,
    user_id: str,
):
    message = await user_message_collection.find_one({
        "_id": oid(message_id)
    })

    if not message:
        raise HTTPException(
            404,
            "Message not found"
        )

    if str(message["sender_id"]) != user_id:
        raise HTTPException(
            403,
            "You can only delete your own messages."
        )

    await user_message_collection.delete_one({
        "_id": message["_id"]
    })

    return {
        "message_id": message_id,
        "conversation_id": str(
            message["conversation_id"]
        ),
        "sender_id": user_id,
        "receiver_id": str(
            message["receiver_id"]
        ),
    }

async def create_message_conversation(
    user_id: str,
    receiver_id: str,
):
    conversation = await get_or_create_conversation(
        user_id,
        receiver_id,
    )

    other_id = next(
        str(x)
        for x in conversation["participants"]
        if str(x) != user_id
    )

    other = await user_collection.find_one({
        "_id": oid(other_id)
    })

    return {
        "id": str(conversation["_id"]),
        "user_id": other_id,
        "name": other["name"],
        "email": other["email"],
        "role": other["role"],
        "last_message": conversation.get(
            "last_message"
        ),
        "last_message_at": utc_iso(
            conversation.get("last_message_at")
        ),
        "unread_count": 0,
        "is_online": other.get(
            "is_online",
            False
        ),
        "last_seen": utc_iso(
            other.get("last_seen")
        ),
    }

async def clear_chat(
    conversation_id: str,
    user_id: str,
):
    conversation = await conversation_collection.find_one(
        {
            "_id": oid(conversation_id),
            "participants": oid(user_id),
        }
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    result = await user_message_collection.delete_many(
        {
            "conversation_id": conversation["_id"],
        }
    )

    await conversation_collection.update_one(
        {
            "_id": conversation["_id"],
        },
        {
            "$set": {
                "last_message": None,
                "last_message_at": None,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {
        "message": "Chat cleared",
        "deleted_count": result.deleted_count,
        "conversation_id": conversation_id,
    }