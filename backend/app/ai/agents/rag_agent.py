from app.ai.graph.nodes import rag_node


async def rag_agent(state):
    print("RAG AGENT START")

    question = state["input"]

    print("RAG AGENT QUESTION:", question)

    result = await rag_node(state)

    print(
        "RAG AGENT SOURCES:",
        len(result.get("context", [])),
    )

    print("RAG AGENT END")

    return result