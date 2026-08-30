from pydantic import BaseModel


class ReportSummary(BaseModel):
    total_documents: int = 0
    completed_documents: int = 0
    processing_documents: int = 0
    failed_documents: int = 0

    total_tasks: int = 0
    pending_tasks: int = 0
    submitted_tasks: int = 0
    approved_tasks: int = 0
    rejected_tasks: int = 0

    completion_rate: float = 0


class ReportPoint(BaseModel):
    date: str
    count: int


class TaskStatusReport(BaseModel):
    pending: int = 0
    submitted: int = 0
    


class DocumentStatusReport(BaseModel):
    uploaded: int = 0
    processing: int = 0
    completed: int = 0
    failed: int = 0


class EmployeePerformance(BaseModel):
    employee_id: str
    employee_name: str
    assigned: int = 0
    submitted: int = 0
    pending: int =0
    completion_rate: float = 0


class ReportResponse(BaseModel):
    start_date: str
    end_date: str
    summary: ReportSummary
    document_activity: list[ReportPoint]
    task_activity: list[ReportPoint]
    task_status: TaskStatusReport
    document_status: DocumentStatusReport
    employee_performance: list[EmployeePerformance]