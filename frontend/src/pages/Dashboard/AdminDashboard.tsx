import { motion } from "motion/react";
import {
  Activity,
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Package,
  Sparkles,
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

function AdminDashboard({ data }: Props) {
  const summary = data.summary!;
  const analytics = data.employee_analytics!;

  const completed = Math.max(
    summary.documents -
      summary.documents_processing -
      summary.documents_failed,
    0
  );

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f5f8fc]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />

      <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-violet-200/15 blur-3xl" />

      <div className="relative p-4 sm:p-6 lg:p-8">
        <Header
          title=""
          subtitle={`Real-time overview of ${
            summary.company_name || "your company"
          }.`}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 xl:grid-cols-4"
        >
          <StatCard
            label="Total users"
            value={summary.total_users}
            description="Across the company"
            icon={Users}
            gradient="from-cyan-500 to-blue-500"
          />

          <StatCard
            label="Managers"
            value={summary.managers}
            description="Active managers"
            icon={BriefcaseBusiness}
            gradient="from-violet-500 to-purple-500"
          />

          <StatCard
            label="Employees"
            value={summary.employees}
            description="Active employees"
            icon={Users}
            gradient="from-emerald-500 to-teal-500"
          />

          <StatCard
            label="Documents"
            value={summary.documents}
            description={`${summary.documents_today} uploaded today`}
            icon={FileText}
            gradient="from-orange-500 to-amber-500"
          />
        </motion.div>

        <AIInsights insights={data.insights} />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]"
        >
          <Panel
            title="Company overview"
            subtitle="People and document activity"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <OverviewMetric
                label="Departments"
                value={summary.departments}
                icon={BriefcaseBusiness}
              />

              <OverviewMetric
                label="Administrators"
                value={summary.admins}
                icon={ShieldCheck}
              />

              <OverviewMetric
                label="Uploaded today"
                value={summary.documents_today}
                icon={FileText}
              />

              <OverviewMetric
                label="Processing"
                value={summary.documents_processing}
                icon={Clock3}
              />
            </div>
          </Panel>

          <Panel
            title="Document health"
            subtitle="Current processing status"
          >
            <DocumentHealth
              completed={completed}
              processing={summary.documents_processing}
              failed={summary.documents_failed}
              total={summary.documents}
            />
          </Panel>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mt-6 grid gap-6 xl:grid-cols-2"
        >
          <Panel
            title="Department distribution"
            subtitle="People across company departments"
          >
            <DepartmentDistribution
              distribution={analytics.department_distribution}
              total={analytics.total_users}
            />
          </Panel>

          <Panel
            title="Workforce composition"
            subtitle="Current role distribution"
          >
            <RoleDistribution
              distribution={analytics.role_distribution}
              total={analytics.total_users}
            />
          </Panel>
        </motion.div>

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="mt-6"
        >
          <ActivityPanel activities={data.activities} />
        </motion.div>
      </div>
    </div>
  );
}

