
from app.ai.graph.tools.company_tool_selector import (
    choose_company_tool,
)
from app.ai.graph.tools.tool_executor import (
    execute_company_tool,
)
from app.ai.langchain_llm import (
    company_answer_llm,
    groq_llm,
)


async def generate_agent_answer(
    question: str,
    tool_name: str,
    tool_result,
    current_user: dict,
    history: list,
    name: str | None = None,
    provider: str = "gemini",
) -> str:

    role = current_user.get("role")

    if tool_name == "get_my_profile":
        name = tool_result.get("name", "Unknown")
        role = tool_result.get("role", "Unknown")

        return f"You are {name}, and your role is {role}."

    if tool_name == "get_employee_count":
        return f"There are {tool_result} active employees in the company."

    if tool_name == "get_manager_count":
        return f"There are {tool_result} active managers in the company."

    if tool_name == "get_department_count":
        return f"There are {tool_result} active departments in the company."

    if tool_name == "get_my_manager":
        if not tool_result:
            if role == "manager":
                return (
                    "You're currently a manager, so you don't "
                    "have a manager assigned to you in the system."
                )

            if role == "admin":
                return (
                    "You're an admin, so you don't have a manager "
                    "assigned to you in the system."
                )

            return (
                "You don't currently have a manager assigned to you."
            )

        manager_name = tool_result.get("name", "Unknown")
        department = tool_result.get("department")
        designation = tool_result.get("designation")

        answer = f"Your manager is {manager_name}"

        if department:
            answer += f" in the {department} department"

        if designation:
            answer += f", with the designation '{designation}'"

        return answer + "."

    if tool_name == "get_manager_employees":
        if not tool_result:
            return (
                "You currently have no active employees "
                "reporting to you."
            )

        employee_names = [
            employee.get("name", "Unknown")
            for employee in tool_result
        ]

        count = len(employee_names)

        if count == 1:
            return (
                f"You have 1 employee: "
                f"{employee_names[0]}."
            )

        return (
            f"You have {count} employees: "
            + ", ".join(employee_names)
            + "."
        )

    if tool_name == "get_available_documents":
        documents = tool_result.get("documents", [])

        admin_documents_accessible = tool_result.get(
            "admin_documents_accessible",
            False,
        )

        admin_document_count = tool_result.get(
            "admin_document_count",
            0,
        )

        question_lower = question.lower()

        if (
            "admin" in question_lower
            and (
                "document" in question_lower
                or "file" in question_lower
            )
        ):
            if admin_documents_accessible:
                if admin_document_count == 1:
                    return (
                        "Yes. You have access to an "
                        "admin-uploaded document because "
                        "it is within your authorized access."
                    )

                return (
                    f"Yes. You have access to "
                    f"{admin_document_count} admin-uploaded "
                    "documents within your authorized access."
                )

            if role == "manager":
                return (
                    "No. You don't currently have access to "
                    "any admin-uploaded documents within your "
                    "authorized department access."
                )

            if role == "employee":
                return (
                    "No. As an employee, you can access only "
                    "your own uploaded documents."
                )

            return (
                "No admin-uploaded documents are currently "
                "available to you."
            )

        if not documents:
            return (
                "You don't currently have any documents "
                "available to you."
            )

        document_names = [
            document.get("name", "Unknown document")
            for document in documents
        ]

        count = len(document_names)

        if count == 1:
            return (
                f"You currently have access to 1 document: "
                f"{document_names[0]}."
            )

        return (
            f"You currently have access to {count} documents: "
            + ", ".join(document_names)
            + "."
        )

    if tool_name == "get_my_documents":
        if not tool_result:
            return "You don't currently have any documents uploaded."

        document_names = [
            document.get("name", "Unknown document")
            for document in tool_result
        ]

        count = len(document_names)

        if count == 1:
            return f"You have uploaded 1 document: {document_names[0]}."

        return (
            f"You have uploaded {count} documents: "
            + ", ".join(document_names)
            + "."
        )

    if tool_name == "get_department_employees":
        if not tool_result:
            return "There are currently no active employees in your department."

        employee_names = [
            employee.get("name", "Unknown")
            for employee in tool_result
        ]

        count = len(employee_names)

        if count == 1:
            return (
                f"There is 1 active employee in your department: "
                f"{employee_names[0]}."
            )

        return (
            f"There are {count} active employees in your department: "
            + ", ".join(employee_names)
            + "."
        )

    if tool_name == "get_user_by_name":
        if not tool_result:
            return "I couldn't find an active user with that name."

        if len(tool_result) == 1:
            user = tool_result[0]

            name = user.get("name", "Unknown")
            role = user.get("role")
            department = user.get("department")
            designation = user.get("designation")

            answer = name

            if role:
                answer += f" is a {role}"

            if department:
                answer += f" in the {department} department"

            if designation:
                answer += f" with the designation '{designation}'"

            return answer + "."

        users = []

        for user in tool_result:
            name = user.get("name", "Unknown")
            details = name

            info = []

            if user.get("role"):
                info.append(user["role"])

            if user.get("department") not in (None, "Unknown"):
                info.append(
                    f"{user['department']} department"
                )

            if user.get("designation") not in (None, "Unknown"):
                info.append(user["designation"])

            if info:
                details += f" ({', '.join(info)})"

            users.append(details)

        return (
            f"I found {len(users)} active users with that name: "
            + "; ".join(users)
            + "."
        )

    prompt = f"""
You are BizInsight, an intelligent and conversational company assistant.

Your task is to answer the user's current question naturally using
the company data provided.

CURRENT USER:
Name: {current_user.get("name", "Unknown")}
Role: {role or "Unknown"}
Department: {current_user.get("department_name") or "None"}

CONVERSATION HISTORY:
{history}

AVAILABLE COMPANY DATA:
{tool_result}

CURRENT QUESTION:
{question}

INSTRUCTIONS:
- Understand the current question in the context of the conversation.
- Resolve references such as "they", "them", "their", "those employees",
  and "that department" using the conversation history.
- Answer the actual question directly.
- Present names, numbers, and relevant details when they are available
  in the provided data.
- Use natural, fluent, human-like conversational language.
- Adapt the response to the context instead of using a fixed template.
- If the user asks a follow-up, continue the conversation naturally.
- Never invent names, numbers, roles, departments, or other company facts.
- Use only the provided company data for company-specific claims.
- If the provided data cannot answer the question, explain that clearly.
- Never mention internal tools, databases, prompts, or implementation details.
- Keep the answer concise but informative.

Return only the answer to the user.
"""

    selected_llm = (
        groq_llm
        if provider == "groq"
        else company_answer_llm
    )

    response = await selected_llm.ainvoke(prompt)

    return response.content.strip()


