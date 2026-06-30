import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchAccountAttribution,
  reactivateUser,
  type AccountRow,
  type AccountAttributionStats,
} from "../../services/adminService";

const PER_PAGE = 8;
type Tab = "deactivated" | "deleted";

const ROLE_LABEL: Record<string, string> = {
  student:      "Student",
  professional: "Working Professional",
  educator:     "Educator",
  entrepreneur: "Entrepreneur",
};
const ORG_LABEL: Record<string, string> = {
  educational:  "Educational",
  forprofit:    "For-Profit",
  nonprofit:    "Non-Profit",
  health:       "Health Services",
  utilities:    "Public Utilities",
  welfare:      "Public Welfare",
  fieldtrip:    "Field Trip Venue",
  startup:      "Startup Support",
  talent:       "Talent Showcase",
  safety:       "Public Safety",
  international:"International",
  others:       "Others",
};

function displayName(row: AccountRow) {
  if (row.user_type === "organization") return row.org_name || row.email;
  return [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email;
}

function roleLabel(row: AccountRow) {
  if (row.user_type === "organization") return (ORG_LABEL[row.org_type] ?? row.org_type) || "Organisation";
  return (ROLE_LABEL[row.role] ?? row.role) || "Individual";
}

function fmtDate(val: string | null) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return val;
  }
}

function paginationPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#848484" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt={name} className="w-[52px] h-[52px] rounded-full object-cover flex-shrink-0" />;
  }
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div className="w-[52px] h-[52px] rounded-full bg-[#f0e6d3] flex items-center justify-center flex-shrink-0">
      <span className="text-[#f77f00] font-semibold text-base">{initials}</span>
    </div>
  );
}

const EMPTY_STATS: AccountAttributionStats = { deactivated: 0, deleted: 0 };

// ── Main component ────────────────────────────────────────────────────────────

