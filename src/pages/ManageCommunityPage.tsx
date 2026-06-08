import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import ShareProfileModal, { type SharePerson } from "../components/ShareProfileModal";
import {
  fetchConnections,
  removeConnection,
  type Connection,
} from "../services/communityService";

// ─── Avatar helper ────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 64 }: { url?: string | null; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-gradient-to-br from-[#84081F] to-[#A95BFD] flex items-center justify-center text-white font-bold shrink-0"
    >
      {initials || "?"}
    </div>
  );
}

// ─── Three-dot menu ───────────────────────────────────────────────────────────

function ThreeDotMenu({ onRemove, onShare }: { onRemove: () => void; onShare: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors text-[#9199a3]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-10 bg-white border border-[#f2f2f3] rounded-xl shadow-lg z-20 min-w-[130px] overflow-hidden">
          <button
            onClick={() => { onShare(); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-sm text-[#474d57] hover:bg-[#f9fafb] transition-colors font-medium flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share
          </button>
          <div className="h-px bg-[#f2f2f3]" />
          <button
            onClick={() => { onRemove(); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-[#fff5f5] transition-colors font-medium"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className}`} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManageCommunityPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sharePerson, setSharePerson] = useState<SharePerson | null>(null);
  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const result = await fetchConnections(q || undefined);
      setConnections(result.connections);
    } catch {
      // leave previous list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(""); }, [load]);

  function handleSearch() {
    setQuery(search);
    load(search);
  }

  async function handleRemove(conn: Connection) {
    setConnections((prev) => prev.filter((c) => c.connection_id !== conn.connection_id));
    try {
      await removeConnection(conn.id);
    } catch {
      load(query); // revert by reloading
    }
  }

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

          {/* Back + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/community")}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white border border-transparent hover:border-[#f2f2f3] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18191c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <h1 className="text-[#18191c] text-[24px] font-normal">Manage my community</h1>
          </div>

          {/* Connections card */}
          <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 gap-4 flex-wrap">
              <span className="text-[#18191c] text-[22px] font-normal">
                {loading ? "—" : connections.length} Connections
              </span>
              <div className="flex items-center gap-2 flex-1 max-w-[400px]">
                <div className="flex items-center gap-2 flex-1 border border-[#e5e7eb] rounded-full px-4 py-2.5 bg-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9199a3" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search By Name"
                    className="flex-1 text-sm text-[#18191c] placeholder-[#9199a3] outline-none bg-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-5 py-2.5 rounded-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold hover:bg-[#fff6ed] transition-colors shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="h-px bg-[#f2f2f3]" />

            {/* List */}
            <div className="divide-y divide-[#f2f2f3]">
              {loading && (
                <>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="flex-1 flex flex-col gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!loading && connections.length === 0 && (
                <div className="py-16 text-center text-[#9199a3] text-sm">
                  {query ? "No connections match your search." : "No connections yet."}
                </div>
              )}

              {!loading && connections.map((c) => (
                <div key={c.connection_id} className="flex items-center gap-4 px-6 py-4">
                  <button onClick={() => navigate(`/profile/${c.id}`)} className="shrink-0 focus:outline-none">
                    <Avatar url={c.avatar_url} name={c.name} size={64} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate(`/profile/${c.id}`)} className="text-[#18191c] text-base font-semibold hover:text-[#f77f00] transition-colors text-left">
                      {c.name}
                    </button>
                    {c.title && <p className="text-[#9199a3] text-sm">{c.title}</p>}
                    {c.company && <p className="text-[#9199a3] text-sm">{c.company}</p>}
                    <p className="text-[#18191c] text-sm font-semibold mt-0.5">
                      {formatTime(c.connected_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate("/messages", { state: { userId: c.id, userName: c.name, userAvatar: c.avatar_url } })}
                      className="px-5 py-2 rounded-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold hover:bg-[#fff6ed] transition-colors"
                    >
                      Message
                    </button>
                    <ThreeDotMenu onRemove={() => handleRemove(c)} onShare={() => setSharePerson(c)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {sharePerson && (
        <ShareProfileModal person={sharePerson} onClose={() => setSharePerson(null)} />
      )}
    </div>
  );
}
