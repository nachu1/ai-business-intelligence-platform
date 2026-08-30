from app.ai.graph.state import GraphState
from app.ai.rag_chain import run_rag
from app.ai.langchain_llm import llm
from app.ai.company_context import get_company_context
from app.ai.prompt import general_prompt


async def rag_node(state: GraphState):
    company_context = await get_company_context(
        state["current_user"]
    )

    response = await run_rag(
        question=state["input"],
        current_user=state["current_user"],
        chat_history=state["chat_history"],
        company_context=company_context,
    )

    state["company_context"] = company_context
    state["context"] = response["context"]
    state["answer"] = response["answer"]

    return state


async def general_node(state: GraphState):
    company_context = await get_company_context(
        state["current_user"]
    )

    response = await llm.ainvoke(
        general_prompt.format_messages(
            company_context=company_context,
            chat_history=state["chat_history"],
            input=state["input"],
        )
    )

    state["company_context"] = company_context
    state["answer"] = response.content
    state["context"] = []

    return state