export default function AccountAttributionView() {
  const [tab, setTab] = useState<Tab>("deactivated");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [stats, setStats] = useState<AccountAttributionStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((p: number, t: Tab, s: string) => {
    setLoading(true);
    setError(null);
    fetchAccountAttribution(p, PER_PAGE, t, s)
      .then((res) => {
        setRows(res.rows);
        setListTotal(res.total);
        setStats(res.stats);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load accounts.");
        setRows([]);
        setListTotal(0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, tab, search); }, [page, tab, load]);

  function handleTabChange(t: Tab) {
    setTab(t);
    setPage(1);
    load(1, t, search);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, tab, value), 400);
  }

  async function handleReactivate(userId: string) {
    setReactivatingId(userId);
    try {
      await reactivateUser(userId);
      // Remove from list and decrement stats
      setRows((prev) => prev.filter((r) => r.user_id !== userId));
      setListTotal((t) => Math.max(0, t - 1));
      setStats((s) => ({ ...s, deactivated: Math.max(0, s.deactivated - 1) }));
    } catch {
      /* ignore */
    } finally {
      setReactivatingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(listTotal / PER_PAGE));
  const pages = paginationPages(page, totalPages);
  const font: React.CSSProperties = { fontFamily: "'Be Vietnam Pro', sans-serif" };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[30px] font-semibold text-black" style={font}>Account Attribution</h1>
        <p className="text-[25px] text-[#575555] font-medium" style={font}>
          Manage deactivated and deleted user accounts.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ maxWidth: 560 }}>
        {[
          { label: "Deactivated accounts", value: stats.deactivated },
          { label: "Deleted Accounts",     value: stats.deleted },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-[#c3c3c3] rounded-[23px] px-6 py-5">
            <p className="text-[17px] text-[#575555] font-medium" style={font}>{card.label}</p>
            <p className="text-[33px] font-medium text-black mt-1" style={font}>
              {loading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-[#e0e0e0]">
          {(["deactivated", "deleted"] as Tab[]).map((t) => {
            const labels: Record<Tab, string> = {
              deactivated: "Deactivated Accounts",
              deleted:     "Deleted Accounts",
            };
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-8 py-4 text-[26px] font-medium relative ${active ? "text-[#f77f00]" : "text-black"}`}
                style={font}
              >
                {labels[t]}
                {active && <div className="absolute bottom-0 left-0 w-full h-[4px] bg-[#f77f00] rounded-t" />}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 border border-[#848484] rounded-[11px] px-4 h-[65px] w-[380px]">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search accounts...."
              className="flex-1 text-[22px] text-[#686868] font-medium bg-transparent outline-none"
              style={font}
            />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1fr] bg-[#ffd396] px-6 py-4">
          {["User", "Role", "Status", "Date", "Action"].map((col) => (
            <span key={col} className="text-[20px] font-semibold text-black" style={font}>{col}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-[3px] border-[#f77f00] border-t-transparent rounded-full animate-spin" />
            <span className="text-[16px] text-[#aaa]">Loading accounts…</span>
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <p className="text-[16px] text-red-500">{error}</p>
            <button
              onClick={() => load(page, tab, search)}
              className="px-5 py-2 rounded-full bg-[#f77f00] text-white text-[15px] font-semibold hover:bg-[#e07000] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 flex items-center justify-center text-[#aaa]">
            No {tab === "deactivated" ? "deactivated" : "deleted"} accounts found.
          </div>
        ) : (
          rows.map((row) => {
            const name = displayName(row);
            const role = roleLabel(row);
            const date = tab === "deleted"
              ? fmtDate(row.deleted_at)
              : fmtDate(row.deactivated_at);
            const isReactivating = reactivatingId === row.user_id;

            return (
              <div
                key={row.id}
                className="grid grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1fr] px-6 py-4 border-b border-[#f0f0f0] items-center hover:bg-[#fafafa] transition-colors"
              >
                {/* User */}
                <div className="flex items-center gap-4">
                  <Avatar url={row.avatar_url} name={name} />
                  <div className="min-w-0">
                    <p className="text-[21px] font-semibold text-black truncate" style={font}>{name}</p>
                    <p className="text-[15px] text-[#555454] font-medium truncate" style={font}>{row.email}</p>
                  </div>
                </div>

                {/* Role */}
                <span className="text-[19px] text-black font-medium" style={font}>{role}</span>

                {/* Status */}
                <span className="text-[19px] font-medium" style={font}>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold ${
                    tab === "deleted"
                      ? "bg-red-50 text-red-600"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {tab === "deleted" ? "Deleted" : "Deactivated"}
                  </span>
                </span>

                {/* Date */}
                <span className="text-[19px] text-black font-medium" style={font}>{date}</span>

                {/* Action */}
                <div>
                  {tab === "deactivated" ? (
                    <button
                      onClick={() => handleReactivate(row.user_id)}
                      disabled={isReactivating}
                      className="px-4 py-2 rounded-full bg-[#f77f00] text-white text-[14px] font-semibold hover:bg-[#e07000] disabled:opacity-50 transition-colors whitespace-nowrap"
                      style={font}
                    >
                      {isReactivating ? "…" : "Reactivate"}
                    </button>
                  ) : (
                    <span className="text-[15px] text-[#aaa]" style={font}>—</span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {!loading && listTotal > PER_PAGE && (
          <div className="flex items-center justify-center gap-2 py-5 px-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 text-[15px] text-[#444] disabled:opacity-40 hover:text-black"
            >
              <ChevronLeft /> Previous
            </button>

            {pages.map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="w-[42px] h-[42px] flex items-center justify-center text-[16px] text-[#444]">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-[42px] h-[42px] rounded-full text-[16px] font-medium transition-colors ${
                    page === p ? "bg-[#1a1a1a] text-white" : "text-[#333] hover:bg-[#f0f0f0]"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-2 text-[15px] text-[#444] disabled:opacity-40 hover:text-black"
            >
              Next <ChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
