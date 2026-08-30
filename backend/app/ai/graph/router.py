from app.ai.graph.state import GraphState
from app.ai.langchain_llm import llm
from app.ai.graph.schema import Route


def router_node(state: GraphState):

    prompt = f"""
You are an AI router for a business management platform.

Choose ONLY ONE route:

- company
- rag
- general

==================================================
COMPANY ROUTE
==================================================

Return "company" when the question is about the user's
company, organization, users, roles, departments, managers,
employees, permissions, access, or the user's own profile.

This includes questions about:

- who am I
- what is my name
- what is my role
- what is my department
- what is my designation
- who is my manager
- who is John's manager
- how many managers are there
- how many employees are there
- who works in a department
- who are the employees of a manager
- which department does someone belong to
- can I access something
- can I see something
- am I allowed to see something
- what information can I access
- can employees see manager documents
- can I see documents uploaded by admin
- can I see John's documents
- what documents can I access

Examples:

"Who am I?"
→ company

"What is my department?"
→ company

"Who is my manager?"
→ company

"How many employees are in my company?"
→ company

"Can I see documents uploaded by admin?"
→ company

"Can employees access manager documents?"
→ company

==================================================
RAG ROUTE
==================================================

Return "rag" when the user is asking about the CONTENT,
FACTS, INFORMATION, PROJECTS, DETAILS, or MEANING contained
inside an uploaded document.

This includes questions about:

- a resume or CV
- sales reports
- financial reports
- hospital reports
- project reports
- uploaded PDFs
- information contained in documents
- summaries or analysis of documents
- facts mentioned in documents

Examples:

"What is the total revenue?"
→ rag

"Summarize the sales report."
→ rag

"Which product had the lowest stock?"
→ rag

"Compare March and April revenue."
→ rag

"What does the sales report say?"
→ rag

"What projects are mentioned in my resume?"
→ rag

"What skills are listed in my resume?"
→ rag

"Where did I work according to my resume?"
→ rag

"When did I graduate according to my resume?"
→ rag

"What technologies are mentioned in my CV?"
→ rag

"Tell me about the projects in my uploaded resume."
→ rag

IMPORTANT:
If the user asks for INFORMATION FROM THE CONTENT of a
document, choose "rag", even if the document belongs to
the current user.

If the question is about the document itself as an object,
such as whether it exists, who uploaded it, its status,
or what documents the user can access, choose "company".

==================================================
GENERAL ROUTE
==================================================

Return "general" when the user is asking for general
knowledge or asking the AI to create, write, rewrite,
translate, brainstorm, or explain something that does not
require company information or uploaded documents.

Examples:

"Write an email."
→ general

"Write a cover letter."
→ general

"Translate this sentence."
→ general

"Explain Python decorators."
→ general

"Write a meeting agenda."
→ general

==================================================
IMPORTANT
==================================================

If a question is about company access or permissions,
choose "company", even if the question mentions documents.

For example:

"Can I see documents uploaded by admin?"
→ company

Do NOT choose rag just because the word "document" appears.

Return ONLY one of:

company
rag
general

User question:
{state["input"]}
"""

    structured_llm = llm.with_structured_output(Route)

    response = structured_llm.invoke(prompt)

    print("Route:", response.route)

    state["route"] = response.route

    return state