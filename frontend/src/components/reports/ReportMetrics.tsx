import { motion } from "motion/react";
import {
  FileCheck2,
  FileText,
  ListTodo,
  Send,
} from "lucide-react";

import type { ReportResponse } from "../../api/reports";

export default function ReportMetrics({
  report,
}: {
  report: ReportResponse;
}) {
  const metrics = [
    {
      label: "Documents",
      value: report.summary.total_documents,
      text: `${report.summary.completed_documents} completed`,
      icon: FileText,
      gradient: "from-cyan-500 to-blue-600",
      background: "from-cyan-50 to-blue-50",
    },
    {
      label: "Completed",
      value: report.summary.completed_documents,
      text: "Documents completed",
      icon: FileCheck2,
      gradient: "from-emerald-500 to-teal-600",
      background: "from-emerald-50 to-teal-50",
    },
    {
      label: "Tasks",
      value: report.summary.total_tasks,
      text: `${report.summary.pending_tasks} pending`,
      icon: ListTodo,
      gradient: "from-violet-500 to-indigo-600",
      background: "from-violet-50 to-indigo-50",
    },
    {
      label: "Submitted",
      value: report.summary.submitted_tasks,
      text: `${report.summary.completion_rate}% completion`,
      icon: Send,
      gradient: "from-blue-500 to-indigo-600",
      background: "from-blue-50 to-indigo-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ y: -4 }}
            className={`relative overflow-hidden rounded-2xl border border-white bg-gradient-to-br ${metric.background} p-5 shadow-sm`}
          >
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  {metric.label}
                </p>

                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {metric.value}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {metric.text}
                </p>
              </div>

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${metric.gradient} text-white shadow-lg`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}