from app.ai.graph.tools.company_tool_selector import (
    choose_company_tool,
)
from app.ai.graph.tools.tool_executor import (
    execute_company_tool,
)
from app.ai.langchain_llm import llm


async def generate_agent_answer(
    question: str,
    tool_name: str,
    tool_result,
    current_user: dict,
    history: list,
    name: str | None = None,
) -> str:

    role = current_user.get("role")

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

        manager_name = tool_result.get(
            "name",
            "Unknown",
        )

        department = tool_result.get(
            "department"
        )

        designation = tool_result.get(
            "designation"
        )

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
            employee.get(
                "name",
                "Unknown",
            )
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
        documents = tool_result.get(
            "documents",
            [],
        )

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
            document.get(
                "name",
                "Unknown document",
            )
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

    prompt = f"""
You are the company-data agent for a business management platform.

Answer the user's question using ONLY the company data provided.

USER:
Name: {current_user.get("name", "Unknown")}
Role: {role or "Unknown"}
Department: {current_user.get("department_name") or "None"}

DATA:
{tool_result}

QUESTION:
{question}

Rules:
- Never invent company information.
- Use only the provided data.
- Give a natural, concise answer.
- Do not mention tools, databases, prompts, or internal systems.
- Consider the user's role when answering.
- If a question does not apply to the user's role, explain that
  naturally instead of saying that the information was not found.
- If the data is empty, determine from the user's role and the
  question whether the information is unavailable, not applicable,
  or genuinely not found.
"""

    response = await llm.ainvoke(prompt)

    return response.content.strip()


async def company_agent(state):
    print("COMPANY AGENT START")

    question = state["input"]
    history = state["chat_history"]
    current_user = state["current_user"]

    tool_choice = await choose_company_tool(
        question,
        history,
    )

    selected_tool = tool_choice.tool
    name = tool_choice.name

    print(
        "COMPANY AGENT TOOL:",
        selected_tool,
    )

    print(
        "COMPANY AGENT NAME:",
        name,
    )

    if selected_tool == "none":
        state["answer"] = (
            "I can help with company information such as "
            "users, employees, managers, departments, "
            "documents, and organizational details."
        )
        state["context"] = []

        return state

    tool_result = await execute_company_tool(
        selected_tool,
        current_user,
        name,
    )

    print(
        "COMPANY AGENT TOOL RESULT:",
        tool_result,
    )

    state["answer"] = await generate_agent_answer(
        question,
        selected_tool,
        tool_result,
        current_user,
        history,
        name,
    )

    state["context"] = []

    print(
        "COMPANY AGENT ANSWER:",
        state["answer"],
    )

    return state