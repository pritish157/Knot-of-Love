import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../services/http";
import { useAuth } from "./useAuth";
import { useSocket } from "./useSocket";

export function useNotifications() {
  const { user } = useAuth();
  const socket = useSocket();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await apiRequest("/api/notifications");
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Silently fail — non-critical, bell stays empty
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await apiRequest(`/api/notifications/read/${id}`, { method: "POST" });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silent — UI already reflects optimistic update
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest("/api/notifications/read-all", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time socket events
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
}
