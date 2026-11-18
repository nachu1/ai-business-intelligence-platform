
from typing import Literal
import asyncio
import json

from pydantic import BaseModel

from app.ai.langchain_llm import supervisor_llm, groq_llm


class SupervisorDecision(BaseModel):
    route: Literal[
        "company",
        "rag",
        "general",
    ]
    search_query: str | None = None


async def supervisor_agent(
    question: str,
    chat_history: list,
) -> tuple[SupervisorDecision, str]:

    recent_history = chat_history[-6:]

    history_text = "\n".join(
        f"{message.type.capitalize()}: {message.content}"
        for message in recent_history
    )

    prompt = f"""
You are the supervisor agent for a business management AI platform.

Choose the most appropriate agent for the user's current question.

AVAILABLE AGENTS:

company:
Handles application-managed company data:
- Employees, users, managers and profiles
- Departments, roles and designations
- Organizational relationships and reporting structures
- Permissions, access and document metadata

rag:
Handles information contained in uploaded company documents:
- Reports, PDFs, resumes and business documents
- Facts, figures, metrics and financial information
- Document summaries, comparisons and analysis
- Information about people, projects, events or topics mentioned
  in uploaded documents

general:
Handles requests that do not require company data or uploaded
documents, including general knowledge, writing, translation,
programming explanations and brainstorming.

ROUTING RULES:

1. Choose "company" when the answer requires structured,
   application-managed company or employee information.

2. Choose "rag" only when the user needs information from the
   actual contents of uploaded documents.

   Document names, document listings, upload status,
   document availability and access permissions belong
   to the company agent.

3. Do not assume that a person's name means an employee
   database lookup. Questions such as "Tell me about June Month",
   "Who is June Month?" or "Give me details about June Month"
   should normally route to "rag".

4. Choose "general" when neither company data nor uploaded
   document information is required.

5. Use conversation history to understand follow-up questions,
   resolve references and preserve the relevant information source.
   If the user changes the topic, select a new route.

6. Do not route based only on keywords. Understand what information
   the user actually wants.

DOCUMENT ROUTING:

- Questions about listing, finding, checking, or accessing documents
  must route to company.

- Questions about documents uploaded by the current user
  must route to company.

- Questions asking whether the user has uploaded documents
  must route to company.

- Questions asking about another user's document availability
  must route to company, where the company tools enforce permissions.

- Questions about the actual content of uploaded documents,
  such as summaries, financial figures, explanations and analysis,
  must route to rag.

- Examples:
  "Show my documents" -> company
  "Do I have any documents?" -> company
  "Can I access John's document?" -> company
  "Show available documents" -> company
  "Summarize my uploaded report" -> rag
  "What is the revenue in my report?" -> rag

- Never route document availability questions to rag.
SEARCH QUERY:
- For "rag", generate a concise standalone search query that
  preserves the subject, intent, relevant dates and metrics.
- Resolve references using conversation history.
- For "company" and "general", set search_query to null.

CONVERSATION HISTORY:
{history_text}

CURRENT USER QUESTION:
{question}

Return the most appropriate route and search_query.
"""

    try:
        structured_llm = supervisor_llm.with_structured_output(
            SupervisorDecision
        )

        response = await asyncio.wait_for(
            structured_llm.ainvoke(prompt),
            timeout=5,
        )

        provider = "gemini"

        print("SUPERVISOR PROVIDER: Gemini", flush=True)

    except Exception as error:
        print(
            f"Gemini Supervisor failed: {type(error).__name__}: {error}. "
            "Switching to Groq.",
            flush=True,
        )

        groq_response = await groq_llm.ainvoke(
            prompt + """

Return ONLY valid JSON in this exact format:
{
    "route": "general",
    "search_query": null
}

The route must be one of: company, rag, general.
Do not call tools. Do not include markdown.
"""
        )

        response = SupervisorDecision.model_validate(
            json.loads(groq_response.content)
        )

        provider = "groq"

        print("SUPERVISOR PROVIDER: Groq", flush=True)

    print("SUPERVISOR AGENT:", response.route, flush=True)
    print("SUPERVISOR SEARCH QUERY:", response.search_query, flush=True)

    return response, provider
