import { motion } from "motion/react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type {
  DocumentStatusReport,
  TaskStatusReport,
} from "../../api/reports";

interface StatusChartsProps {
  documentStatus: DocumentStatusReport;
  taskStatus: TaskStatusReport;
}

function StatusCard({
  title,
  subtitle,
  data,
  colors,
}: {
  title: string;
  subtitle: string;
  data: { name: string; value: number }[];
  colors: string[];
}) {
  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-lg font-extrabold text-slate-950">
        {title}
      </h2>

      <p className="mt-0.5 text-sm font-medium text-slate-500">
        {subtitle}
      </p>

      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-[230px] w-full sm:w-1/2">
          <ResponsiveContainer
  width="100%"
  height="100%"
  debounce={100}
>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={colors[index]}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow:
                    "0 10px 30px rgba(15,23,42,0.10)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-950">
              {total}
            </span>

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total
            </span>
          </div>
        </div>

        <div className="w-full space-y-3 sm:w-1/2">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      colors[index],
                  }}
                />

                <span className="text-sm font-bold text-slate-600">
                  {item.name}
                </span>
              </div>

              <span className="text-sm font-black text-slate-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default function StatusCharts({
  documentStatus,
  taskStatus,
}: StatusChartsProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <StatusCard
        title="Document status"
        subtitle="Current processing status of documents"
        data={[
          {
            name: "Uploaded",
            value: documentStatus.uploaded,
          },
          {
            name: "Processing",
            value: documentStatus.processing,
          },
          {
            name: "Completed",
            value: documentStatus.completed,
          },
          {
            name: "Failed",
            value: documentStatus.failed,
          },
        ]}
        colors={[
          "#94a3b8",
          "#f59e0b",
          "#10b981",
          "#ef4444",
        ]}
      />

      <StatusCard
        title="Task status"
        subtitle="Task progress during the selected period"
        data={[
          {
            name: "Pending",
            value: taskStatus.pending,
          },
          {
            name: "Submitted",
            value: taskStatus.submitted,
          },
        ]}
        colors={[
          "#f59e0b",
          "#3b82f6",
        ]}
      />
    </div>
  );
}