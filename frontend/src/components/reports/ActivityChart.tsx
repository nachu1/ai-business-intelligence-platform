import { motion } from "motion/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FileText,
  ListTodo,
} from "lucide-react";

import type { ReportPoint } from "../../api/reports";

interface ActivityChartProps {
  documentActivity: ReportPoint[];
  taskActivity: ReportPoint[];
  startDate: string;
  endDate: string;
}

function buildDateSeries(
  startDate: string,
  endDate: string,
  points: ReportPoint[]
) {
  const counts = new Map(
    points.map((point) => [
      point.date,
      point.count,
    ])
  );

  const result = [];
  const current = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  while (current <= end) {
    const date = formatLocalDate(current);

    result.push({
      date,
      shortDate: current.toLocaleDateString(
        undefined,
        {
          day: "numeric",
          month: "short",
        }
      ),
      count: counts.get(date) ?? 0,
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}

function parseLocalDate(value: string) {
  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function ActivityCard({
  title,
  subtitle,
  data,
  icon: Icon,
  lineColor,
}: {
  title: string;
  subtitle: string;
  data: {
    date: string;
    shortDate: string;
    count: number;
  }[];
  icon: typeof FileText;
  lineColor: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-slate-950">
            {title}
          </h2>

          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 h-[280px] w-full">
        <ResponsiveContainer
  width="100%"
  height="100%"
  debounce={100}
>
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 5,
            }}
          >
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="shortDate"
              tick={{
                fontSize: 10,
                fill: "#64748b",
              }}
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 11,
                fill: "#64748b",
              }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.date ?? ""
              }
              formatter={(value) => [
                value,
                title === "Document activity"
                  ? "Documents"
                  : "Tasks",
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow:
                  "0 10px 30px rgba(15,23,42,0.10)",
              }}
            />

            <Line
              type="monotone"
              dataKey="count"
              stroke={lineColor}
              strokeWidth={3}
              dot={{
                r: 3,
                fill: lineColor,
              }}
              activeDot={{
                r: 6,
                fill: lineColor,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

export default function ActivityChart({
  documentActivity,
  taskActivity,
  startDate,
  endDate,
}: ActivityChartProps) {
  const documents = buildDateSeries(
    startDate,
    endDate,
    documentActivity
  );

  const tasks = buildDateSeries(
    startDate,
    endDate,
    taskActivity
  );

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ActivityCard
        title="Document activity"
        subtitle="Documents uploaded during the selected period"
        data={documents}
        icon={FileText}
        lineColor="#0891b2"
      />

      <ActivityCard
        title="Task activity"
        subtitle="Tasks assigned during the selected period"
        data={tasks}
        icon={ListTodo}
        lineColor="#7c3aed"
      />
    </div>
  );
}