import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchClientRequests,
  fetchClientRequestDetail,
  updateClientRequestStatus,
  deleteClientRequest,
  type ClientInquiry,
  type ClientInquiryDetail,
  type ClientRequestStats,
} from "../../services/adminService";

const PER_PAGE = 8;
type Tab = "open" | "closed" | "cancelled";

const TAB_LABELS: Record<Tab, string> = {
  open: "Open Requests",
  closed: "Closed Requests",
  cancelled: "Cancelled",
};

const EMPTY_STATS: ClientRequestStats = { total: 0, open: 0, closed: 0, cancelled: 0 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function inquiryDisplayName(inq: ClientInquiry | ClientInquiryDetail) {
  if (inq.user) {
    if (inq.user.user_type === "organization") return inq.user.org_name || inq.name;
    const full = [inq.user.first_name, inq.user.last_name].filter(Boolean).join(" ");
    return full || inq.name;
  }
  return inq.name;
}

function paginationPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

// ── Small icon components ─────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#848484" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[13px] font-semibold text-[#686868] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[15px] text-[#18191c] leading-relaxed">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    open:      { bg: "bg-green-50",  text: "text-green-700",  label: "Open" },
    closed:    { bg: "bg-blue-50",   text: "text-blue-700",   label: "Closed" },
    cancelled: { bg: "bg-red-50",    text: "text-red-600",    label: "Cancelled" },
  };
  const c = cfg[status] ?? cfg.open;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

interface DetailPanelProps {
  inquiryId: string;
  onClose: () => void;
  onStatusChange: (id: string, status: "open" | "closed" | "cancelled") => void;
}