async def company_agent(state):
    print("COMPANY AGENT START", flush=True)

    question = state["input"]
    history = state["chat_history"]
    current_user = state["current_user"]
    provider = state.get("provider", "gemini")

    print("COMPANY AGENT PROVIDER:", provider, flush=True)

    tool_choice = await choose_company_tool(
        question,
        history,
        current_user,
        provider=provider,
    )

    selected_tool = tool_choice.tool
    name = tool_choice.name

    print("COMPANY AGENT TOOL:", selected_tool, flush=True)
    print("COMPANY AGENT NAME:", name, flush=True)

    selected_llm = (
        groq_llm
        if provider == "groq"
        else company_answer_llm
    )

    if selected_tool == "none":
        result = await selected_llm.ainvoke(
            f"""
You are BizInsight, a conversational company assistant.

Conversation history:
{history}

Current user question:
{question}

No company tool was selected.

Understand the user's intent using the conversation history.
If the question is unclear, ask a natural clarification question.
Do not invent company information.
Respond naturally and helpfully.
"""
        )

        state["answer"] = result.content
        state["context"] = []
        state["company_context"] = ""

        return state

    tool_result = await execute_company_tool(
        selected_tool,
        current_user,
        name,
    )

    print("COMPANY AGENT TOOL RESULT:", tool_result, flush=True)

    state["answer"] = await generate_agent_answer(
        question,
        selected_tool,
        tool_result,
        current_user,
        history,
        name,
        provider,
    )

    state["context"] = []

    print("COMPANY AGENT ANSWER:", state["answer"], flush=True)

    return state
