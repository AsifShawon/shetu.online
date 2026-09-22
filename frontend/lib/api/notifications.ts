import { apiRequest } from "./client";

export type NotificationKind = "info" | "success" | "warning";

export interface UserNotification {
  id: number;
  title: string;
  message: string;
  kind: NotificationKind;
  action_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationInbox {
  notifications: UserNotification[];
  unread_count: number;
}

export async function getNotifications(): Promise<NotificationInbox> {
  return apiRequest<NotificationInbox>("/api/accounts/notifications/");
}

export async function markNotificationRead(
  notificationId: number,
): Promise<UserNotification> {
  return apiRequest<UserNotification>(
    `/api/accounts/notifications/${notificationId}/read/`,
    { method: "PATCH" },
  );
}

export async function markAllNotificationsRead(): Promise<{
  updated_count: number;
  unread_count: number;
}> {
  return apiRequest("/api/accounts/notifications/read-all/", {
    method: "POST",
  });
}
