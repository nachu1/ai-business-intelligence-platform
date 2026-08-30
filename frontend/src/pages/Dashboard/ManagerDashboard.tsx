import { motion } from "motion/react";
import {
  Activity,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Users,
} from "lucide-react";

import type { DashboardData } from "../../api/dashboard";

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease,
    },
  },
};

interface Props {
  data: DashboardData;
}

function ManagerDashboard({ data }: Props) {
  const summary = data.summary;
  const analytics = data.employee_analytics;

  const employeeCount =
    summary?.employees ??
    analytics?.role_distribution?.employee ??
    0;

  const documentCount = summary?.documents ?? 0;

  const completedDocuments = Math.max(
    documentCount -
      (summary?.documents_processing ?? 0) -
      (summary?.documents_failed ?? 0),
    0
  );

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f5f8fc]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />

      <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-violet-200/15 blur-3xl" />

      <div className="relative p-4 sm:p-6 lg:p-8">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <LiveBadge />

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-[42px]">
              Team overview
            </h1>

            <p className="mt-2 text-base text-slate-500 sm:text-lg">
              Real-time insights for your department.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 shadow-sm">
            <motion.span
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.9, 1.15, 0.9],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
              }}
              className="h-2.5 w-2.5 rounded-full bg-emerald-500"
            />

            <span className="text-xs font-semibold text-slate-600">
              Updated just now
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 xl:grid-cols-4"
        >
          <StatCard
            label="Team members"
            value={employeeCount}
            description="Employees in your department"
            icon={Users}
            gradient="from-cyan-500 to-blue-500"
          />

          <StatCard
            label="Documents"
            value={documentCount}
            description="Department documents"
            icon={FileText}
            gradient="from-violet-500 to-purple-500"
          />

          <StatCard
            label="Completed"
            value={completedDocuments}
            description="Processed documents"
            icon={CheckCircle2}
            gradient="from-emerald-500 to-teal-500"
          />

          <StatCard
            label="Processing"
            value={summary?.documents_processing ?? 0}
            description="Documents being processed"
            icon={Clock3}
            gradient="from-orange-500 to-amber-500"
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]"
        >
          <Panel
            title="My department"
            subtitle="Your current team information"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard
                icon={BriefcaseBusiness}
                label="Department"
                value={
                  data.department?.name ||
                  "Unknown department"
                }
              />

              <InfoCard
                icon={Users}
                label="Employees"
                value={employeeCount}
              />

              <InfoCard
                icon={Activity}
                label="Team activity"
                value={`${data.activities.length} recent`}
              />
            </div>
          </Panel>

          <Panel
            title="Document status"
            subtitle="Department document health"
          >
            <DocumentHealth
              completed={completedDocuments}
              processing={
                summary?.documents_processing ?? 0
              }
              failed={summary?.documents_failed ?? 0}
              total={documentCount}
            />
          </Panel>
        </motion.div>

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="mt-6"
        >
          <Panel
            title="Team activity"
            subtitle="Recent documents uploaded by your department"
          >
            {!data.activities.length ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.activities.map((activity, index) => (
                  <motion.div
                    key={`${activity.document}-${index}`}
                    initial={{
                      opacity: 0,
                      x: -10,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay: index * 0.08,
                    }}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-500">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800 sm:text-[15px]">
                        {activity.document}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-400">
                        Uploaded by {activity.uploaded_by}
                      </p>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold capitalize text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {activity.status}
                      </span>

                      <p className="mt-1.5 text-xs text-slate-400">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-cyan-200 bg-white px-4 py-2 shadow-sm">
      <motion.span
        animate={{
          scale: [1, 1.7, 1],
          opacity: [0.8, 0, 0.8],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
        }}
        className="absolute left-3 h-2.5 w-2.5 rounded-full bg-cyan-400"
      />

      <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-500" />

      <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-cyan-700">
        Live insights
      </span>

      <Activity className="h-4 w-4 text-cyan-500" />
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: number | string;
  description: string;
  icon: typeof Users;
  gradient: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -5,
        transition: { duration: 0.2 },
      }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-xl sm:p-6"
    >
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] blur-xl transition-transform duration-500 group-hover:scale-150`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <motion.p
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.25,
              duration: 0.45,
            }}
            className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl"
          >
            {value}
          </motion.p>

          <p className="mt-1.5 text-sm text-slate-400">
            {description}
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate: 6,
            scale: 1.08,
          }}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={itemVariants}
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {subtitle}
        </p>
      </div>

      {children}
    </motion.section>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
    >
      <Icon className="h-5 w-5 text-cyan-500" />

      <p className="mt-3 text-sm font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-lg font-extrabold text-slate-900">
        {value}
      </p>
    </motion.div>
  );
}

function DocumentHealth({
  completed,
  processing,
  failed,
  total,
}: {
  completed: number;
  processing: number;
  failed: number;
  total: number;
}) {
  const safeTotal = total || 1;

  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${(completed / safeTotal) * 100}%`,
          }}
          transition={{ duration: 1, ease }}
          className="bg-emerald-400"
        />

        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${(processing / safeTotal) * 100}%`,
          }}
          transition={{
            duration: 1,
            delay: 0.15,
            ease,
          }}
          className="bg-amber-400"
        />

        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${(failed / safeTotal) * 100}%`,
          }}
          transition={{
            duration: 1,
            delay: 0.3,
            ease,
          }}
          className="bg-red-400"
        />
      </div>

      <div className="mt-6 space-y-4">
        <StatusRow
          icon={CheckCircle2}
          label="Completed"
          value={completed}
          className="text-emerald-500"
        />

        <StatusRow
          icon={Clock3}
          label="Processing"
          value={processing}
          className="text-amber-500"
        />

        <StatusRow
          icon={Activity}
          label="Failed"
          value={failed}
          className="text-red-500"
        />
      </div>
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${className}`} />

        <span className="text-sm font-semibold text-slate-600">
          {label}
        </span>
      </div>

      <span className="font-extrabold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <FileText className="h-9 w-9 text-slate-200" />

      <p className="mt-3 text-sm text-slate-400">
        No recent department activity.
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
    }
  );
}

export default ManagerDashboard;