function DetailPanel({ inquiryId, onClose, onStatusChange }: DetailPanelProps) {
  const [detail, setDetail] = useState<ClientInquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchClientRequestDetail(inquiryId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [inquiryId]);

  async function changeStatus(status: "open" | "closed" | "cancelled") {
    if (!detail || updating) return;
    setUpdating(true);
    try {
      await updateClientRequestStatus(detail.id, status);
      setDetail((prev) => prev ? { ...prev, status } : prev);
      onStatusChange(detail.id, status);
    } finally {
      setUpdating(false);
    }
  }

  const name = detail ? inquiryDisplayName(detail) : "";

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative bg-white h-full w-full max-w-[560px] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0]">
          <h2 className="text-[22px] font-semibold text-black" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            Request Details
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors text-[#555]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#aaa] animate-pulse">
            Loading…
          </div>
        ) : !detail ? (
          <div className="flex-1 flex items-center justify-center text-[#aaa]">
            Not found.
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="flex-1 px-6 py-6 space-y-6">
              {/* Profile row */}
              <div className="flex items-center gap-4">
                <Avatar url={detail.user?.avatar_url ?? null} name={name} />
                <div>
                  <p className="text-[20px] font-semibold text-black" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>{name}</p>
                  <p className="text-[14px] text-[#686868]">{detail.email}</p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={detail.status} />
                </div>
              </div>

              <hr className="border-[#f0f0f0]" />

              {/* Inquiry info */}
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Category" value={detail.category} />
                <DetailField label="Urgency" value={detail.urgency} />
                <DetailField label="Timeline" value={detail.timeline} />
                <DetailField label="Budget Range" value={detail.budget} />
              </div>

              {detail.requirements && (
                <div>
                  <p className="text-[13px] font-semibold text-[#686868] uppercase tracking-wide mb-1">Requirements</p>
                  <p className="text-[15px] text-[#18191c] leading-relaxed whitespace-pre-wrap">{detail.requirements}</p>
                </div>
              )}

              {detail.additional_details && (
                <div>
                  <p className="text-[13px] font-semibold text-[#686868] uppercase tracking-wide mb-1">Additional Details</p>
                  <div
                    className="text-[15px] text-[#18191c] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: detail.additional_details }}
                  />
                </div>
              )}

              <hr className="border-[#f0f0f0]" />

              {/* Contact info */}
              <div>
                <p className="text-[13px] font-semibold text-[#686868] uppercase tracking-wide mb-3">Contact Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Name" value={detail.name} />
                  <DetailField label="Email" value={detail.email} />
                  {detail.phone && <DetailField label="Phone" value={detail.phone} />}
                  {detail.best_time && <DetailField label="Best Time to Reach" value={detail.best_time} />}
                  <DetailField label="Preferred Method" value={detail.contact_method === "phone" ? "Phone Call" : "Email"} />
                </div>
              </div>

              <DetailField
                label="Submitted"
                value={new Date(detail.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            </div>

            {/* Action footer */}
            <div className="px-6 py-5 border-t border-[#f0f0f0] flex flex-col gap-3">
              <p className="text-[13px] font-semibold text-[#686868] uppercase tracking-wide">Update Status</p>
              <div className="flex gap-3 flex-wrap">
                {detail.status !== "open" && (
                  <button
                    onClick={() => changeStatus("open")}
                    disabled={updating}
                    className="flex-1 py-3 rounded-full border border-[#d6ddeb] text-[15px] font-semibold text-[#333] hover:bg-[#f5f5f5] disabled:opacity-50 transition-colors"
                  >
                    Reopen
                  </button>
                )}
                {detail.status !== "closed" && (
                  <button
                    onClick={() => changeStatus("closed")}
                    disabled={updating}
                    className="flex-1 py-3 rounded-full bg-[#1a1a1a] text-white text-[15px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors"
                  >
                    {updating ? "Saving…" : "Mark as Closed"}
                  </button>
                )}
                {detail.status !== "cancelled" && (
                  <button
                    onClick={() => changeStatus("cancelled")}
                    disabled={updating}
                    className="flex-1 py-3 rounded-full bg-red-500 text-white text-[15px] font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {updating ? "Saving…" : "Mark as Cancelled"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function ClientRequestsView() {
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inquiries, setInquiries] = useState<ClientInquiry[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [stats, setStats] = useState<ClientRequestStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((p: number, t: Tab, s: string) => {
    setLoading(true);
    setError(null);
    fetchClientRequests(p, PER_PAGE, t, s)
      .then((res) => {
        setInquiries(res.inquiries);
        setListTotal(res.total);
        setStats(res.stats);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load requests.");
        setInquiries([]);
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

  function handleStatusChange(id: string, status: "open" | "closed" | "cancelled") {
    // If item moved out of current tab, remove it from the list
    if (status !== tab) {
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      setListTotal((t) => Math.max(0, t - 1));
      setStats((s) => {
        const updated = { ...s };
        const oldTab = inquiries.find((i) => i.id === id)?.status as Tab | undefined;
        if (oldTab && oldTab in updated) updated[oldTab] = Math.max(0, updated[oldTab] - 1);
        updated[status] = (updated[status] ?? 0) + 1;
        return updated;
      });
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteClientRequest(id);
      load(page, tab, search);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(listTotal / PER_PAGE));
  const pages = paginationPages(page, totalPages);
  const font: React.CSSProperties = { fontFamily: "'Be Vietnam Pro', sans-serif" };

  return (
    <div>
      {/* Detail panel */}
      {detailId && (
        <DetailPanel
          inquiryId={detailId}
          onClose={() => setDetailId(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[30px] font-semibold text-black" style={font}>Welcome back, Admin</h1>
        <p className="text-[25px] text-[#575555] font-medium" style={font}>
          Here's what's happening on the platform today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(
          [
            { label: "Total requests", value: stats.total },
            { label: "Open requests",  value: stats.open },
            { label: "Closed requests", value: stats.closed },
            { label: "Cancelled",      value: stats.cancelled },
          ] as const
        ).map((card) => (
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
          {(["open", "closed", "cancelled"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-8 py-4 text-[26px] font-medium relative ${active ? "text-[#f77f00]" : "text-black"}`}
                style={font}
              >
                {TAB_LABELS[t]}
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
              placeholder="Search requests...."
              className="flex-1 text-[22px] text-[#686868] font-medium bg-transparent outline-none"
              style={font}
            />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2fr_2fr_1.2fr_1fr] bg-[#ffd396] px-6 py-4">
          {["Profile", "Category", "Status", "Actions"].map((col) => (
            <span key={col} className="text-[20px] font-semibold text-black" style={font}>{col}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-[3px] border-[#f77f00] border-t-transparent rounded-full animate-spin" />
            <span className="text-[16px] text-[#aaa]">Loading requests…</span>
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
        ) : inquiries.length === 0 ? (
          <div className="py-20 flex items-center justify-center text-[#aaa]">No requests found.</div>
        ) : (
          inquiries.map((inq) => {
            const name = inquiryDisplayName(inq);
            return (
              <div
                key={inq.id}
                className="grid grid-cols-[2fr_2fr_1.2fr_1fr] px-6 py-4 border-b border-[#f0f0f0] items-center hover:bg-[#fafafa] transition-colors cursor-pointer"
                onClick={() => setDetailId(inq.id)}
              >
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <Avatar url={inq.user?.avatar_url ?? null} name={name} />
                  <div className="min-w-0">
                    <p className="text-[21px] font-semibold text-black truncate" style={font}>{name}</p>
                    <p className="text-[15px] text-[#555454] font-medium truncate" style={font}>{inq.email}</p>
                  </div>
                </div>

                {/* Category */}
                <span className="text-[17px] text-black font-medium" style={font}>{inq.category}</span>

                {/* Status */}
                <div onClick={(e) => e.stopPropagation()}>
                  <StatusBadge status={inq.status} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setDetailId(inq.id)}
                    className="w-10 h-10 rounded-full border border-[#d6ddeb] flex items-center justify-center text-[#555] hover:bg-[#f5f5f5] transition-colors"
                    title="View details"
                  >
                    <EyeIcon />
                  </button>

                  {confirmId === inq.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(inq.id)}
                        disabled={deletingId === inq.id}
                        className="text-[12px] px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        {deletingId === inq.id ? "…" : "Yes"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-[12px] px-2 py-1 border border-[#d6ddeb] rounded-lg hover:bg-[#f5f5f5]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(inq.id)}
                      className="w-10 h-10 rounded-full border border-[#d6ddeb] flex items-center justify-center text-[#555] hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
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
