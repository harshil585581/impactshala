import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../services/notificationService';
import type { Notification, NotificationType } from '../../services/notificationService';

// ─── Type config ──────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'unread';

const TYPE_LABELS: Record<NotificationType, string> = {
  message:     'Message',
  job_alert:   'Job Alert',
  employment:  'Employment',
  application: 'Application',
  payment:     'Payment',
  course:      'Course',
  system:      'System',
};

const TYPE_COLORS: Record<NotificationType, { bg: string; text: string; dot: string }> = {
  message:     { bg: '#dbeafe', text: '#3b82f6', dot: '#3b82f6' },
  job_alert:   { bg: '#d1fae5', text: '#10b981', dot: '#10b981' },
  employment:  { bg: '#fff3e0', text: '#f77f00', dot: '#f77f00' },
  application: { bg: '#ede9fe', text: '#8b5cf6', dot: '#8b5cf6' },
  payment:     { bg: '#ccfbf1', text: '#14b8a6', dot: '#14b8a6' },
  course:      { bg: '#e0f2fe', text: '#0ea5e9', dot: '#0ea5e9' },
  system:      { bg: '#f3f4f6', text: '#6b7280', dot: '#6b7280' },
};

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  message: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  ),
  job_alert: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  ),
  employment: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  application: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  ),
  payment: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  course: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  ),
  system: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
};

function NotifIcon({ type }: { type: NotificationType }) {
  const cfg = TYPE_COLORS[type] ?? TYPE_COLORS.system;
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {TYPE_ICONS[type]}
    </div>
  );
}

function TypeBadge({ type }: { type: NotificationType }) {
  const cfg = TYPE_COLORS[type] ?? TYPE_COLORS.system;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNotifMessage(raw: string): { text: string; post_id?: string; post_table?: string } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.text === 'string') return parsed;
  } catch { /* plain text */ }
  return { text: raw };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className}`} />;
}

const PAGE_SIZE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  // offset tracks position within the CURRENT tab's result set
  const offsetRef = useRef(0);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Search is client-side against already-loaded data
  const filtered = debouncedSearch
    ? notifications.filter((n) => {
        const q = debouncedSearch.toLowerCase();
        const text = parseNotifMessage(n.message).text.toLowerCase();
        return (n.title ?? '').toLowerCase().includes(q) || text.includes(q);
      })
    : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // BUG-003+004 fix: load/reload respects active tab and resets pagination
  const loadPage = useCallback(async (tab: FilterTab) => {
    setLoading(true);
    setFetchError(false);
    offsetRef.current = 0;
    try {
      const data = await fetchNotifications(PAGE_SIZE, 0, tab === 'unread');
      setNotifications(data);
      offsetRef.current = PAGE_SIZE;
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever tab changes
  useEffect(() => { loadPage(activeTab); }, [loadPage, activeTab]);

  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab);
    setSearch('');
    setDebouncedSearch('');
    setNotifications([]);
  }

  // Load more respects current tab
  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchNotifications(PAGE_SIZE, offsetRef.current, activeTab === 'unread');
      setNotifications((prev) => [...prev, ...data]);
      offsetRef.current += PAGE_SIZE;
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      // silent — user can retry
    } finally {
      setLoadingMore(false);
    }
  }

  // Mark single as read
  function handleMarkRead(n: Notification) {
    if (n.is_read) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    markAsRead(n.id).catch(() => {});
  }

  function handleClick(n: Notification) {
    handleMarkRead(n);
    const parsed = parseNotifMessage(n.message);
    if (parsed.post_id) {
      const url = parsed.post_table === 'discover_posts'
        ? `/discover?post=${parsed.post_id}`
        : `/home?post=${parsed.post_id}`;
      navigate(url);
    } else if (n.action_url) {
      navigate(n.action_url);
    } else {
      if (n.type === 'application' || n.type === 'employment') navigate('/applications/my-applications');
      else if (n.type === 'course') navigate('/applications/learning-directory');
    }
  }

  // BUG-005 fix: roll back if delete fails
  async function handleDismiss(id: string) {
    const removed = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch {
      if (removed) setNotifications((prev) =>
        [removed, ...prev].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
    }
  }

  // Mark all as read — if on unread tab, clear the list since all are now read
  async function handleMarkAllRead() {
    if (activeTab === 'unread') {
      setNotifications([]);
      setHasMore(false);
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    markAllAsRead().catch(() => {});
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6">

          {/* Page header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h1 className="text-[#18191c] text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-[#9199a3] text-sm mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 text-sm font-semibold text-[#f77f00] border border-[#f77f00] rounded-full hover:bg-[#fff8ee] transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters + search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              {([
                { key: 'all' as FilterTab, label: 'All' },
                { key: 'unread' as FilterTab, label: 'Unread' },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap
                    ${activeTab === t.key
                      ? 'bg-[#f77f00] text-white border-[#f77f00]'
                      : 'bg-white text-[#f77f00] border-[#f77f00] hover:bg-[#fff8ee]'
                    }`}
                >
                  {t.label}
                  {t.key === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 bg-white text-[#f77f00] text-[10px] font-bold rounded-full px-1.5 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm sm:ml-auto">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full bg-white border border-[#e5e7eb] rounded-full pl-9 pr-4 py-2 text-sm text-[#474d57] placeholder-[#9ca3af] focus:outline-none focus:border-[#f77f00] transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#f77f00]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            {fetchError ? (
              <div className="py-16 flex flex-col items-center gap-3 text-[#9199a3]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-base font-medium">Failed to load notifications</p>
                <button
                  onClick={() => loadPage(activeTab)}
                  className="mt-1 px-5 py-2 text-sm font-semibold text-[#f77f00] border border-[#f77f00] rounded-full hover:bg-[#fff8ee] transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="divide-y divide-[#f2f2f3]">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4">
                    <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-[#9199a3]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-base font-medium">
                  {debouncedSearch
                    ? 'No notifications match your search'
                    : activeTab === 'unread'
                    ? 'No unread notifications'
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#f2f2f3]">
                {filtered.map((n) => {
                  const parsed = parseNotifMessage(n.message);
                  return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-4 px-5 py-4 group cursor-pointer transition-colors
                      ${n.is_read ? 'hover:bg-[#fafafa]' : 'bg-[#fff8f0] hover:bg-[#fff3e0]'}`}
                  >
                    <NotifIcon type={n.type} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className={`text-sm leading-snug ${n.is_read ? 'text-[#18191c] font-medium' : 'text-[#18191c] font-bold'}`}>
                          {n.title || parsed.text}
                        </p>
                        <TypeBadge type={n.type} />
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#ff9400] shrink-0" />
                        )}
                      </div>
                      {n.title && <p className="text-[#6b7280] text-[13px] leading-relaxed">{parsed.text}</p>}
                      <p className="text-[#ff9400] text-xs font-medium mt-1.5">{timeAgo(n.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-1 ml-2">
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(n); }}
                          className="hidden group-hover:flex items-center gap-1 text-[10px] text-[#f77f00] font-semibold border border-[#f77f00] rounded-full px-2 py-0.5 hover:bg-[#fff8ee] transition-colors whitespace-nowrap"
                          title="Mark as read"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9199a3] hover:text-[#f77f00] p-1"
                        aria-label="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Load more */}
            {!loading && hasMore && !debouncedSearch && (
              <div className="border-t border-[#f2f2f3] px-5 py-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 text-sm font-semibold text-[#f77f00] border border-[#f77f00] rounded-full hover:bg-[#fff8ee] disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
