from typing import TypedDict

from langchain_core.documents import Document


class GraphState(TypedDict):
    current_user: dict
    input: str
    chat_history: list
    context: list[Document]
    company_context: str
    answer: str
    route: str
    conversation_context: dict
