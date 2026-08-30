import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  Activity,
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  ListTodo,
  Loader2,
  UserRound,
  UploadCloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DashboardData } from "../../api/dashboard";
import { getMyTasks, submitTask, type Task } from "../../api/messages";
import { uploadDocument } from "../../api/document";

interface Props {
  data: DashboardData;
}

const ease = [0.22, 1, 0.36, 1] as const;

function EmployeeDashboard({ data }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const documents = data.my_documents ?? 0;
  const manager = data.manager;
  const department = data.department;

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch((error) => console.error("Failed to load tasks:", error))
      .finally(() => setLoadingTasks(false));
  }, []);

  const visibleTasks = tasks.filter(
    (task) => task.status === "pending" || task.status === "rejected"
  );

  const handleSubmit = async (id: string, file: File) => {
    try {
      setSubmitting(id);

      const uploaded = await uploadDocument(file, "other");
      await submitTask(id, uploaded.document_id);

      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Failed to submit task:", error);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f3f7fb]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-indigo-300/15 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <Hero department={department?.name} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            icon={FileText}
            label="My documents"
            value={documents}
            text={`${documents} ${documents === 1 ? "document" : "documents"} uploaded`}
            gradient="from-cyan-500 to-blue-600"
            background="from-cyan-50 to-blue-50"
          />

          <Stat
            icon={ListTodo}
            label="Active tasks"
            value={loadingTasks ? "..." : visibleTasks.length}
            text={
              visibleTasks.length === 1
                ? "Task needs your attention"
                : "Tasks need your attention"
            }
            gradient="from-violet-500 to-indigo-600"
            background="from-violet-50 to-indigo-50"
          />

          <Stat
            icon={CheckCircle2}
            label="Account"
            value="Active"
            text="Your account is active"
            gradient="from-emerald-500 to-teal-600"
            background="from-emerald-50 to-teal-50"
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel
            title="My team"
            subtitle="Your department and reporting manager"
            icon={UserRound}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Info
                icon={BriefcaseBusiness}
                label="Department"
                value={department?.name || "Not assigned"}
              />

              <Info
                icon={UserRound}
                label="Manager"
                value={manager?.name || "Not assigned"}
                extra={manager?.designation}
              />
            </div>
          </Panel>

          <Panel
            title="Tasks"
            subtitle="Work assigned to you by your manager"
            icon={ListTodo}
          >
            {loadingTasks ? (
              <div className="flex min-h-[135px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
              </div>
            ) : visibleTasks.length ? (
              <div className="space-y-3">
                {visibleTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    submitting={submitting === task.id}
                    onSubmit={handleSubmit}
                  />
                ))}
              </div>
            ) : (
              <EmptyTask />
            )}
          </Panel>
        </div>

        <Panel
          title="My documents"
          subtitle="Recent documents from your workspace"
          icon={FileText}
          className="mt-5"
        >
          {data.activities.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.activities.map((item, index) => (
                <motion.div
                  key={`${item.document}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-600">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {item.document}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {formatDate(item.created_at)}
                    </p>
                  </div>

                  <span className="hidden shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold capitalize text-emerald-700 sm:block">
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <Empty text="You haven't uploaded any documents yet." />
          )}
        </Panel>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm"
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <motion.span
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="absolute h-3 w-3 rounded-full bg-emerald-400"
            />
            <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-700">
              Workspace active
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Your dashboard is showing your current authorized information.
            </p>
          </div>

          <Activity className="ml-auto h-5 w-5 text-emerald-500" />
        </motion.div>
      </div>
    </div>
  );
}

function Hero({ department }: { department?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="relative mb-5 overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white via-cyan-50/70 to-indigo-50/80 px-6 py-7 shadow-[0_15px_50px_rgba(15,23,42,0.07)] sm:px-10 sm:py-8"
    >
      <motion.div
        animate={{
          x: [0, 35, 0],
          y: [0, -15, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        >
          <motion.span
            animate={{ scale: [1, 1.8, 1.8], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute h-4 w-4 rounded-full bg-emerald-400"
          />

          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
            <motion.span
              animate={{ scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-3 w-3 rounded-full bg-emerald-500"
            />
          </span>
        </motion.div>

        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
            Live workspace
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
          Stay on top of your work
        </h1>

        <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
          Keep track of your documents, tasks and team activity.
        </p>

        {department && (
          <div className="mt-4 max-w-full rounded-2xl border border-cyan-200/80 bg-white/80 px-5 py-2 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Department
            </p>
            <p className="mt-0.5 break-words text-sm font-extrabold text-slate-900">
              {department}
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function TaskCard({
  task,
  index,
  submitting,
  onSubmit,
}: {
  task: Task;
  index: number;
  submitting: boolean;
  onSubmit: (id: string, file: File) => void;
}) {
  const overdue =
    !!task.due_date &&
    new Date(task.due_date).getTime() < Date.now() &&
    task.status === "pending";

  const status = overdue ? "overdue" : task.status;
  const inputId = `task-file-${task.id}`;

  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    rejected: "bg-red-50 text-red-700 border-red-100",
    overdue: "bg-red-50 text-red-700 border-red-100",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    rejected: "Rejected",
    overdue: "Overdue",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <ListTodo className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="break-words text-base font-extrabold text-slate-950">
              {task.title}
            </h3>

            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${styles[status]}`}
            >
              {labels[status]}
            </span>
          </div>

          <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-600">
            {task.description}
          </p>

          {task.due_date && (
            <div
              className={`mt-3 flex items-center gap-1.5 text-xs font-bold ${
                overdue ? "text-red-600" : "text-slate-600"
              }`}
            >
              {overdue ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <Clock3 className="h-3.5 w-3.5" />
              )}

              {overdue ? "Overdue • " : "Deadline • "}
              {formatDateTime(task.due_date)}
            </div>
          )}

          {task.rejection_reason && (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
                Manager feedback
              </p>

              <p className="mt-1 text-sm font-medium leading-5 text-red-700">
                {task.rejection_reason}
              </p>
            </div>
          )}

          <input
            id={inputId}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
            disabled={submitting}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onSubmit(task.id, file);
              event.target.value = "";
            }}
          />

          <label
            htmlFor={inputId}
            className={`mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-violet-700 ${
              submitting ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}

            {submitting
              ? "Uploading..."
              : task.status === "rejected"
                ? "Upload & Resubmit"
                : "Upload & Submit"}
          </label>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyTask() {
  return (
    <div className="flex min-h-[135px] items-center gap-5 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
      <motion.div
        animate={{ y: [0, -5, 0], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-500 shadow-md"
      >
        <ListTodo className="h-7 w-7" />
      </motion.div>

      <div>
        <p className="text-base font-extrabold text-slate-900">
          No pending tasks
        </p>
        <p className="mt-1 text-sm font-medium leading-5 text-slate-600">
          Tasks assigned by your manager will appear here.
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  text,
  gradient,
  background,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  text: string;
  gradient: string;
  background: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      className={`relative overflow-hidden rounded-2xl border border-white bg-gradient-to-br ${background} p-5 shadow-sm`}
    >
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-sm font-medium text-slate-600">{text}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </motion.section>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  extra,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  extra?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-500 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className="mt-1 break-words text-base font-bold text-slate-900">
            {value}
          </p>

          {extra && (
            <p className="mt-0.5 break-words text-sm font-medium text-slate-500">
              {extra}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center text-center text-sm font-medium text-slate-500">
      {text}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default EmployeeDashboard;