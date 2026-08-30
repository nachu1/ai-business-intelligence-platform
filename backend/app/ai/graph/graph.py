from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.ai.graph.state import GraphState
from app.ai.agents.supervisor_agent import supervisor_agent
from app.ai.agents.company_agent import company_agent
from app.ai.agents.rag_agent import rag_agent
from app.ai.agents.general_agent import general_agent


async def supervisor_node(state: GraphState):
    route = await supervisor_agent(
        question=state["input"],
        chat_history=state["chat_history"],
    )

    state["route"] = route

    return state


builder = StateGraph(GraphState)

builder.add_node(
    "supervisor",
    supervisor_node,
)

builder.add_node(
    "company",
    company_agent,
)

builder.add_node(
    "rag",
    rag_agent,
)

builder.add_node(
    "general",
    general_agent,
)

builder.add_edge(
    START,
    "supervisor",
)

builder.add_conditional_edges(
    "supervisor",
    lambda state: state["route"],
    {
        "company": "company",
        "rag": "rag",
        "general": "general",
    },
)

builder.add_edge("company", END)
builder.add_edge("rag", END)
builder.add_edge("general", END)

graph = builder.compile()