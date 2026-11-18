
import json
from typing import Literal

from pydantic import BaseModel

from app.ai.langchain_llm import company_tool_llm, groq_llm


class CompanyToolChoice(BaseModel):
    tool: Literal[
        "get_my_profile",
        "get_my_documents",
        "get_available_documents",
        "get_my_manager",
        "get_manager_employees",
        "get_company_reporting_structure",
        "get_employee_count",
        "get_manager_count",
        "get_department_employees",
        "get_department_count",
        "get_user_by_name",
        "get_employee_manager",
        "get_all_company_employees",
        "none",
    ]
    name: str | None = None


async def choose_company_tool(
    question: str,
    chat_history: list,
    current_user: dict,
    provider: str = "gemini",
) -> CompanyToolChoice:

    recent_history = chat_history[-6:]
    role = current_user.get("role", "Unknown")

    history_text = "\n".join(
        f"{message.type}: {message.content}"
        for message in recent_history
    )

    prompt = f"""
Select the correct company-data tool for the user's question.

TOOLS:

get_my_profile
- Current user's name, role, department, designation.

get_my_documents
- Documents uploaded by the current user only.

get_available_documents
- Documents the current user is authorized to access.
- Admin: all company documents.
- Manager: documents in their department.
- Employee: their own uploaded documents.
- Use for document access/availability questions, including
  whether the user can access another person's or admin's document.
- Do not use for document content questions.

get_my_manager
- Current user's department manager.

get_manager_employees
- Returns active employees reporting directly to the current user,
  provided the current user is a manager.
- Does NOT support searching employees under another named manager.
- Do not pass a manager name to this tool.

get_company_reporting_structure
- Returns active managers and active employees assigned to those managers.
- Intended for administrators asking about company reporting relationships.
- Does NOT guarantee a complete list of all active company employees.
- Do not use this tool as a general employee directory.

get_employee_count
- Total active employees in the company.

get_manager_count
- Total active managers in the company.

get_department_employees
- Active employees in the current user's department.

get_department_count
- Total active departments.
- Count only active departments.

get_employee_manager
- Retrieves the manager of a specific employee.
- Admin can query any active employee in the company.
- Manager and employee access must follow their permitted scope.
- Requires the employee's name.
- Use for questions such as:
  "Who is Rizwan's manager?"
  "Does Rizwan have a manager?"
  "What is his manager's name?"

get_all_company_employees
- Returns all active employees in the current company.
- Admin only.
- Includes employee names, departments and designations.
- Use for company-wide employee listing questions.
- Examples:
  "Who are the employees?"
  "List all employees."
  "Who works in the company?"

get_user_by_name
- Finds an active company user by name.
- Returns name, role, department, and designation.
- Use for questions about a specific person, such as:
  "Who is John?", "Does John work here?", "Is John a user?"
- Put only that person's name in the name field.

none
- Use when no company tool can answer the question.

RULES:

1. Current user information
   → get_my_profile

2. Documents uploaded by the current user
   → get_my_documents

3. Current user's manager
   → get_my_manager

4. Employees reporting to a manager
   → get_manager_employees

5. Total active employees
   → get_employee_count

6. Total active managers
   → get_manager_count

7. Employees in the current user's department
   → get_department_employees

8. Document availability or access permissions
   → get_available_documents
   Never use get_my_documents for access-permission questions.

9. Number of active departments
   → get_department_count

10. Specific person by name
    → get_user_by_name

11. Follow-up references to a person such as "he", "him",
    "that person", or "she" must use the relevant person's
    name from the conversation history and select get_user_by_name
    when appropriate.

12. Questions requiring uploaded document content must NOT use
    company tools. They belong to RAG.

13. Never invent company information.

14. If no company tool applies
    → none

15. The name field is normally null.
    Provide a name when required for get_user_by_name or
    get_manager_employees.

16. Role-specific reporting questions:
    - Manager + "Who reports to me?" → get_manager_employees
    - Admin + "Who reports to me?" → get_company_reporting_structure

17. Employee listing vs employee count:
    - Asking for employee names or details is not a count request.
    - "How many employees?" → get_employee_count.
    - Do not use get_company_reporting_structure as a
      complete employee directory.

18. Role-based employee listing:
    - Manager asking for direct reports → get_manager_employees.
    - Manager or employee asking for employees in their
      own department → get_department_employees.
    - Admin asking for reporting relationships →
      get_company_reporting_structure.
    - If no available tool can provide the complete
      requested employee list, select none.

19. Follow-up questions:
    - "Tell me their names", "Who are they?", "What about their
      departments?" and similar follow-ups must be interpreted
      using the conversation history.
    - If the previous question requested an employee list, preserve
      the same employee-listing intent.
    - Do not select get_employee_count when the user asks for names.
    - Do not select get_user_by_name unless a specific person's
      name is known.

20. Never select a tool that cannot provide the requested information.
    Respect the current user's role and existing access restrictions.

21. Employee manager lookup:
    - Admin asking about any employee's manager
      → get_employee_manager.
    - Resolve pronouns using conversation history.
    - Pass the resolved employee name in the name field.

22. Company-wide employee listing:
    - Admin asking for employee names or details
      → get_all_company_employees.
    - Do not use get_company_reporting_structure for general
      employee listing questions.
    - Use get_company_reporting_structure only for
      reporting relationships and hierarchy.

CURRENT USER ROLE:
{role}

CONVERSATION HISTORY:
{history_text}

CURRENT QUESTION:
{question}

Return only the appropriate structured tool choice.
"""

    if provider == "groq":

        groq_json_llm = groq_llm.bind(
            response_format={"type": "json_object"}
        )

        groq_prompt = prompt + """

Return ONLY valid JSON in this format:
{
    "tool": "none",
    "name": null
}

The tool must be one of the tools listed in the prompt.
Do not call tools. Do not include markdown.
"""

        response = await groq_json_llm.ainvoke(groq_prompt)

        return CompanyToolChoice.model_validate(
            json.loads(response.content)
        )

    structured_llm = company_tool_llm.with_structured_output(
        CompanyToolChoice
    )

    return await structured_llm.ainvoke(prompt)
