import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../services/notificationService';

const TYPE_COLORS: Record<string, string> = {
  message: "#c9a882",
  post: "#a8c9a8",
  like: "#d9aba8",
  comment: "#a8b8d9",
  connection: "#c8a8d9",
};

function notifActorName(n: AppNotification): string {
  const a = n.actor;
  if (!a) return "Someone";
  const full = [a.first_name, a.last_name].filter(Boolean).join(" ");
  return full || a.org_name || "Someone";
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function NotificationAvatar({ notif }: { notif: AppNotification }) {
  const avatarUrl = notif.actor?.avatar_url;
  const bg = TYPE_COLORS[notif.type] ?? "#c9a882";
  const initial = notifActorName(notif)[0]?.toUpperCase() ?? "?";
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-base font-bold"
      style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)` }}
    >
      {initial}
    </div>
  );
}

function NotificationItem({ notif, onDismiss, onMarkRead }: {
  notif: AppNotification;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className="flex items-start gap-3 py-3.5 border-b border-[#f2f2f3] last:border-0 group cursor-pointer"
      onClick={() => onMarkRead(notif.id)}
    >
      <NotificationAvatar notif={notif} />

      <div className="flex-1 min-w-0">
        <p className="text-[#18191c] text-sm leading-snug">{notif.message}</p>
        <p className="text-[#ff9400] text-xs font-medium mt-1">{timeAgo(notif.created_at)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-1">
        {!notif.is_read && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff9400] shrink-0" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9199a3] hover:text-[#ff9400]"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const { notifications, loading, unreadCount, dismiss, dismissAll, markRead, markAllRead } = useNotifications();

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[520px]">
          {/* Page nav indicator */}
          <div className="flex justify-end mb-4">
            <div className="flex flex-col items-center gap-1 text-[#ff9400]">
              <div className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ff9400] text-white text-[9px] rounded-full w-[14px] h-[14px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold">Notifications</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h1 className="text-[#18191c] text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[#ff9400] text-sm font-semibold hover:text-[#e68500] transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between px-5 pb-2">
              <span className="text-[#18191c] text-sm font-semibold">
                {unreadCount > 0 ? `${unreadCount} new` : "All caught up"}
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={dismissAll}
                  className="text-[#ff9400] text-sm font-semibold hover:text-[#e68500] transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="px-5 pb-5">
              {loading ? (
                <div className="py-12 flex flex-col items-center gap-3 text-[#9199a3]">
                  <div className="w-8 h-8 border-2 border-[#ff9400] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-[#9199a3]">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onDismiss={dismiss}
                    onMarkRead={markRead}
                  />
                ))
              )}
            </div>
          </div>

          {/* Back link */}
          <button
            onClick={() => navigate(-1)}
            className="mt-5 mx-auto flex items-center gap-1.5 text-[#9199a3] hover:text-white text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
