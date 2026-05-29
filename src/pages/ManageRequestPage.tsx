import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import {
  fetchPendingRequests,
  fetchSentRequests,
  acceptRequest,
  rejectOrCancelRequest,
  type PendingRequest,
  type SentRequest,
} from "../services/communityService";

function Avatar({ url, name, size = 64 }: { url?: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (url) {
    return (
      <img src={url} alt={name} style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-gradient-to-br from-[#84081F] to-[#A95BFD] flex items-center justify-center text-white font-bold shrink-0">
      {initials || "?"}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className}`} />;
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function ManageRequestPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<"received" | "sent">("received");

  const [received, setReceived] = useState<PendingRequest[]>([]);
  const [sent, setSent] = useState<SentRequest[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);

  useEffect(() => {
    fetchPendingRequests()
      .then((r) => setReceived(r.requests))
      .catch(() => {})
      .finally(() => setLoadingReceived(false));

    fetchSentRequests()
      .then((r) => setSent(r.requests))
      .catch(() => {})
      .finally(() => setLoadingSent(false));
  }, []);

  async function handleAccept(req: PendingRequest) {
    try {
      await acceptRequest(req.request_id);
      setReceived((prev) => prev.filter((r) => r.request_id !== req.request_id));
    } catch { /* keep list */ }
  }

  async function handleReject(req: PendingRequest) {
    try {
      await rejectOrCancelRequest(req.request_id);
      setReceived((prev) => prev.filter((r) => r.request_id !== req.request_id));
    } catch { /* keep list */ }
  }

  async function handleWithdraw(req: SentRequest) {
    try {
      await rejectOrCancelRequest(req.request_id);
      setSent((prev) => prev.filter((r) => r.request_id !== req.request_id));
    } catch { /* keep list */ }
  }

  const loading = tab === "received" ? loadingReceived : loadingSent;

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
            <h1 className="text-[#18191c] text-[24px] font-normal">Manage requests</h1>
          </div>

          <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">

            {/* Tabs */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-0">
              <button
                onClick={() => setTab("received")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab === "received"
                    ? "bg-[#f77f00] text-white"
                    : "border border-[#f77f00] text-[#f77f00] hover:bg-[#fff6ed]"
                }`}
              >
                Received {!loadingReceived && received.length > 0 && `(${received.length})`}
              </button>
              <button
                onClick={() => setTab("sent")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab === "sent"
                    ? "bg-[#f77f00] text-white"
                    : "border border-[#f77f00] text-[#f77f00] hover:bg-[#fff6ed]"
                }`}
              >
                Sent {!loadingSent && sent.length > 0 && `(${sent.length})`}
              </button>
            </div>

            <div className="h-px bg-[#f2f2f3] mt-4" />

            {/* List */}
            <div className="divide-y divide-[#f2f2f3]">
              {loading && (
                <>
                  {[0, 1, 2].map((i) => (
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

              {!loading && tab === "received" && received.map((r) => (
                <div key={r.request_id} className="flex items-center gap-4 px-6 py-4">
                  <button onClick={() => navigate(`/profile/${r.id}`)} className="shrink-0 focus:outline-none">
                    <Avatar url={r.avatar_url} name={r.name} size={64} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate(`/profile/${r.id}`)} className="text-[#18191c] text-base font-semibold hover:text-[#f77f00] transition-colors text-left">
                      {r.name}
                    </button>
                    {r.title && <p className="text-[#9199a3] text-sm">{r.title}</p>}
                    {r.company && <p className="text-[#9199a3] text-sm">{r.company}</p>}
                    <p className="text-[#18191c] text-sm font-semibold mt-0.5">{formatTime(r.requested_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleReject(r)}
                      className="text-[#9199a3] text-sm font-medium hover:text-[#474d57] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAccept(r)}
                      className="px-5 py-1.5 rounded-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold hover:bg-[#fff6ed] transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}

              {!loading && tab === "sent" && sent.map((r) => (
                <div key={r.request_id} className="flex items-center gap-4 px-6 py-4">
                  <button onClick={() => navigate(`/profile/${r.id}`)} className="shrink-0 focus:outline-none">
                    <Avatar url={r.avatar_url} name={r.name} size={64} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate(`/profile/${r.id}`)} className="text-[#18191c] text-base font-semibold hover:text-[#f77f00] transition-colors text-left">
                      {r.name}
                    </button>
                    {r.title && <p className="text-[#9199a3] text-sm">{r.title}</p>}
                    {r.company && <p className="text-[#9199a3] text-sm">{r.company}</p>}
                    <p className="text-[#9199a3] text-sm mt-0.5">Sent {formatTime(r.sent_at)}</p>
                  </div>
                  <button
                    onClick={() => handleWithdraw(r)}
                    className="text-[#f77f00] text-sm font-semibold hover:text-[#e06800] transition-colors shrink-0"
                  >
                    Withdraw
                  </button>
                </div>
              ))}

              {!loading && tab === "received" && received.length === 0 && (
                <div className="py-16 text-center text-[#9199a3] text-sm">No pending requests received.</div>
              )}

              {!loading && tab === "sent" && sent.length === 0 && (
                <div className="py-16 text-center text-[#9199a3] text-sm">No pending requests sent.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
