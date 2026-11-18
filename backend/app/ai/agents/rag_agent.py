
from app.ai.graph.nodes import rag_node


async def rag_agent(state):
    print("RAG AGENT START", flush=True)

    question = state["input"]
    provider = state.get("provider", "gemini")

    print("RAG AGENT QUESTION:", question, flush=True)
    print("RAG AGENT PROVIDER:", provider, flush=True)

    result = await rag_node(state)

    print(
        "RAG AGENT SOURCES:",
        len(result.get("context", [])),
        flush=True,
    )

    print("RAG AGENT END", flush=True)

    return result
