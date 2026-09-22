"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 60_000;

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86_400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604_800) return `${Math.floor(elapsedSeconds / 86_400)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isInternalActionUrl(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

interface NotificationMenuProps {
  onOpen?: () => void;
}

export function NotificationMenu({ onOpen }: NotificationMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const inbox = await getNotifications();
      setNotifications(inbox.notifications);
      setUnreadCount(inbox.unread_count);
      setError("");
    } catch {
      setError("Could not load notifications.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
    const intervalId = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const openMenu = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      onOpen?.();
      void refresh();
    }
  };

  const markRead = async (notification: UserNotification) => {
    if (notification.is_read) return;

    setNotifications((items) =>
      items.map((item) =>
        item.id === notification.id ? { ...item, is_read: true } : item,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    try {
      await markNotificationRead(notification.id);
    } catch {
      void refresh();
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      setError("Could not mark notifications as read.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="ew-notif-menu" ref={containerRef}>
      <button
        type="button"
        className="ew-notif-btn"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-controls="ew-notification-panel"
        aria-haspopup="dialog"
        onClick={openMenu}
      >
        <i className="fa-regular fa-bell" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="ew-notif-count" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          id="ew-notification-panel"
          className="ew-notif-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Notifications"
        >
          <div className="ew-notif-panel-head">
            <div>
              <h2>Notifications</h2>
              <p>{unreadCount > 0 ? `${unreadCount} unread` : "You are all caught up"}</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="ew-notif-mark-all"
                disabled={isMarkingAll}
                onClick={() => void markAllRead()}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="ew-notif-list" aria-live="polite">
            {isLoading ? (
              <div className="ew-notif-state">
                <span className="ew-notif-spinner" aria-hidden="true" />
                <p>Loading notifications...</p>
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="ew-notif-state ew-notif-state--error">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                <p>{error}</p>
                <button type="button" onClick={() => void refresh(true)}>Try again</button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="ew-notif-state">
                <i className="fa-regular fa-bell-slash" aria-hidden="true" />
                <p>No notifications yet.</p>
                <span>New updates will appear here.</span>
              </div>
            ) : (
              notifications.map((notification) => {
                const content = (
                  <>
                    <span
                      className={cn(
                        "ew-notif-kind-icon",
                        `ew-notif-kind-icon--${notification.kind}`,
                      )}
                      aria-hidden="true"
                    >
                      <i
                        className={cn(
                          "fa-solid",
                          notification.kind === "success"
                            ? "fa-circle-check"
                            : notification.kind === "warning"
                              ? "fa-triangle-exclamation"
                              : "fa-circle-info",
                        )}
                      />
                    </span>
                    <span className="ew-notif-copy">
                      <strong>{notification.title}</strong>
                      {notification.message && <span>{notification.message}</span>}
                      <time dateTime={notification.created_at}>
                        {formatNotificationTime(notification.created_at)}
                      </time>
                    </span>
                    {!notification.is_read && (
                      <span className="ew-notif-unread-dot" aria-label="Unread" />
                    )}
                  </>
                );

                return isInternalActionUrl(notification.action_url) ? (
                  <Link
                    key={notification.id}
                    href={notification.action_url as Route}
                    className={cn(
                      "ew-notif-item",
                      !notification.is_read && "ew-notif-item--unread",
                    )}
                    onClick={() => {
                      void markRead(notification);
                      setIsOpen(false);
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={notification.id}
                    type="button"
                    className={cn(
                      "ew-notif-item",
                      !notification.is_read && "ew-notif-item--unread",
                    )}
                    onClick={() => void markRead(notification)}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
