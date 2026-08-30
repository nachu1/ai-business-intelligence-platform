import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileText,
  Info,
  LockKeyhole,
  User,
} from "lucide-react";

import type {
  NotificationItem as Notification,
} from "../../api/notification";
import {
  formatNotificationTime,
} from "./notificationUtils";

interface Props {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

const styles = {
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  task: {
    icon: CheckCircle2,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  document: {
    icon: FileText,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  user: {
    icon: User,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  security: {
    icon: LockKeyhole,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
};

export default function NotificationItem({
  notification,
  onClick,
}: Props) {
  const style =
    styles[notification.type] || {
      icon: Bell,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-500",
    };

  const Icon = style.icon;

  return (
    <button
      onClick={() => onClick(notification)}
      className={`flex w-full gap-4 border-b border-slate-100 px-5 py-5 text-left transition hover:bg-slate-50 ${
        notification.is_read
          ? "bg-white"
          : "bg-slate-50/80"
      }`}
    >
      <div
        className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          notification.is_read
            ? "bg-slate-100 text-slate-400"
            : `${style.iconBg} ${style.iconColor}`
        }`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`text-[15px] leading-5 ${
              notification.is_read
                ? "font-medium text-slate-700"
                : "font-semibold text-slate-900"
            }`}
          >
            {notification.title}
          </p>

          {!notification.is_read && (
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500" />
          )}
        </div>

        <p className="mt-1.5 text-[14px] leading-6 text-slate-500">
          {notification.message}
        </p>

       <p className="mt-2 text-xs font-medium text-slate-400">
  {formatNotificationTime(
    notification.created_at
  )}
</p>
      </div>
    </button>
  );
}