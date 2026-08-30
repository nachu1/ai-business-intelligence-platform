import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import { useUser } from "../../context/UserContext";
import {
  getReport,
  type ReportResponse,
} from "../../api/reports";

import ReportHeader from "../../components/reports/ReportHeader";
import AdminReports from "./AdminReports";
import ManagerReports from "./ManagerReports";

export default function ReportsPage() {
  const { user } = useUser();

  const today =
    new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(
    `${new Date().getFullYear()}-01-01`
  );

  const [endDate, setEndDate] =
    useState(today);

  const [report, setReport] =
    useState<ReportResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const generateReport = async () => {
    if (!startDate || !endDate) return;

    if (startDate > endDate) {
      setError(
        "Start date cannot be after the end date."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getReport(
        startDate,
        endDate
      );

      setReport(data);
    } catch (error) {
      console.error(
        "Failed to load report:",
        error
      );

      setError(
        "Unable to load the report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const downloadReport = () => {
    if (!report) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BizInsight Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);

    doc.text(
      `Period: ${report.start_date} to ${report.end_date}`,
      14,
      28
    );

    doc.setTextColor(0);

    autoTable(doc, {
      startY: 38,
      head: [["Metric", "Value"]],
      body: [
        [
          "Total Documents",
          String(
            report.summary.total_documents
          ),
        ],
        [
          "Completed Documents",
          String(
            report.summary.completed_documents
          ),
        ],
        [
          "Processing Documents",
          String(
            report.summary.processing_documents
          ),
        ],
        [
          "Failed Documents",
          String(
            report.summary.failed_documents
          ),
        ],
        [
          "Total Tasks",
          String(
            report.summary.total_tasks
          ),
        ],
        [
          "Pending Tasks",
          String(
            report.summary.pending_tasks
          ),
        ],
        [
          "Submitted Tasks",
          String(
            report.summary.submitted_tasks
          ),
        ],
        [
          "Completion Rate",
          `${report.summary.completion_rate}%`,
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
      },
      styles: {
        fontSize: 10,
      },
    });

    autoTable(doc, {
      startY:
        (doc as any).lastAutoTable.finalY + 12,
      head: [
        [
          "Employee",
          "Assigned",
          "Submitted",
          "Pending",
          "Completion",
        ],
      ],
      body: report.employee_performance.map(
        (employee) => [
          employee.employee_name,
          String(employee.assigned),
          String(employee.submitted),
          String(
            Math.max(
              employee.assigned -
                employee.submitted,
              0
            )
          ),
          `${employee.completion_rate}%`,
        ]
      ),
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
      },
      styles: {
        fontSize: 9,
      },
    });

    doc.save(
      `report-${report.start_date}-to-${report.end_date}.pdf`
    );
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f3f7fb]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-indigo-300/15 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <ReportHeader
          title={
            user?.role === "admin"
              ? "Organization Reports"
              : "Department Reports"
          }
          subtitle="Analyze document activity and task performance for the selected period."
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onGenerate={generateReport}
          onDownload={downloadReport}
          loading={loading}
          hasReport={!!report}
        />

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <AlertCircle className="h-5 w-5" />

            <span>{error}</span>

            <button
              type="button"
              onClick={generateReport}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </motion.div>
        )}

        {report &&
          (user?.role === "admin" ? (
            <AdminReports report={report} />
          ) : (
            <ManagerReports report={report} />
          ))}
      </div>
    </div>
  );
}