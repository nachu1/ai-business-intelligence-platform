from typing import Literal

from pydantic import BaseModel

from app.ai.langchain_llm import llm


class SupervisorDecision(BaseModel):
    route: Literal[
        "company",
        "rag",
        "general",
    ]


async def supervisor_agent(
    question: str,
    chat_history: list,
) -> str:

    prompt = f"""
You are the supervisor agent for a business management AI platform.

Your job is to decide which specialized agent should handle
the user's current question.

Available agents:

company:
Handles company-specific information such as:
- users
- employees
- managers
- departments
- roles
- designations
- permissions
- access
- the current user's profile
- company organizational information
- company documents as objects or access-controlled resources

rag:
Handles information contained inside uploaded documents.
Examples:
- sales reports
- resumes
- PDFs
- financial reports
- project reports
- document summaries
- facts contained in documents
- comparisons or analysis based on document content

general:
Handles general knowledge and tasks that do not require
company data or uploaded document content.
Examples:
- writing
- rewriting
- translation
- programming explanations
- brainstorming
- general questions

IMPORTANT ROUTING RULES:

1. If the current question requires company-specific data,
   choose "company".

2. If the current question requires information from
   uploaded document content, choose "rag".

3. If the current question is general and does not require
   company data or document content, choose "general".

4. Questions about document permissions, document access,
   who uploaded a document, or whether a document exists
   belong to "company".

5. Do not choose "rag" simply because the question contains
   the word "document".

6. IMPORTANT:
   Use the conversation history to understand follow-up
   questions.

   For example:

   User: Who is John?
   → company

   User: Does he work here?
   → company

   User: What department is he in?
   → company

   User: What does his resume say about his experience?
   → rag

7. If a follow-up question uses words such as:
   "he", "she", "they", "him", "her", "that person",
   "that employee", "this document", or "it",
   use the conversation history to understand what
   the user is referring to before choosing the route.

8. Preserve the route of the previous topic when the
   follow-up clearly continues that topic.

CONVERSATION HISTORY:
{chat_history}

CURRENT USER QUESTION:
{question}

Return ONLY the appropriate agent.
"""

    structured_llm = llm.with_structured_output(
        SupervisorDecision
    )

    response = await structured_llm.ainvoke(prompt)

    print(
        "SUPERVISOR AGENT:",
        response.route,
    )

    return response.route