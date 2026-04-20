import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

/**
 * NotificationBell — dropdown bell icon with unread count badge.
 * Shows last 10 notifications; marks as read on click; "Mark all" button.
 * Closes on outside click. Uses useNotifications hook (real-time via Socket.IO).
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleNotificationClick(n) {
    if (!n.isRead) markAsRead(n._id);
    setOpen(false);
    if (n.actionUrl) navigate(n.actionUrl);
  }

  const typeIcon = {
    NEW_MESSAGE:       "💬",
    MATCH_ACCEPTED:    "🎉",
    INTEREST_RECEIVED: "💌"
  };

  const recent = notifications.slice(0, 10);

  return (
    <div className="absolute right-4 top-4 md:relative md:right-auto md:top-auto" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 transition-colors"
      >
        <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[0.6rem] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          id="notification-panel"
          className="fixed left-4 right-4 top-16 z-50 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl transform origin-top-right md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10 bg-slate-50">
            <h3 className="text-sm font-bold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => { markAllAsRead(); }}
                className="text-xs text-brand-600 font-medium hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-ink/5">
            {recent.length === 0 ? (
              <li className="px-4 py-8 text-center text-muted text-sm">
                <span className="text-2xl block mb-1">🔔</span>
                No notifications yet
              </li>
            ) : (
              recent.map(n => (
                <li
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                    !n.isRead ? "bg-brand-50" : ""
                  }`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {typeIcon[n.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.isRead ? "font-bold text-ink" : "text-muted"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5 truncate">{n.body}</p>
                    <p className="text-[0.6rem] text-muted/60 mt-1">
                      {new Date(n.createdAt).toLocaleString([], {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-2" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