function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <LiveBadge />

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-[42px]">
          {title}
        </h1>

        <p className="mt-2 text-base text-slate-600 sm:text-lg">
          {subtitle}
        </p>
      </div>

      <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <motion.span
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.1, 0.9],
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

      <Activity className="h-4 w-4 text-cyan-600" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  gradient,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  description: string;
  gradient: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -5,
        transition: { duration: 0.2 },
      }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg sm:p-6"
    >
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] blur-xl transition-transform duration-500 group-hover:scale-150`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
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

          <p className="mt-1.5 text-sm text-slate-500">
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
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={itemVariants}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </motion.section>
  );
}

function OverviewMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <Icon className="h-5 w-5 text-cyan-600" />

      <p className="mt-3 text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-extrabold text-slate-900">
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
          transition={{
            duration: 1,
            ease,
          }}
          className="bg-emerald-500"
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
          className="bg-amber-500"
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
          className="bg-red-500"
        />
      </div>

      <div className="mt-6 space-y-4">
        <HealthRow
          icon={CheckCircle2}
          label="Completed"
          value={completed}
          className="text-emerald-600"
        />

        <HealthRow
          icon={Clock3}
          label="Processing"
          value={processing}
          className="text-amber-600"
        />

        <HealthRow
          icon={AlertCircle}
          label="Failed"
          value={failed}
          className="text-red-600"
        />
      </div>
    </div>
  );
}

function HealthRow({
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

      <span className="text-base font-extrabold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function DepartmentDistribution({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(distribution);

  if (!entries.length) {
    return (
      <EmptyState text="No department data available." />
    );
  }

  return (
    <div className="space-y-6">
      {entries.map(([name, count], index) => {
        const percentage = total
          ? Math.round((count / total) * 100)
          : 0;

        return (
          <div key={name}>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <span className="truncate text-sm font-bold text-slate-700">
                {name}
              </span>

              <span className="shrink-0 text-sm font-bold text-slate-600">
                {count}{" "}
                <span className="font-medium text-slate-500">
                  ({percentage}%)
                </span>
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${percentage}%`,
                }}
                transition={{
                  duration: 1,
                  delay: index * 0.12,
                  ease,
                }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  index % 2 === 0
                    ? "from-cyan-500 to-teal-500"
                    : "from-violet-500 to-purple-500"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoleDistribution({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const roles = [
    {
      key: "admin",
      label: "Administrators",
      color: "bg-violet-500",
    },
    {
      key: "manager",
      label: "Managers",
      color: "bg-cyan-500",
    },
    {
      key: "employee",
      label: "Employees",
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="grid gap-7 sm:grid-cols-[170px_1fr] sm:items-center">
      <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 via-white to-violet-100 shadow-inner">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 rounded-full border border-dashed border-cyan-200"
        />

        <div className="absolute inset-5 flex items-center justify-center rounded-full bg-white shadow-sm">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-slate-900">
              {total}
            </p>

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Users
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {roles.map((role, index) => {
          const count =
            distribution[role.key] || 0;

          const percentage = total
            ? Math.round((count / total) * 100)
            : 0;

          return (
            <motion.div
              key={role.key}
              initial={{
                opacity: 0,
                x: 10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: index * 0.1,
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${role.color}`}
                />

                <span className="text-sm font-semibold text-slate-600">
                  {role.label}
                </span>
              </div>

              <div className="text-right">
                <span className="text-base font-extrabold text-slate-900">
                  {count}
                </span>

                <span className="ml-2 text-sm text-slate-500">
                  {percentage}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AIInsights({
  insights,
}: {
  insights: DashboardData["insights"];
}) {
  const getInsightStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case "financial":
        return {
          icon: TrendingUp,
          iconClass: "text-emerald-700",
          iconBg: "bg-emerald-100",
          accent: "from-emerald-500 to-teal-500",
          badge: "bg-emerald-100 text-emerald-800",
        };

      case "inventory":
        return {
          icon: Package,
          iconClass: "text-amber-700",
          iconBg: "bg-amber-100",
          accent: "from-amber-500 to-orange-500",
          badge: "bg-amber-100 text-amber-800",
        };

      case "product":
        return {
          icon: Sparkles,
          iconClass: "text-violet-700",
          iconBg: "bg-violet-100",
          accent: "from-violet-500 to-purple-500",
          badge: "bg-violet-100 text-violet-800",
        };

      case "regional":
        return {
          icon: Activity,
          iconClass: "text-blue-700",
          iconBg: "bg-blue-100",
          accent: "from-blue-500 to-cyan-500",
          badge: "bg-blue-100 text-blue-800",
        };

      case "strategic":
        return {
          icon: Lightbulb,
          iconClass: "text-indigo-700",
          iconBg: "bg-indigo-100",
          accent: "from-indigo-500 to-violet-500",
          badge: "bg-indigo-100 text-indigo-800",
        };

      default:
        return {
          icon: Lightbulb,
          iconClass: "text-cyan-700",
          iconBg: "bg-cyan-100",
          accent: "from-cyan-500 to-blue-500",
          badge: "bg-cyan-100 text-cyan-800",
        };
    }
  };

  return (
    <motion.section
      variants={itemVariants}
      initial="hidden"
      animate="show"
      className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-100/30 blur-3xl" />

      <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-violet-100/20 blur-3xl" />

      <div className="relative">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-5 w-5" />

              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.45, 0.8, 0.45],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                }}
                className="absolute inset-0 rounded-xl border border-cyan-300"
              />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-950 sm:text-lg">
                AI Business Insights
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Important signals from your latest business documents
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />

            <span className="text-xs font-bold text-cyan-800">
              {insights.length} key{" "}
              {insights.length === 1 ? "insight" : "insights"}
            </span>
          </div>
        </div>

        {!insights.length ? (
          <EmptyState text="No business insights available yet." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {insights.map((insight, index) => {
              const style = getInsightStyle(
                insight.category
              );

              const Icon = style.icon;

              return (
                <motion.article
                  key={`${insight.document_id}-${insight.title}-${index}`}
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.45,
                    ease,
                  }}
                  whileHover={{
                    y: -4,
                    transition: {
                      duration: 0.2,
                    },
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-shadow hover:shadow-lg"
                >
                  <div
                    className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${style.accent}`}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.iconBg} ${style.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${style.badge}`}
                    >
                      {insight.category}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-extrabold leading-snug text-slate-950">
                    {insight.title}
                  </h3>

                  <p className="mt-2.5 text-sm leading-6 text-slate-600">
                    {insight.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </motion.section>
  );
}

function ActivityPanel({
  activities,
}: {
  activities: DashboardData["activities"];
}) {
  return (
    <Panel
      title="Recent activity"
      subtitle="Latest document activity"
    >
      {!activities.length ? (
        <EmptyState text="No recent activity." />
      ) : (
        <div className="divide-y divide-slate-200">
          {activities.map((activity, index) => (
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
              className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 transition-transform duration-300 group-hover:scale-110">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                  {activity.document}
                </p>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {activity.uploaded_by} ·{" "}
                  {activity.department}
                </p>
              </div>

              <div className="hidden shrink-0 text-right sm:block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold capitalize text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {activity.status}
                </span>

                <p className="mt-1.5 text-xs text-slate-500">
                  {formatDate(activity.created_at)}
                </p>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
            </motion.div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <FileText className="h-9 w-9 text-slate-300" />

      <p className="mt-3 text-sm text-slate-500">
        {text}
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

export default AdminDashboard;