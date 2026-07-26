from pydantic import BaseModel


class DashboardSummary(BaseModel):
    company_name: str
    industry: str
    total_users: int
    admins: int
    managers: int
    employees: int


class EmployeeAnalytics(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    role_distribution: dict[str, int]
    department_distribution: dict[str, int]