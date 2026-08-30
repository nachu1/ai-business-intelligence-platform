import { useCallback, useEffect, useState } from "react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  type NotificationItem,
} from "../../api/notification";


export function useNotifications() {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);


  const loadNotifications = useCallback(
    async () => {
      try {
        const [items, count] = await Promise.all([
          getNotifications(),
          getUnreadNotificationCount(),
        ]);

        setNotifications(items);
        setUnreadCount(count);
      } catch (error) {
        console.error(
          "Failed to load notifications:",
          error
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );


  const refreshUnreadCount = useCallback(
    async () => {
      try {
        const count =
          await getUnreadNotificationCount();

        setUnreadCount(count);
      } catch (error) {
        console.error(
          "Failed to refresh notification count:",
          error
        );
      }
    },
    []
  );

  const handleClearAll = async () => {
  if (notifications.length === 0) {
    return;
  }

  try {
    await clearAllNotifications();

    setNotifications([]);
    setUnreadCount(0);
  } catch (error) {
    console.error(
      "Failed to clear notifications:",
      error
    );
  }
};

  useEffect(() => {
    loadNotifications();

    const interval = window.setInterval(
      refreshUnreadCount,
      30000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    loadNotifications,
    refreshUnreadCount,
  ]);


  const handleNotificationRead = async (
    notification: NotificationItem
  ) => {
    if (notification.is_read) {
      return;
    }

    try {
      await markNotificationAsRead(
        notification.id
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );

      setUnreadCount((count) =>
        Math.max(0, count - 1)
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };


  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark notifications as read:",
        error
      );
    }
  };


  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    handleNotificationRead,
    handleMarkAllAsRead,
    handleClearAll,
    
  };
}