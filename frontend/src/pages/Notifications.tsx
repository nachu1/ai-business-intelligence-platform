import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useNotifications,
} from "../components/notifications/useNotifications";

import NotificationItem from "../components/notifications/NotificationItem";


export default function Notifications() {
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    handleNotificationRead,
    handleMarkAllAsRead,
    handleClearAll,
  } = useNotifications();

  const [showClearConfirmation, setShowClearConfirmation] =
    useState(false);


  const handleClick = async (
    notification: typeof notifications[number]
  ) => {
    await handleNotificationRead(notification);

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };


  return (
    <div className="min-h-full bg-slate-100 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-6xl">

        {/* Back */}

        <button
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          <ArrowLeft size={17} />
          Back
        </button>


        {/* Page Header */}

        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
              <Bell
                size={25}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Notifications
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                Stay updated with activity in your workspace.
              </p>
            </div>

          </div>


          {notifications.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                >
                  <CheckCheck size={17} />
                  Mark all as read
                </button>
              )}

              <button
                onClick={() =>
                  setShowClearConfirmation(true)
                }
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={17} />
                Clear all
              </button>

            </div>
          )}

        </div>


        {/* Summary Cards */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Total notifications
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {notifications.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Bell size={20} />
              </div>

            </div>

          </div>


          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-teal-700">
                  Unread notifications
                </p>

                <p className="mt-2 text-3xl font-bold text-teal-800">
                  {unreadCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <Bell size={20} />
              </div>

            </div>

          </div>

        </div>


        {/* Notification Section */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">

            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Recent notifications
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Your latest workspace activity
              </p>
            </div>

            {unreadCount > 0 && (
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
                {unreadCount} unread
              </span>
            )}

          </div>


          {loading ? (

            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
            </div>

          ) : notifications.length === 0 ? (

            <div className="flex flex-col items-center justify-center px-6 py-24 text-center">

              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Bell size={30} />
              </div>

              <h2 className="text-lg font-bold text-slate-800">
                You're all caught up
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no notifications to show right now.
                New activity will appear here automatically.
              </p>

            </div>

          ) : (

            <div>
              {notifications.map(
                (notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleClick}
                  />
                )
              )}
            </div>

          )}

        </div>


        {/* Clear Confirmation */}

        {showClearConfirmation && (

          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Trash2 size={22} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                Clear all notifications?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                This will permanently remove your notification
                history. This action cannot be undone.
              </p>

              <div className="mt-7 flex justify-end gap-3">

                <button
                  onClick={() =>
                    setShowClearConfirmation(false)
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setShowClearConfirmation(false);
                    handleClearAll();
                  }}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  Clear all
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}