import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { searchGlobal, type SearchResults } from "../services/searchService";
import logoImg from "../assets/images/logo/logo.png";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationService";
import type { Notification, NotificationType } from "../services/notificationService";

const API_URL = import.meta.env.VITE_API_URL;

const POLL_INTERVAL = 30_000; // 30 s

type TopBarProps = {
  onMenuToggle: () => void;
  searchValue?: string;
  onSearchChange?: (q: string) => void;
};

// ─── Type icon ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { bg: string; color: string; icon: React.ReactNode }> = {
  message: {
    bg: '#dbeafe', color: '#3b82f6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
      </svg>
    ),
  },
  job_alert: {
    bg: '#d1fae5', color: '#10b981',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  employment: {
    bg: '#fff3e0', color: '#f77f00',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  application: {
    bg: '#ede9fe', color: '#8b5cf6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  payment: {
    bg: '#ccfbf1', color: '#14b8a6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  course: {
    bg: '#e0f2fe', color: '#0ea5e9',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  system: {
    bg: '#f3f4f6', color: '#6b7280',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
};

function NotifTypeIcon({ type }: { type: NotificationType }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: cfg.bg }}
    >
      {cfg.icon}
    </div>
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
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

const roleLabels: Record<string, string> = {
  student: "Student",
  professional: "Working Professional",
  entrepreneur: "Entrepreneur",
  educator: "Educator",
};

// ─── Component ────────────────────────────────────────────────────────────────

function SearchBar({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ users: [], posts: [], postsFallback: false });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults({ users: [], posts: [], postsFallback: false }); setOpen(false); return; }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchGlobal(query);
        setResults(res);
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults = results.users.length > 0 || results.posts.length > 0;

  function handleUserClick(userId: string) {
    setQuery(''); setOpen(false);
    navigate(`/profile/${userId}`);
  }

  function handlePostClick(postId: string) {
    setQuery(''); setOpen(false);
    navigate(`/home?post=${postId}`);
  }

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-auto">
      <div className="relative flex items-center">
        <svg className="absolute left-3 text-[#9ca3af] pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (query.trim() && hasResults) setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) {
              setOpen(false);
              const q = query.trim();
              setQuery('');
              navigate(`/search?q=${encodeURIComponent(q)}`);
            }
          }}
          placeholder="Search profiles, posts…"
          className="w-full bg-[#f8f8f8] border border-[#f2f2f3] rounded-full pl-10 pr-9 py-2 text-sm text-[#474d57] placeholder-[#9ca3af] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors"
        />
        {loading && (
          <div className="absolute right-3 w-4 h-4 border-2 border-[#f77f00]/30 border-t-[#f77f00] rounded-full animate-spin" />
        )}
        {!loading && query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-3 text-[#9ca3af] hover:text-[#474d57] transition-colors" aria-label="Clear">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-[0px_8px_32px_rgba(0,0,0,0.14)] border border-[#f2f2f3] z-50 overflow-hidden max-h-[420px] overflow-y-auto">
          {!hasResults ? (
            <div className="px-4 py-6 text-center">
              <p className="text-[#6b7280] text-sm">No results for "<span className="font-medium">{query}</span>"</p>
            </div>
          ) : (
            <>
              {results.users.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">People</p>
                  {results.users.map(user => (
                    <button key={user.id} onMouseDown={() => handleUserClick(user.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f9fafb] transition-colors text-left">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#f77f00] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {getInitials(user.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[#18191c] text-sm font-semibold truncate">{user.name}</p>
                        {user.title && <p className="text-[#6b7280] text-xs truncate">{user.title}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.posts.length > 0 && (
                <div className={results.users.length > 0 ? 'border-t border-[#f2f2f3]' : ''}>
                  <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Posts</p>
                  {results.posts.map(post => {
                    const u = post.user;
                    const authorName = u
                      ? u.user_type === 'organization'
                        ? (u.org_name ?? 'Unknown')
                        : [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown'
                      : 'Unknown';
                    const authorAvatar = u?.avatar_url ?? null;
                    const displayText = post.content || (post.post_type === 'event' ? 'Shared an event' : post.post_type === 'poll' ? 'Created a poll' : `Shared a ${post.post_type}`);
                    return (
                      <button key={post.id} onMouseDown={() => handlePostClick(post.id)} className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[#f9fafb] transition-colors text-left">
                        {authorAvatar ? (
                          <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#6b7280] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                            {getInitials(authorName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[#18191c] text-xs font-semibold truncate">{authorName}</p>
                          <p className="text-[#6b7280] text-sm truncate leading-snug">{displayText}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-[#f2f2f3] px-4 py-2.5">
                <button onMouseDown={() => { setOpen(false); navigate(`/search?q=${encodeURIComponent(query.trim())}`); }} className="text-[#f77f00] text-sm font-medium hover:underline">
                  See all results for "{query}"
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function TopBar({ onMenuToggle, searchValue: _sv, onSearchChange: _osc }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMessagesActive = location.pathname === "/messages";

  const [meOpen, setMeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const meRef    = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // BUG-009 fix: memoize so JSON.parse doesn't run on every render
  const storedUser = useMemo(
    () => JSON.parse(localStorage.getItem("user") ?? "{}"),
    [],
  );
  const userRole: string = storedUser.role ?? "";
  const userType: string = storedUser.user_type ?? "";
  const displayName = (() => {
    const f = storedUser.first_name;
    const l = storedUser.last_name;
    const full = [f, l].filter((s) => s && s !== "unknown").join(" ");
    return full || storedUser.org_name || "My Profile";
  })();
  const roleLabel: string =
    userType === "organization" ? "Organization" : (roleLabels[userRole] ?? "Member");

  // ── Fetch notifications ──────────────────────────────────────────────────
  // BUG-001 fix: fetch true unread count separately (not capped by dropdown limit)
  // BUG-006 fix: track fetch errors and show indicator
  const loadNotifications = useCallback(async () => {
    try {
      const [data, count] = await Promise.all([
        fetchNotifications(10, 0),
        fetchUnreadCount(),
      ]);
      setNotifications(data);
      setUnreadCount(count);
      setFetchError(false);
    } catch {
      setFetchError(true);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // ── Notification handlers ────────────────────────────────────────────────
  async function handleNotifClick(n: Notification) {
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markAsRead(n.id).catch(() => {});
    }
    setNotifOpen(false);
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
      else navigate('/home');
    }
  }

  // BUG-005 fix: roll back optimistic delete if the DB call fails
  async function handleDismiss(id: string) {
    const removed = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (removed && !removed.is_read) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await deleteNotification(id);
    } catch {
      // restore on failure
      if (removed) setNotifications((prev) => [removed, ...prev].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ));
      if (removed && !removed.is_read) setUnreadCount((c) => c + 1);
    }
  }

  async function handleClearAll() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    markAllAsRead().catch(() => {});
  }

  // ── Avatar fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    const token = user.access_token ?? "";
    if (!token) return;
    fetch(`${API_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); })
      .catch(() => {});
  }, []);

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (meRef.current && !meRef.current.contains(e.target as Node)) setMeOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Account navigation ───────────────────────────────────────────────────
  function handleUpdateAccount() {
    setMeOpen(false);
    if (userType === "individual" && userRole === "entrepreneur") navigate("/account/update/entrepreneur");
    else if (userType === "individual" && userRole === "professional") navigate("/account/update/professional");
    else if (userType === "individual" && userRole === "educator") navigate("/account/update/educator");
    else if (userType === "individual") navigate("/account/update/student");
    else if (userType === "organization" && storedUser.org_type === "forprofit") navigate("/account/update/org/forprofit");
    else if (userType === "organization" && storedUser.org_type === "international") navigate("/account/update/org/international");
    else if (userType === "organization" && storedUser.org_type === "nonprofit") navigate("/account/update/org/nonprofit");
    else if (userType === "organization" && storedUser.org_type === "health") navigate("/account/update/org/health");
    else if (userType === "organization" && storedUser.org_type === "utilities") navigate("/account/update/org/utilities");
    else if (userType === "organization" && storedUser.org_type === "welfare") navigate("/account/update/org/welfare");
    else if (userType === "organization") navigate("/account/update/org");
    else navigate("/account/update");
  }

  function handleSignOut() {
    localStorage.removeItem("user");
    setMeOpen(false);
    navigate("/");
  }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <header className="fixed top-0 left-0 right-0 h-[64px] sm:h-[72px] lg:h-[78px] bg-white border-b border-[#f2f2f3] z-30 flex items-center px-4 md:px-6 gap-4">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-[#7c8493] hover:text-[#f77f00] shrink-0"
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Logo */}
      <a href="/home" className="shrink-0">
        <img src={logoImg} alt="Impactshaala" className="h-9 object-contain" />
      </a>

      {/* Search bar */}
      <SearchBar navigate={navigate} />

      {/* Right actions */}
      <div className="flex items-center gap-4 md:gap-6 ml-auto shrink-0">
        {/* Messages */}
        <button
          onClick={() => navigate("/messages")}
          className={`hidden sm:flex flex-col items-center gap-0.5 transition-colors ${isMessagesActive ? "text-[#f77f00]" : "text-[#6c6c6c] hover:text-[#f77f00]"}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={isMessagesActive ? "#f77f00" : "none"}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
              stroke={isMessagesActive ? "#f77f00" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[11px] leading-none">Message</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setMeOpen(false); }}
            className={`flex flex-col items-center gap-0.5 transition-colors relative ${notifOpen ? "text-[#f77f00]" : "text-[#6c6c6c] hover:text-[#f77f00]"}`}
          >
            <div className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff9400] text-white text-[9px] rounded-full min-w-[14px] h-[14px] flex items-center justify-center font-bold px-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-none">Notifications</span>
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-[0px_8px_32px_rgba(0,0,0,0.14)] border border-[#f2f2f3] z-50 overflow-hidden
              max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:w-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h2 className="text-[#18191c] text-base font-bold">Notifications</h2>
                <button
                  onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                  className="text-[#9199a3] hover:text-[#18191c] transition-colors p-1"
                  title="See all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                  </svg>
                </button>
              </div>

              {/* Sub-header */}
              <div className="flex items-center justify-between px-4 pb-2">
                <span className="text-[#18191c] text-xs font-semibold">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </span>
                {unreadCount > 0 && (
                  <button onClick={handleClearAll} className="text-[#ff9400] text-xs font-semibold hover:text-[#e68500] transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f2f2f3]">
                {fetchError ? (
                  <div className="py-8 flex flex-col items-center gap-2 text-[#9199a3]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-center">Couldn't load notifications.<br/>Check your connection.</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 flex flex-col items-center gap-2 text-[#9199a3]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const parsed = parseNotifMessage(n.message);
                    return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 group transition-colors cursor-pointer ${n.is_read ? 'hover:bg-[#fafafa]' : 'bg-[#fff8f0] hover:bg-[#fff3e0]'}`}
                    >
                      <NotifTypeIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#18191c] text-xs font-semibold leading-snug truncate">{n.title || parsed.text}</p>
                        {n.title && <p className="text-[#6b7280] text-xs leading-snug mt-0.5 line-clamp-2">{parsed.text}</p>}
                        <p className="text-[#ff9400] text-[11px] font-medium mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pt-1">
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#ff9400]" />}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9199a3] hover:text-[#ff9400] p-0.5"
                          aria-label="Dismiss"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#f2f2f3] px-4 py-2.5">
                <button
                  onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                  className="w-full text-center text-xs text-[#ff9400] font-semibold hover:text-[#e68500] transition-colors"
                >
                  See all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Me — with dropdown */}
        <div className="relative" ref={meRef}>
          <button
            onClick={() => setMeOpen((v) => !v)}
            className="flex flex-col items-center gap-0.5 text-[#6c6c6c] hover:text-[#f77f00] transition-colors"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Me" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#ff9400] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {(storedUser.first_name?.[0] ?? storedUser.org_name?.[0] ?? 'U').toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex items-center">
              <span className="text-[11px] leading-none">Me</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-200 ${meOpen ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          {/* Me dropdown */}
          {meOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl shadow-[0px_8px_24px_rgba(0,0,0,0.12)] border border-[#f2f2f3] z-50 overflow-hidden py-1">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f2f3]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Me" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#ff9400] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(storedUser.first_name?.[0] ?? storedUser.org_name?.[0] ?? 'U').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[#18191c] text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-[#767f8c] text-xs truncate">{roleLabel}</p>
                </div>
              </div>

              <button onClick={() => { setMeOpen(false); navigate("/profile/me"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#fff6ed] hover:text-[#f77f00] transition-colors text-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                My Profile
              </button>

              <button onClick={handleUpdateAccount}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#fff6ed] hover:text-[#f77f00] transition-colors text-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Update Account
              </button>

              <button onClick={() => { setMeOpen(false); navigate("/home"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#fff6ed] hover:text-[#f77f00] transition-colors text-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Settings
              </button>

              <div className="border-t border-[#f2f2f3] my-1" />

              <button onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
