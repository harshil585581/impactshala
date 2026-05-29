import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import {
  fetchPendingRequests,
  fetchSuggestions,
  fetchConnections,
  acceptRequest,
  rejectOrCancelRequest,
  sendConnectionRequest,
  type PendingRequest,
  type CommunityUser,
} from "../services/communityService";

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 64 }: { url?: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (url) {
    return (
      <img src={url} alt={name} style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 border-2 border-white" />
    );
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-gradient-to-br from-[#84081F] to-[#A95BFD] flex items-center justify-center text-white font-bold shrink-0 border-2 border-white">
      {initials || "?"}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className}`} />;
}

// ─── Person card ──────────────────────────────────────────────────────────────

type CardState = "idle" | "loading" | "sent";

function PersonCard({
  person,
  onSend,
  onViewProfile,
}: {
  person: CommunityUser;
  onSend: (id: string) => Promise<void>;
  onViewProfile: (id: string) => void;
}) {
  const [state, setState] = useState<CardState>("idle");

  async function handleAdd() {
    if (state !== "idle") return;
    setState("loading");
    try {
      await onSend(person.id);
      setState("sent");
    } catch {
      setState("idle");
    }
  }

  const subtitle = [person.title, person.company].filter(Boolean).join(" • ");

  return (
    <div className="bg-white rounded-2xl border border-[#f0f0f0] flex flex-col overflow-hidden shadow-sm">
      {/* Cover banner */}
      <button
        onClick={() => onViewProfile(person.id)}
        className="h-[80px] shrink-0 overflow-hidden focus:outline-none"
      >
        {person.cover_url ? (
          <img src={person.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(135deg, #84081F 0%, #A95BFD 100%)" }}
          />
        )}
      </button>

      {/* Avatar overlapping banner */}
      <button
        onClick={() => onViewProfile(person.id)}
        className="flex justify-center -mt-11 mb-2 relative z-10 focus:outline-none"
      >
        <Avatar url={person.avatar_url} name={person.name} size={88} />
      </button>

      {/* Info */}
      <div className="px-4 pb-4 flex flex-col items-center flex-1">
        {/* Fixed-height area keeps stats aligned across all cards in a row */}
        <div className="w-full flex flex-col items-center min-h-[48px]">
          <button
            onClick={() => onViewProfile(person.id)}
            className="text-[#18191c] text-base font-bold text-center leading-snug line-clamp-1 hover:text-[#f77f00] transition-colors"
          >
            {person.name}
          </button>
          {subtitle && (
            <p className="text-[#9199a3] text-xs text-center mt-0.5 line-clamp-2 leading-snug">{subtitle}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex w-full border-t border-[#e5e7eb] mt-3 pt-3 pb-1">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[#f77f00] text-sm font-bold leading-none">
              {person.endorsement_count ?? 0}
            </span>
            <span className="text-[#9199a3] text-[10px] text-center leading-none">Endorsements</span>
          </div>
          <div className="w-px bg-[#e5e7eb] self-stretch" />
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[#f77f00] text-sm font-bold leading-none">
              {person.review_count ?? 0}
            </span>
            <span className="text-[#9199a3] text-[10px] text-center leading-none">Reviews</span>
          </div>
          <div className="w-px bg-[#e5e7eb] self-stretch" />
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[#f77f00] text-sm font-bold leading-none">
              {person.achievement_count ?? 0}
            </span>
            <span className="text-[#9199a3] text-[10px] text-center leading-none">Achievement</span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleAdd}
          disabled={state !== "idle"}
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold border transition-colors mt-3 ${
            state === "sent"
              ? "border-[#d1d5db] text-[#9199a3] cursor-default"
              : state === "loading"
              ? "border-[#f77f00] text-[#f77f00] opacity-60 cursor-wait"
              : "border-[#f77f00] text-[#f77f00] hover:bg-[#fff6ed]"
          }`}
        >
          {state === "loading" ? (
            "Sending…"
          ) : state === "sent" ? (
            "Request sent"
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Add to community
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  actionLabel = "Manage",
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[#18191c] text-[20px] font-normal">{title}</h2>
        {onAction && (
          <button
            onClick={onAction}
            className="text-[#f77f00] text-sm font-semibold px-4 py-1.5 rounded-full border border-[#f77f00] hover:bg-[#fff6ed] transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
      <div className="h-px bg-[#f2f2f3]" />
      {children}
    </div>
  );
}

// ─── Suggestion grid ──────────────────────────────────────────────────────────

function SuggestionGrid({
  people,
  onSend,
  onViewProfile,
}: {
  people: CommunityUser[];
  onSend: (id: string) => Promise<void>;
  onViewProfile: (id: string) => void;
}) {
  return (
    <div className="px-4 pb-5 pt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {people.map((p) => (
        <PersonCard key={p.id} person={p} onSend={onSend} onViewProfile={onViewProfile} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyCommunityPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [totalConnections, setTotalConnections] = useState(0);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<CommunityUser[]>([]);

  const [loadingTotal, setLoadingTotal] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    fetchConnections()
      .then((r) => setTotalConnections(r.total))
      .catch(() => {})
      .finally(() => setLoadingTotal(false));

    fetchPendingRequests()
      .then((r) => setPending(r.requests))
      .catch(() => {})
      .finally(() => setLoadingPending(false));

    fetchSuggestions()
      .then((r) => setSuggestions(r.suggestions))
      .catch(() => {})
      .finally(() => setLoadingSuggestions(false));
  }, []);

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }

  async function handleAccept(req: PendingRequest) {
    try {
      await acceptRequest(req.request_id);
      setPending((prev) => prev.filter((r) => r.request_id !== req.request_id));
      setTotalConnections((n) => n + 1);
      setSuggestions((prev) => prev.filter((s) => s.id !== req.id));
    } catch { /* keep UI */ }
  }

  async function handleCancel(req: PendingRequest) {
    try {
      await rejectOrCancelRequest(req.request_id);
      setPending((prev) => prev.filter((r) => r.request_id !== req.request_id));
    } catch { /* keep UI */ }
  }

  async function handleSendRequest(userId: string) {
    await sendConnectionRequest(userId);
  }

  function viewProfile(userId: string) {
    navigate(`/profile/${userId}`);
  }

  // Split suggestions into two groups for the two sections
  const primarySuggestions = suggestions.slice(0, 8);
  const moreSuggestions = suggestions.slice(8);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

          <h1 className="text-[#18191c] text-[24px] font-normal">Manage my community</h1>

          {/* My Community count */}
          <Section
            title={`My Community${loadingTotal ? "" : ` (${totalConnections})`}`}
            actionLabel="Manage"
            onAction={() => navigate("/community/manage")}
          >
            <div className="px-5 py-4 text-sm text-[#9199a3]">
              {loadingTotal ? (
                <Skeleton className="h-4 w-32" />
              ) : totalConnections === 0 ? (
                "You have no connections yet. Start adding people below."
              ) : (
                <>
                  You have {totalConnections} connection{totalConnections !== 1 ? "s" : ""}.{" "}
                  <button onClick={() => navigate("/community/manage")} className="text-[#f77f00] font-medium hover:underline">
                    View all
                  </button>
                </>
              )}
            </div>
          </Section>

          {/* Pending requests section */}
          {loadingPending && (
            <div className="bg-white rounded-2xl border border-[#f2f2f3] px-5 py-5 flex flex-col gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingPending && pending.length > 0 && (
            <Section
              title={`${pending.length} pending request${pending.length > 1 ? "s" : ""}`}
              actionLabel="Manage"
              onAction={() => navigate("/community/requests")}
            >
              <div className="divide-y divide-[#f2f2f3]">
                {pending.map((req) => (
                  <div key={req.request_id} className="flex items-center gap-4 px-5 py-4">
                    <button onClick={() => viewProfile(req.id)} className="shrink-0 focus:outline-none">
                      <Avatar url={req.avatar_url} name={req.name} size={56} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => viewProfile(req.id)}
                        className="text-[#18191c] text-base font-semibold hover:text-[#f77f00] transition-colors text-left"
                      >
                        {req.name}
                      </button>
                      {req.title && <p className="text-[#9199a3] text-sm leading-tight">{req.title}</p>}
                      {req.company && <p className="text-[#9199a3] text-sm leading-tight">{req.company}</p>}
                      <p className="text-[#18191c] text-sm font-semibold mt-0.5">{formatTime(req.requested_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleCancel(req)}
                        className="text-[#9199a3] text-sm font-medium hover:text-[#474d57] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAccept(req)}
                        className="px-5 py-1.5 rounded-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold hover:bg-[#fff6ed] transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* People you may know */}
          <Section
            title="People you may know"
            actionLabel="Show all"
            onAction={() => navigate("/community/requests")}
          >
            {loadingSuggestions ? (
              <div className="px-4 pb-5 pt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[220px] rounded-2xl" />
                ))}
              </div>
            ) : primarySuggestions.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#9199a3]">
                No suggestions right now. Invite more people to join.
              </p>
            ) : (
              <SuggestionGrid
                people={primarySuggestions}
                onSend={handleSendRequest}
                onViewProfile={viewProfile}
              />
            )}
          </Section>

          {/* More suggestions for you */}
          {!loadingSuggestions && moreSuggestions.length > 0 && (
            <Section
              title="More Suggestion for you"
              actionLabel="Show all"
              onAction={() => navigate("/community/requests")}
            >
              <SuggestionGrid
                people={moreSuggestions}
                onSend={handleSendRequest}
                onViewProfile={viewProfile}
              />
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}
