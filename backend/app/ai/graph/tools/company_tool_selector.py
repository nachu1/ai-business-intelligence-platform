from typing import Literal

from pydantic import BaseModel

from app.ai.langchain_llm import llm


class CompanyToolChoice(BaseModel):
    tool: Literal[
        "get_my_profile",
        "get_my_documents",
        "get_available_documents",
        "get_my_manager",
        "get_manager_employees",
        "get_employee_count",
        "get_manager_count",
        "get_department_employees",
        "get_department_count",
        "get_user_by_name",
        "none",
    ]
    name: str | None = None


async def choose_company_tool(
    question: str,
    chat_history: list,
) -> CompanyToolChoice:

    prompt = f"""
You select the correct company-data tool.

Available tools:

get_my_profile:
Returns the currently logged-in user's name, role,
department, and designation.

get_my_documents:
Returns documents uploaded by the currently logged-in user.

get_available_documents:
Returns documents that the currently logged-in user is authorized
to access according to their role and department.

Admin:
Can access all company documents.

Manager:
Can access documents belonging to their department.

Employee:
Can access only their own uploaded documents.

Use this tool for questions about:
- What documents can I access?
- What documents are available to me?
- Can I see a document uploaded by someone else?
- Can I see documents uploaded by the admin?
- Which documents can I access?
- Who uploaded this document?
- What documents are available to me?

get_my_manager:
Returns the manager of the currently logged-in user's department.

get_manager_employees:
Returns active employees who report directly to the
currently logged-in manager.

Use this for questions such as:
"Who are my employees?"
"Who works under me?"
"Show my employees."
"Which employees report to me?"

Do not require a name when the user asks about their
own employees.

get_employee_count:
Returns the total number of active employees in the company.

get_manager_count:
Returns the total number of active managers in the company.

get_department_employees:
Returns active employees in the currently logged-in user's department.

get_department_count:
Returns the total number of active departments in the company.
Inactive/deleted departments must not be counted.

get_user_by_name:
Finds an active company user by name.
The user may be an admin, manager, or employee.
Returns their name, role, department, and designation.

none:
Use when none of the company tools can answer the question.

RULES:

1. Questions about the current user:
   "Who am I?"
   "What is my name?"
   "What is my role?"
   "What is my department?"
   → get_my_profile

2. Questions about documents uploaded by the current user:
   → get_my_documents

3. Questions asking who the current user's manager is:
   → get_my_manager

4. Questions asking about employees who report to a specific manager:
   "Does John have any employees?"
   "Who are John's employees?"
   "Who works under John?"
   "Who reports to John?"
   "How many employees does John have?"
   → get_manager_employees

   Extract the manager's name into the "name" field.

5. Questions asking for the total number of active employees:
   → get_employee_count

6. Questions asking for the total number of active managers:
   → get_manager_count

7. Questions asking about employees in the current user's department:
   → get_department_employees


8. Questions about document availability or access permissions:
   → get_available_documents

   This includes questions such as:
   "Can I see the document uploaded by the admin?"
   "What documents can I access?"
   "Which documents are available to me?"
   "Can I access John's document?"

   Do NOT use get_my_documents for these questions.
   get_my_documents is only for listing documents uploaded
   by the current user.

9. Questions asking how many departments the company has:
   → get_department_count

   Examples:
   "How many departments do I have?"
   "How many departments are there?"
   "How many departments does the company have?"
   "How many active departments are there?"
   → get_department_count

10. Questions asking about a specific person by name:
   "Who is John?"
   "Is John a user?"
   "Does John work here?"
   "Tell me about John."
   "Any user named John?"
   "Is there anyone named John?"
   → get_user_by_name

   The person may be an admin, manager, or employee.

   Extract only the person's name into the "name" field.

11. If the user refers to a person from the conversation history:
   "What about him?"
   "Does he work here?"
   "Is that person an employee?"

   Use the relevant person's name from the conversation
   history and select get_user_by_name when appropriate.

12. Do NOT use company tools for questions requiring uploaded
    document content. Those questions belong to RAG.

13. Do not invent company information.

14. If no company tool can answer the question, use "none".

15. The "name" field must be provided only when the selected
    tool is get_user_by_name. Otherwise return null.

CONVERSATION HISTORY:
{chat_history}

CURRENT QUESTION:
{question}

Return the appropriate tool and, when required, the person's name.
"""

    structured_llm = llm.with_structured_output(
        CompanyToolChoice
    )

    return await structured_llm.ainvoke(prompt)