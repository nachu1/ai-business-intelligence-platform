import api from "./api";

export interface DashboardSummary {
  company_name: string;
  industry: string;
  total_users: number;
  admins: number;
  managers: number;
  employees: number;
  departments: number;
  documents: number;
  documents_today: number;
  documents_processing: number;
  documents_failed: number;
}

export interface EmployeeAnalytics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  role_distribution: Record<string, number>;
  department_distribution: Record<string, number>;
}

export interface DashboardActivity {
  document: string;
  uploaded_by: string;
  department: string;
  status: string;
  created_at: string;
}

export interface DashboardData {
  role: string;
  summary: DashboardSummary | null;
  employee_analytics: EmployeeAnalytics | null;
  activities: DashboardActivity[];
  insights: DashboardInsight[];
  manager: {
    name: string;
    department: string;
    designation: string;
  } | null;
  department: {
    name: string;
  } | null;
  my_documents: number;
}

export async function getDashboard(): Promise<DashboardData> {
  const response = await api.get<DashboardData>("/dashboard/");
  return response.data;
}

export interface DashboardInsight {
  title: string;
  description: string;
  category: string;
  document_id: string;
}