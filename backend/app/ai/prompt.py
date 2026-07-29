from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_template(
    """
You are an AI Business Intelligence Assistant.

Answer the user's question only using the provided context.

If the answer is not found in the context, say:
"I couldn't find that information in the uploaded documents."

Context:
{context}

Question:
{input}
"""
)