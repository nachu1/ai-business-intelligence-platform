import { useState } from "react";
import { Bell, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { NotificationItem } from "../../api/notification";
import NotificationItemComponent from "./NotificationItem";

interface Props {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  onNotificationClick: (
    notification: NotificationItem
  ) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export default function NotificationList({
  notifications,
  unreadCount,
  loading,
  onNotificationClick,
  onMarkAllAsRead,
  onClearAll,
}: Props) {
  const navigate = useNavigate();

  const [showClearConfirmation, setShowClearConfirmation] =
    useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center px-6 py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-teal-500" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Notifications
          </h3>

          
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="rounded-lg px-2.5 py-2 text-xs font-semibold text-teal-600 transition hover:bg-teal-50 hover:text-teal-700"
              >
                Mark all as read
              </button>
            )}

            <button
              onClick={() =>
                setShowClearConfirmation(true)
              }
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              aria-label="Clear all notifications"
              title="Clear all notifications"
            >
              <Trash2 size={17} />
            </button>
          </div>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Bell
                size={22}
                className="text-slate-400"
              />
            </div>

            <p className="text-sm font-semibold text-slate-700">
              No notifications
            </p>

            <p className="mt-1 text-sm text-slate-400">
              You're all caught up.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItemComponent
              key={notification.id}
              notification={notification}
              onClick={onNotificationClick}
            />
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <button
          onClick={() => navigate("/notifications")}
          className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-5 py-3.5 text-sm font-semibold text-teal-600 transition hover:bg-teal-50 hover:text-teal-700"
        >
          View all notifications
          <ArrowRight size={16} />
        </button>
      )}

      {showClearConfirmation && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <p className="text-sm font-semibold text-slate-700">
            Clear all notifications?
          </p>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            This will permanently remove your notification
            history.
          </p>

          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() =>
                setShowClearConfirmation(false)
              }
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                setShowClearConfirmation(false);
                onClearAll();
              }}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </>
  );
}