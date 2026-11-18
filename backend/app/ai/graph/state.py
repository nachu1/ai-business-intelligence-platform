from typing import TypedDict

from langchain_core.documents import Document


class GraphState(TypedDict):
    current_user: dict
    provider: str
    input: str
    chat_history: list
    context: list[Document]
    company_context: str
    answer: str
    route: str
    search_query: str | None
    conversation_context: dict
