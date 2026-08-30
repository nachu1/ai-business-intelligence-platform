from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException
from langchain_core.messages import HumanMessage, AIMessage
from google.genai.errors import ClientError

from app.ai.graph.graph import graph
from app.ai.langchain_llm import llm
from app.database.mongodb import (
    chat_collection,
    message_collection,
)


# =========================================================
# CHAT
# =========================================================

async def create_chat(
    company_id: str,
    user_id: str,
    title: str | None,
):
    chat = {
        "company_id": ObjectId(company_id),
        "user_id": ObjectId(user_id),
        "title": title or "New Chat",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await chat_collection.insert_one(chat)
    return str(result.inserted_id)


async def get_user_chats(user_id: str):
    return await chat_collection.find(
        {"user_id": ObjectId(user_id)}
    ).sort(
        "updated_at", -1
    ).to_list(length=None)


async def get_chat_messages(chat_id: str):
    return await message_collection.find(
        {"chat_id": ObjectId(chat_id)}
    ).sort(
        "created_at", 1
    ).to_list(length=None)


async def get_chat_history(chat_id: str, limit: int = 20):
    messages = await message_collection.find(
        {"chat_id": ObjectId(chat_id)}
    ).sort(
        "created_at", -1
    ).limit(limit).to_list(length=limit)

    messages.reverse()

    history = []

    for message in messages:
        if message["role"] == "user":
            history.append(
                HumanMessage(
                    content=message["content"]
                )
            )
        else:
            history.append(
                AIMessage(
                    content=message["content"]
                )
            )

    return history


async def get_chat_by_id(chat_id: str):
    return await chat_collection.find_one(
        {"_id": ObjectId(chat_id)}
    )


async def verify_chat_owner(
    chat_id: str,
    user_id: str,
):
    chat = await get_chat_by_id(chat_id)

    if chat is None:
        raise HTTPException(
            status_code=404,
            detail="Chat not found",
        )

    if str(chat["user_id"]) != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    return chat


# =========================================================
# CHAT TITLE
# =========================================================

async def generate_chat_title(
    first_message: str,
) -> str:
    prompt = f"""
Generate a short and meaningful chat title (maximum 6 words)
based on the user's first message.

Return ONLY the title.
Do not use quotes.
Do not add punctuation.

User message:
{first_message}
"""

    response = await llm.ainvoke(prompt)

    return response.content.strip()


# =========================================================
# MESSAGE HELPERS
# =========================================================

async def save_user_message(
    chat_id: str,
    content: str,
):
    await message_collection.insert_one(
        {
            "chat_id": ObjectId(chat_id),
            "role": "user",
            "content": content,
            "created_at": datetime.utcnow(),
        }
    )


async def save_assistant_message(
    chat_id: str,
    content: str,
):
    await message_collection.insert_one(
        {
            "chat_id": ObjectId(chat_id),
            "role": "assistant",
            "content": content,
            "created_at": datetime.utcnow(),
        }
    )


async def update_chat_timestamp(
    chat_id: str,
):
    await chat_collection.update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$set": {
                "updated_at": datetime.utcnow()
            }
        },
    )


# =========================================================
# SOURCE EXTRACTION
# =========================================================

def extract_sources(context):
    sources = []
    seen = set()

    for doc in context:
        metadata = doc.metadata

        source = {
            "document": metadata.get(
                "source",
                "Unknown document",
            ),
            "document_type": metadata.get(
                "document_type",
                "other",
            ),
            "chunk": metadata.get(
                "chunk_number",
                0,
            ),
        }

        key = (
            source["document"],
            source["chunk"],
        )

        if key not in seen:
            seen.add(key)
            sources.append(source)

    return sources


# =========================================================
# SEND MESSAGE
# =========================================================

async def send_message(
    chat_id: str,
    company_id: str,
    content: str,
    current_user: dict,
):
    await save_user_message(
        chat_id,
        content,
    )

    user_message_count = (
        await message_collection.count_documents(
            {
                "chat_id": ObjectId(chat_id),
                "role": "user",
            }
        )
    )

    history = await get_chat_history(
        chat_id
    )

    # -----------------------------------------------------
    # AI GRAPH
    # -----------------------------------------------------

    response = await graph.ainvoke(
      {
        "current_user": current_user,
        "input": content,
        "chat_history": history,
        "context": [],
        "company_context": "",
        "answer": "",
        "route": "",
        "conversation_context": {},
      }
    )

    sources = extract_sources(
        response["context"]
    )

    # -----------------------------------------------------
    # GENERATE TITLE
    # -----------------------------------------------------

    if user_message_count == 1:
        title = await generate_chat_title(
            content
        )

        await chat_collection.update_one(
            {
                "_id": ObjectId(chat_id)
            },
            {
                "$set": {
                    "title": title
                }
            },
        )

    # -----------------------------------------------------
    # SAVE RESPONSE
    # -----------------------------------------------------

    await save_assistant_message(
        chat_id,
        response["answer"],
    )

    await update_chat_timestamp(
        chat_id
    )

    return {
        "answer": response["answer"],
        "sources": sources,
    }


# =========================================================
# STREAM MESSAGE
# =========================================================



# =========================================================
# STREAM MESSAGE
# =========================================================

async def stream_message(
    chat_id: str,
    company_id: str,
    content: str,
    current_user: dict,
):
    await save_user_message(
        chat_id,
        content,
    )

    user_message_count = (
        await message_collection.count_documents(
            {
                "chat_id": ObjectId(chat_id),
                "role": "user",
            }
        )
    )

    history = await get_chat_history(chat_id)

    response_text = ""
    company_answer = None
    ai_error = False

    try:
        async for event in graph.astream_events(
            {
                "current_user": current_user,
                "input": content,
                "chat_history": history,
                "context": [],
                "company_context": "",
                "answer": "",
                "route": "",
                "conversation_context": {},
            },
            version="v2",
        ):
            event_name = event["event"]
            node = event.get("metadata", {}).get(
                "langgraph_node"
            )

            if (
                event_name == "on_chat_model_stream"
                and node in {
                    "rag",
                    "general",
                }
            ):
                chunk = event["data"]["chunk"]

                if chunk.content:
                    response_text += chunk.content
                    yield chunk.content

            elif (
                event_name == "on_chain_end"
                and node == "company"
            ):
                output = event["data"].get("output")

                if isinstance(output, dict):
                    answer = output.get("answer")

                    if answer:
                        company_answer = answer

    except ClientError as error:

        if error.code == 429:
            ai_error = True

            error_message = (
                "The AI service is temporarily unavailable "
                "because the usage limit has been reached. "
                "Please try again later."
            )

            yield error_message

        else:
            raise

    except Exception as error:

        print(
            f"AI streaming error: {error}"
        )

        ai_error = True

        yield (
            "Sorry, there was an issue processing "
            "your request. Please try again later."
        )

    if ai_error:
        return

    if company_answer:
        response_text = company_answer
        yield company_answer

    if user_message_count == 1:
        title = await generate_chat_title(content)

        await chat_collection.update_one(
            {
                "_id": ObjectId(chat_id)
            },
            {
                "$set": {
                    "title": title
                }
            },
        )

    await save_assistant_message(
        chat_id,
        response_text,
    )

    await update_chat_timestamp(
        chat_id
    )



 

   
    

async def delete_chat(chat_id: str):
    await message_collection.delete_many(
        {"chat_id": ObjectId(chat_id)}
    )

    result = await chat_collection.delete_one(
        {"_id": ObjectId(chat_id)}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Chat not found",
        )