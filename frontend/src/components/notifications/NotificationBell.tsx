import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "./useNotifications";
import NotificationList from "./NotificationList";

export default function NotificationBell() {
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    handleNotificationRead,
    handleMarkAllAsRead,
    handleClearAll,
  } = useNotifications();

  const [open, setOpen] = useState(false);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  const handleNotificationClick = async (
    notification: typeof notifications[number]
  ) => {
    await handleNotificationRead(notification);

    setOpen(false);

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleBellClick = () => {
    const nextOpen = !open;

    setOpen(nextOpen);

    if (nextOpen) {
      loadNotifications();
    }
  };

  return (
    <div
      ref={notificationRef}
      className="relative"
    >
      {/* Bell */}

      <button
        onClick={handleBellClick}
        className={`relative rounded-xl p-3 transition ${
          open
            ? "bg-teal-100 text-teal-700"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell
          size={22}
          strokeWidth={2}
        />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-100">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Card */}

      {open && (
        <div
          className="
            fixed
            left-2
            right-2
            top-[88px]
            z-[100]
            w-auto
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-[0_20px_50px_rgba(15,23,42,0.18)]
            sm:absolute
            sm:left-auto
            sm:right-0
            sm:top-auto
            sm:mt-3
            sm:w-[410px]
          "
        >
          {/* Top Accent */}

          <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />

          {/* Notification List */}

          <NotificationList
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onNotificationClick={
              handleNotificationClick
            }
            onMarkAllAsRead={
              handleMarkAllAsRead
            }
            onClearAll={
              handleClearAll
            }
          />
        </div>
      )}
    </div>
  );
}