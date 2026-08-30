from app.ai.graph.tools.company_tools import (
    get_my_profile,
    get_my_documents,
    get_available_documents,
    get_my_manager,
    get_manager_employees,
    get_employee_count,
    get_manager_count,
    get_department_employees,
    get_department_count,
    get_user_by_name,
)


async def execute_company_tool(
    tool_name: str,
    current_user: dict,
    name: str | None = None,
):
    if tool_name == "get_my_profile":
        return await get_my_profile(
            current_user
        )

    if tool_name == "get_my_documents":
        return await get_my_documents(
            current_user
        )

    if tool_name == "get_available_documents":
        return await get_available_documents(
            current_user
        )

    if tool_name == "get_my_manager":
        return await get_my_manager(
            current_user
        )

    if tool_name == "get_manager_employees":
        return await get_manager_employees(
           current_user
        )

    

    if tool_name == "get_employee_count":
        return await get_employee_count(
            current_user
        )

    if tool_name == "get_manager_count":
        return await get_manager_count(
            current_user
        )

    if tool_name == "get_department_employees":
        return await get_department_employees(
            current_user
        )

    if tool_name == "get_department_count":
        return await get_department_count(
            current_user
        )

    if tool_name == "get_user_by_name":
        if not name:
            return []

        return await get_user_by_name(
            current_user,
            name,
        )

    raise ValueError(
        f"Unknown company tool: {tool_name}"
    )