import api from "./api";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "task"
  | "document"
  | "user"
  | "security";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
}


// =========================================================
// GET NOTIFICATIONS
// =========================================================

export const getNotifications = async (): Promise<
  NotificationItem[]
> => {
  const response = await api.get(
    "/notifications/"
  );

  return response.data;
};


// =========================================================
// GET UNREAD COUNT
// =========================================================

export const getUnreadNotificationCount =
  async (): Promise<number> => {
    const response = await api.get(
      "/notifications/unread-count"
    );

    return response.data.count;
  };


// =========================================================
// MARK AS READ
// =========================================================

export const markNotificationAsRead = async (
  notificationId: string
) => {
  const response = await api.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};


// =========================================================
// MARK ALL AS READ
// =========================================================

export const markAllNotificationsAsRead =
  async () => {
    const response = await api.patch(
      "/notifications/read-all"
    );

    return response.data;
  };

export const clearAllNotifications = async () => {
  const response = await api.delete(
    "/notifications/clear-all"
  );

  return response.data;
};