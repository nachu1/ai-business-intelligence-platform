from pydantic import BaseModel


class DashboardSummary(BaseModel):
    company_name: str
    industry: str
    total_users: int
    admins: int
    managers: int
    employees: int