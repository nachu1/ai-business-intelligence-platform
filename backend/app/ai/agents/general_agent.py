from app.ai.graph.nodes import general_node


async def general_agent(state):
    print("GENERAL AGENT START")

    result = await general_node(state)

    print("GENERAL AGENT END")

    return result