import type { ReportResponse } from "../../api/reports";

import ReportMetrics from "../../components/reports/ReportMetrics";
import ActivityChart from "../../components/reports/ActivityChart";
import StatusCharts from "../../components/reports/StatusCharts";
import EmployeePerformance from "../../components/reports/EmployeePerformance";

interface AdminReportProps {
  report: ReportResponse;
}

export default function AdminReports({
  report,
}: AdminReportProps) {
  return (
    <div className="space-y-5">
      <ReportMetrics
        report={report}
      />
 
       <ActivityChart
        documentActivity={report.document_activity}
        taskActivity={report.task_activity}
        startDate={report.start_date}
        endDate={report.end_date}
      />

    <StatusCharts
        documentStatus={report.document_status}
        taskStatus={report.task_status}
      />
      

      <EmployeePerformance
        employees={report.employee_performance}
      />
    </div>
  );
}