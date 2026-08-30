from pydantic import BaseModel


class DashboardSummary(BaseModel):
    company_name: str
    industry: str
    total_users: int
    admins: int
    managers: int
    employees: int
    departments: int
    documents: int
    documents_today: int
    documents_processing: int
    documents_failed: int


class EmployeeAnalytics(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    role_distribution: dict[str, int]
    department_distribution: dict[str, int]


class DashboardActivity(BaseModel):
    document: str
    uploaded_by: str
    department: str
    status: str
    created_at: str


class DashboardInsight(BaseModel):
    title: str
    description: str
    category: str
    document_id: str


class DashboardData(BaseModel):
    role: str
    summary: DashboardSummary | None = None
    employee_analytics: EmployeeAnalytics | None = None
    activities: list[DashboardActivity] = []
    insights: list[DashboardInsight] = []
    manager: dict | None = None
    department: dict | None = None
    my_documents: int = 0