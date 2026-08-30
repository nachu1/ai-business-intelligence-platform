import api from "./api";

export interface ReportSummary {
  total_documents: number;
  completed_documents: number;
  processing_documents: number;
  failed_documents: number;
  total_tasks: number;
  pending_tasks: number;
  submitted_tasks: number;
  completion_rate: number;
}

export interface ReportPoint {
  date: string;
  count: number;
}

export interface TaskStatusReport {
  pending: number;
  submitted: number;
}

export interface DocumentStatusReport {
  uploaded: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface EmployeePerformance {
  employee_id: string;
  employee_name: string;
  assigned: number;
  submitted: number;
  completion_rate: number;
}

export interface ReportResponse {
  start_date: string;
  end_date: string;
  summary: ReportSummary;
  document_activity: ReportPoint[];
  task_activity: ReportPoint[];
  task_status: TaskStatusReport;
  document_status: DocumentStatusReport;
  employee_performance: EmployeePerformance[];
}

export async function getReport(
  startDate: string,
  endDate: string
): Promise<ReportResponse> {
  const response = await api.get<ReportResponse>("/reports", {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  });

  return response.data;
}