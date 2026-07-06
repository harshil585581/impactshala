import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { fetchBlockedUsers, unblockUser } from "../../services/blockService";
import { fetchMyProfile, saveProfile, deleteAccount, deactivateAccount, changePassword } from "../../services/accountService";
import { supabase } from "../../lib/supabase";
import { getFreshToken } from "../../lib/authToken";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function sessionAuthHeaders(): Promise<Record<string, string>> {
  const token = await getFreshToken();
  return { Authorization: `Bearer ${token}` };
}

type MentionPermission = "everyone" | "manual" | "none";

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="#262626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RadioCircle({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? "border-[#f77f00] bg-[#f77f00]" : "border-[#d0d0d0] bg-white"
      }`}
    >
      {checked && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
    </div>
  );
}

function MentionsContent() {
  const [mentionPermission, setMentionPermission] = useState<MentionPermission>("everyone");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        if (p.mention_permission) setMentionPermission(p.mention_permission as MentionPermission);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    await saveProfile({ mention_permission: mentionPermission }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const labels: Record<MentionPermission, string> = {
    everyone: "Everyone on Impactshaala",
    manual: "Manually approve mentions",
    none: "Don't allow mentions",
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#d7d7d7] rounded-[15px] flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-6 border-b border-[#e0e0e0]">
        <h2 className="text-[#262626] text-xl font-semibold mb-1">Mentions</h2>
        <p className="text-[#5e6670] text-sm">Allow others to mention you in content posted on Impactshaala?</p>
      </div>
      <div className="px-8 py-6">
        <div className="flex flex-col gap-4">
          {(["everyone", "manual", "none"] as MentionPermission[]).map((val) => (
            <button
              key={val}
              onClick={() => setMentionPermission(val)}
              className="flex items-center gap-4 py-3 text-left"
            >
              <RadioCircle checked={mentionPermission === val} />
              <span className={`text-base transition-colors ${mentionPermission === val ? "text-[#f77f00] font-medium" : "text-[#262626]"}`}>
                {labels[val]}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#f77f00] text-white text-sm font-semibold rounded-full px-6 py-2.5 hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

type BlockedView = "overview" | "blocked-users" | "blocked-orgs";

interface BlockedEntry {
  id: string;
  name: string;
}


function BlockedListView({
  title,
  entityLabel,
  items,
  onUnblock,
  onBack,
}: {
  title: string;
  entityLabel: string;
  items: BlockedEntry[];
  onUnblock: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 pt-6 pb-4">
        <h2 className="text-[#18191c] text-xl font-semibold">{title}</h2>
        <p className="text-[#575555] text-sm mt-1">
          You've currently blocked {items.length} {entityLabel}{items.length !== 1 ? "s" : ""}.
        </p>
      </div>
      {items.length === 0 ? (
        <div className="px-8 py-10 text-center">
          <p className="text-[#9199a3] text-sm">No blocked {entityLabel}s yet.</p>
        </div>
      ) : (
        <div>
          {items.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#f1f2f4] flex items-center justify-center shrink-0">
                    <span className="text-[#7c8493] text-sm font-semibold">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[#262626] text-base font-medium">{item.name}</span>
                </div>
                <button
                  onClick={() => onUnblock(item.id)}
                  className="text-[#f77f00] text-sm font-medium hover:text-[#e06800] transition-colors"
                >
                  unblock
                </button>
              </div>
              {idx < items.length - 1 && <div className="h-px bg-[#e0e0e0] mx-8" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockedAccountsContent() {
  const [view, setView] = useState<BlockedView>("overview");
  const [blockedUsers, setBlockedUsers] = useState<BlockedEntry[]>([]);
  const [blockedOrgs, setBlockedOrgs] = useState<BlockedEntry[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);

  const loadBlocked = useCallback(async () => {
    setLoadingBlocked(true);
    try {
      const all = await fetchBlockedUsers();
      setBlockedUsers(all.filter((u) => u.user_type !== "organization").map((u) => ({ id: u.id, name: u.name })));
      setBlockedOrgs(all.filter((u) => u.user_type === "organization").map((u) => ({ id: u.id, name: u.name })));
    } catch {}
    finally { setLoadingBlocked(false); }
  }, []);

  useEffect(() => { loadBlocked(); }, [loadBlocked]);

  async function handleUnblockUser(id: string) {
    try { await unblockUser(id); } catch {}
    setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleUnblockOrg(id: string) {
    try { await unblockUser(id); } catch {}
    setBlockedOrgs((prev) => prev.filter((o) => o.id !== id));
  }

  if (loadingBlocked) {
    return (
      <div className="bg-white border border-[#d7d7d7] rounded-[15px] flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view === "blocked-users") {
    return (
      <BlockedListView
        title="Blocked Users"
        entityLabel="user"
        items={blockedUsers}
        onUnblock={handleUnblockUser}
        onBack={() => setView("overview")}
      />
    );
  }

  if (view === "blocked-orgs") {
    return (
      <BlockedListView
        title="Blocked Organisations"
        entityLabel="organisation"
        items={blockedOrgs}
        onUnblock={handleUnblockOrg}
        onBack={() => setView("overview")}
      />
    );
  }

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-6 border-b border-[#e0e0e0]">
        <h2 className="text-[#18191c] text-xl font-semibold">Manage Accounts</h2>
      </div>
      <button
        onClick={() => setView("blocked-users")}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-[#fafafa] transition-colors border-b border-[#e0e0e0]"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#262626] text-base font-medium">Blocked Users</span>
          {blockedUsers.length > 0 && (
            <span className="bg-[#ffeacc] text-[#f77f00] text-xs font-semibold px-2 py-0.5 rounded-full">
              {blockedUsers.length}
            </span>
          )}
        </div>
        <ChevronRight />
      </button>
      <button
        onClick={() => setView("blocked-orgs")}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-[#fafafa] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#262626] text-base font-medium">Blocked Organisations</span>
          {blockedOrgs.length > 0 && (
            <span className="bg-[#ffeacc] text-[#f77f00] text-xs font-semibold px-2 py-0.5 rounded-full">
              {blockedOrgs.length}
            </span>
          )}
        </div>
        <ChevronRight />
      </button>
    </div>
  );
}

// ─── Accounts & Privacy ───────────────────────────────────────────────────────

type PrivacyView = "overview" | "my-community" | "review" | "security-check" | "account-status" | "login-recover";
type CommunityVisibility = "everyone" | "starred" | "community-only";

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SquareCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-6 h-6 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? "border-[#f77f00] bg-[#f77f00]" : "border-[#c7c7c7] bg-white"
      }`}
    >
      {checked && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function MyCommunityView({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<CommunityVisibility>("everyone");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        if (p.community_visibility) setSelected(p.community_visibility as CommunityVisibility);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    await saveProfile({ community_visibility: selected }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const options: { value: CommunityVisibility; label: string }[] = [
    { value: "everyone", label: "Everyone on Impactshaala" },
    { value: "starred", label: "Starred Members" },
    { value: "community-only", label: "Your community only" },
  ];

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-6">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">My Community</h2>
        <p className="text-[#575555] text-sm mb-7">Select who can view your community list.</p>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className="flex items-center gap-4 text-left"
              >
                <RadioCircle checked={selected === opt.value} />
                <span className={`text-base transition-colors ${selected === opt.value ? "text-[#f77f00] font-medium" : "text-[#575555]"}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-8 flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#f77f00] text-white text-sm font-semibold rounded-full px-6 py-2.5 hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ReviewVisibility = "everyone" | "community-only";

function ReviewView({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<ReviewVisibility[]>(["everyone"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        if (p.review_permission && p.review_permission.length > 0) {
          setSelected(p.review_permission as ReviewVisibility[]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggle(val: ReviewVisibility) {
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  async function handleSave() {
    setSaving(true);
    await saveProfile({ review_permission: selected }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const options: { value: ReviewVisibility; label: string }[] = [
    { value: "everyone", label: "Everyone on Impactshaala" },
    { value: "community-only", label: "Your community only" },
  ];

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-6">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Review</h2>
        <p className="text-[#575555] text-sm mb-7">Select who can give you a review.</p>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-4 cursor-pointer select-none">
                <SquareCheckbox
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
                <span className="text-[#575555] text-base">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
        <div className="mt-8 flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#f77f00] text-white text-sm font-semibold rounded-full px-6 py-2.5 hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Security Check sub-views ─────────────────────────────────────────────────

type SecurityCheckSubView = "overview" | "where-logged-in" | "log-in-alerts";
type LogInAlertChannel = "sms" | "email";

interface SessionEntry {
  id: string;
  ip_address: string;
  browser: string;
  os: string;
  location: string;
  created_at: string;
  last_seen_at: string;
}

function formatSessionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function WhereLoggedInView({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);

  const currentSessionId = (() => {
    try { return JSON.parse(localStorage.getItem("user") ?? "{}").session_id ?? ""; }
    catch { return ""; }
  })();

  useEffect(() => {
    sessionAuthHeaders().then(headers =>
      fetch(`${API_URL}/api/sessions`, { headers })
        .then(r => r.ok ? r.json() : { sessions: [] })
        .then(d => setSessions(d.sessions ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    );
  }, []);

  async function handleRemove(id: string) {
    setRemovingId(id);
    const headers = await sessionAuthHeaders();
    await fetch(`${API_URL}/api/sessions/${id}`, { method: "DELETE", headers }).catch(() => {});
    setSessions(prev => prev.filter(s => s.id !== id));
    setRemovingId(null);
    if (id === currentSessionId) {
      localStorage.removeItem("user");
      await supabase.auth.signOut();
      navigate("/");
    }
  }

  async function handleRemoveAll() {
    if (!confirm("Sign out of all devices? You will be logged out here too.")) return;
    setRemovingAll(true);
    const headers = await sessionAuthHeaders();
    await fetch(`${API_URL}/api/sessions`, { method: "DELETE", headers }).catch(() => {});
    localStorage.removeItem("user");
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#18191c] text-xl font-semibold">Active Sessions</h2>
          {sessions.length > 1 && (
            <button
              onClick={handleRemoveAll}
              disabled={removingAll}
              className="text-red-500 text-sm font-medium hover:text-red-700 transition-colors disabled:opacity-50"
            >
              Sign out of all devices
            </button>
          )}
        </div>

        <div className="bg-[#ebebeb] border border-[#d6d6d6] rounded-[11px] px-4 py-3 mb-6">
          <p className="text-[#575555] text-sm leading-relaxed">
            Locations are estimated from IP addresses and may not be exact. Use this as a rough guide only.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-[#9199a3] text-sm text-center py-8">No sessions found.</p>
        ) : (
          <>
            <p className="text-[#18191c] text-base font-medium mb-4">
              You're signed in on {sessions.length} device{sessions.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-col gap-4">
              {sessions.map(session => {
                const isCurrent = session.id === currentSessionId;
                return (
                  <div key={session.id} className={`border rounded-[12px] p-4 ${isCurrent ? "border-[#f77f00] bg-[#fff8ee]" : "border-[#e0e0e0]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Device icon */}
                        <div className="mt-0.5 w-9 h-9 rounded-full bg-[#f1f2f4] flex items-center justify-center shrink-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="3" width="20" height="14" rx="2" stroke="#7c8493" strokeWidth="1.5"/>
                            <path d="M8 21h8M12 17v4" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[#18191c] text-sm font-semibold">
                              {session.browser} on {session.os}
                            </p>
                            {isCurrent && (
                              <span className="bg-[#f77f00] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          {session.location && (
                            <p className="text-[#575555] text-xs mt-0.5">{session.location}</p>
                          )}
                          {session.ip_address && (
                            <p className="text-[#9199a3] text-xs mt-0.5">IP: {session.ip_address}</p>
                          )}
                          <p className="text-[#9199a3] text-xs mt-0.5">
                            Signed in {formatSessionDate(session.created_at)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(session.id)}
                        disabled={removingId === session.id}
                        className="text-red-500 text-xs font-medium hover:text-red-700 transition-colors disabled:opacity-50 shrink-0 mt-1"
                      >
                        {removingId === session.id ? "Removing…" : isCurrent ? "Sign out" : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LogInAlertsView({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<LogInAlertChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        if (p.login_alert_channels && p.login_alert_channels.length > 0) {
          setSelected(p.login_alert_channels as LogInAlertChannel[]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggle(val: LogInAlertChannel) {
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  async function handleSave() {
    setSaving(true);
    await saveProfile({ login_alert_channels: selected }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const options: { value: LogInAlertChannel; label: string }[] = [
    { value: "sms", label: "Via SMS" },
    { value: "email", label: "Via E-mail" },
  ];

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-6">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Log In Alerts</h2>
        <p className="text-[#575555] text-sm mb-7">Select where to receive log in alerts.</p>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-4 cursor-pointer select-none">
                <SquareCheckbox
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
                <span className="text-[#575555] text-base">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
        <div className="mt-8 flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#f77f00] text-white text-sm font-semibold rounded-full px-6 py-2.5 hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SecurityCheckView({ onBack }: { onBack: () => void }) {
  const [subView, setSubView] = useState<SecurityCheckSubView>("overview");

  if (subView === "where-logged-in") return <WhereLoggedInView onBack={() => setSubView("overview")} />;
  if (subView === "log-in-alerts") return <LogInAlertsView onBack={() => setSubView("overview")} />;

  const items: { label: string; sub: SecurityCheckSubView }[] = [
    { label: "Where you're logged in", sub: "where-logged-in" },
    { label: "Log in alerts", sub: "log-in-alerts" },
  ];

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-6 border-b border-[#e0e0e0]">
        <h2 className="text-[#18191c] text-xl font-semibold">Security Check</h2>
      </div>
      {items.map((item, idx) => (
        <button
          key={item.sub}
          onClick={() => setSubView(item.sub)}
          className={`w-full flex items-center justify-between px-8 py-5 hover:bg-[#fafafa] transition-colors ${
            idx < items.length - 1 ? "border-b border-[#e0e0e0]" : ""
          }`}
        >
          <span className="text-[#262626] text-base font-medium">{item.label}</span>
          <ArrowRight />
        </button>
      ))}
    </div>
  );
}

// ─── Account Status sub-views ─────────────────────────────────────────────────

type AccountStatusSubView = "overview" | "delete-account" | "deactivate-account";
type DeleteAccountStep = "warning" | "reasons" | "password";
type DeleteReason = "duplicate" | "no-value" | "privacy" | "unwanted-content" | "other";

const DELETE_REASONS: { value: DeleteReason; label: string }[] = [
  { value: "duplicate", label: "I have a duplicate account" },
  { value: "no-value", label: "I'm not getting any value from this account" },
  { value: "privacy", label: "I have a privacy concern" },
  { value: "unwanted-content", label: "I'm receiving unwanted content" },
  { value: "other", label: "Other" },
];

function OrangePillButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-[#ffeacc] text-[#f77f00] text-xl font-semibold rounded-full px-10 py-3.5 hover:bg-[#ffdcaa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}

function DeleteAccountView({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<DeleteAccountStep>("warning");
  const [selectedReasons, setSelectedReasons] = useState<DeleteReason[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleReason(val: DeleteReason) {
    setSelectedReasons((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  }

  async function handleDelete() {
    if (!password) {
      setError("Password is required");
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount(password);
      localStorage.removeItem("user");
      await supabase.auth.signOut();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  if (step === "warning") {
    return (
      <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
        <div className="px-8 py-5 border-b border-[#e0e0e0]">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
          >
            <ChevronLeft />
            Back
          </button>
        </div>
        <div className="px-8 py-8">
          <h2 className="text-[#18191c] text-xl font-semibold mb-6">Delete Account</h2>
          <p className="text-[#262626] text-base leading-relaxed mb-2">
            Just a quick reminder, deleting your account means you'll lose touch with all your connections.
          </p>
          <p className="text-[#262626] text-base leading-relaxed mb-10">
            You'll also lose all the information gathered on the platform.
          </p>
          <OrangePillButton label="Continue" onClick={() => setStep("reasons")} />
        </div>
      </div>
    );
  }

  if (step === "reasons") {
    return (
      <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
        <div className="px-8 py-5 border-b border-[#e0e0e0]">
          <button
            onClick={() => setStep("warning")}
            className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
          >
            <ChevronLeft />
            Back
          </button>
        </div>
        <div className="px-8 py-8">
          <h2 className="text-[#18191c] text-xl font-semibold mb-1">Delete Account</h2>
          <p className="text-[#575555] text-base mb-1">User, we're sorry to see you go.</p>
          <p className="text-[#575555] text-sm mb-6">Tell us the reason for closing your account.</p>
          <div className="flex flex-col gap-5 mb-10">
            {DELETE_REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-4 cursor-pointer select-none">
                <SquareCheckbox
                  checked={selectedReasons.includes(r.value)}
                  onChange={() => toggleReason(r.value)}
                />
                <span className="text-[#575555] text-base">{r.label}</span>
              </label>
            ))}
          </div>
          <OrangePillButton label="Continue" onClick={() => setStep("password")} />
        </div>
      </div>
    );
  }

  // step === "password"
  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={() => setStep("reasons")}
          disabled={deleting}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors disabled:opacity-55"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Delete Account</h2>
        <p className="text-[#575555] text-base mb-6">Enter your password to delete this account.</p>
        {error && <p className="text-red-500 text-sm mb-4 font-semibold">{error}</p>}
        <label className="block mb-1 text-[#575555] text-sm font-medium">Password</label>
        <div className="relative mb-8">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={deleting}
            className="w-full border border-[#7d7d7d] rounded-[6px] px-4 py-3 text-base text-[#262626] focus:outline-none focus:border-[#f77f00] pr-12 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={deleting}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8493] hover:text-[#262626] transition-colors disabled:opacity-50"
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
        <OrangePillButton
          label={deleting ? "Deleting..." : "Done"}
          onClick={handleDelete}
          disabled={deleting}
        />
      </div>
    </div>
  );
}

type DeactivateStep = "info" | "reasons" | "password";
type DeactivateReason = "need-break" | "safety" | "privacy" | "unwanted-content" | "other";

const DEACTIVATE_REASONS: { value: DeactivateReason; label: string }[] = [
  { value: "need-break", label: "I need a break" },
  { value: "safety", label: "I have a safety concern" },
  { value: "privacy", label: "I have a privacy concern" },
  { value: "unwanted-content", label: "I'm receiving unwanted content" },
  { value: "other", label: "Other" },
];

function DeactivateAccountView({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<DeactivateStep>("info");
  const [selectedReasons, setSelectedReasons] = useState<DeactivateReason[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleReason(val: DeactivateReason) {
    setSelectedReasons((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  }

  async function handleDeactivate() {
    if (!password) {
      setError("Password is required");
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deactivateAccount(password);
      localStorage.removeItem("user");
      await supabase.auth.signOut();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to deactivate account");
    } finally {
      setDeleting(false);
    }
  }

  const backButton = (onClick: () => void) => (
    <div className="px-8 py-5 border-b border-[#e0e0e0]">
      <button
        onClick={onClick}
        disabled={deleting}
        className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors disabled:opacity-55"
      >
        <ChevronLeft />
        Back
      </button>
    </div>
  );

  if (step === "info") {
    return (
      <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
        {backButton(onBack)}
        <div className="px-8 py-8">
          <h2 className="text-[#18191c] text-xl font-semibold mb-4">Deactivate Account</h2>
          <p className="text-[#262626] text-base leading-relaxed mb-6">
            Deactivating your account deactivates it temporarily. You can reactivate it anytime after 24 hours by logging back in.
          </p>
          <p className="text-[#262626] text-base font-semibold mb-3">
            What happens to your profile and previous activity on Impactshaala
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-2 mb-10">
            <li className="text-[#262626] text-base leading-relaxed">
              Your profile won't be visible to anyone, including your connections.
            </li>
            <li className="text-[#262626] text-base leading-relaxed">
              Your previous activity will remain intact, but your profile photo and name will be removed from it.
            </li>
            <li className="text-[#262626] text-base leading-relaxed">
              Others won't be able to find or message you.
            </li>
          </ul>
          <OrangePillButton label="Continue" onClick={() => setStep("reasons")} />
        </div>
      </div>
    );
  }

  if (step === "reasons") {
    return (
      <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
        {backButton(() => setStep("info"))}
        <div className="px-8 py-8">
          <h2 className="text-[#18191c] text-xl font-semibold mb-1">Deactivate account</h2>
          <p className="text-[#575555] text-base mb-1">Everyone needs a break once in a while.</p>
          <p className="text-[#575555] text-sm mb-6">Tell us the reason for deactivating your account.</p>
          <div className="flex flex-col gap-5 mb-10">
            {DEACTIVATE_REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-4 cursor-pointer select-none">
                <SquareCheckbox
                  checked={selectedReasons.includes(r.value)}
                  onChange={() => toggleReason(r.value)}
                />
                <span className="text-[#575555] text-base">{r.label}</span>
              </label>
            ))}
          </div>
          <OrangePillButton label="Continue" onClick={() => setStep("password")} />
        </div>
      </div>
    );
  }

  // step === "password"
  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      {backButton(() => setStep("reasons"))}
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Deactivate Account</h2>
        <p className="text-[#575555] text-base mb-6">Enter your password to deactivate this account.</p>
        {error && <p className="text-red-500 text-sm mb-4 font-semibold">{error}</p>}
        <label className="block mb-1 text-[#575555] text-sm font-medium">Password</label>
        <div className="relative mb-8">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={deleting}
            className="w-full border border-[#7d7d7d] rounded-[6px] px-4 py-3 text-base text-[#262626] focus:outline-none focus:border-[#f77f00] pr-12 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={deleting}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8493] hover:text-[#262626] transition-colors disabled:opacity-50"
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
        <OrangePillButton
          label={deleting ? "Deactivating..." : "Done"}
          onClick={handleDeactivate}
          disabled={deleting}
        />
      </div>
    </div>
  );
}

function AccountStatusView({ onBack }: { onBack: () => void }) {
  const [subView, setSubView] = useState<AccountStatusSubView>("overview");

  if (subView === "delete-account") return <DeleteAccountView onBack={() => setSubView("overview")} />;
  if (subView === "deactivate-account") return <DeactivateAccountView onBack={() => setSubView("overview")} />;

  const items: { label: string; sub: AccountStatusSubView }[] = [
    { label: "Delete Account", sub: "delete-account" },
    { label: "Deactivate Account", sub: "deactivate-account" },
  ];

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-6 border-b border-[#e0e0e0]">
        <h2 className="text-[#18191c] text-xl font-semibold">Account Status</h2>
      </div>
      {items.map((item, idx) => (
        <button
          key={item.sub}
          onClick={() => setSubView(item.sub)}
          className={`w-full flex items-center justify-between px-8 py-5 hover:bg-[#fafafa] transition-colors ${
            idx < items.length - 1 ? "border-b border-[#e0e0e0]" : ""
          }`}
        >
          <span className="text-[#262626] text-base font-medium">{item.label}</span>
          <ArrowRight />
        </button>
      ))}
    </div>
  );
}

// ─── Login & Recovery sub-views ───────────────────────────────────────────────

type LoginRecoverySubView = "overview" | "change-password" | "two-fa";

function ChangePasswordView({ onBack }: { onBack: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [requireAllDevices, setRequireAllDevices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    if (!currentPw) { setError("Please enter your current password."); return; }
    if (newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("New passwords do not match."); return; }
    setSaving(true);
    try {
      await changePassword(currentPw, newPw, requireAllDevices);
      setSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  const EyeIcon = ({ visible }: { visible: boolean }) =>
    visible ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    );

  const PasswordField = ({
    label, value, onChange, show, onToggle, disabled,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void; disabled?: boolean;
  }) => (
    <div className="mb-5">
      <label className="block text-[#575555] text-sm mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full border border-[#7d7d7d] rounded-[6px] px-4 py-3 text-base text-[#262626] focus:outline-none focus:border-[#f77f00] pr-11 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8493] hover:text-[#262626] transition-colors disabled:opacity-50"
        >
          <EyeIcon visible={show} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Change password</h2>
        <p className="text-[#595959] text-sm mb-6">Create a new password that is at least 8 characters long.</p>

        <PasswordField
          label="Type your current password"
          value={currentPw}
          onChange={setCurrentPw}
          show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          disabled={saving}
        />
        <PasswordField
          label="Type your new password"
          value={newPw}
          onChange={setNewPw}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          disabled={saving}
        />
        <PasswordField
          label="Retype your new password"
          value={confirmPw}
          onChange={setConfirmPw}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          disabled={saving}
        />

        <label className="flex items-center gap-3 cursor-pointer select-none mb-6">
          <SquareCheckbox
            checked={requireAllDevices}
            onChange={() => setRequireAllDevices((v) => !v)}
          />
          <span className="text-[#575555] text-sm">Require all devices to sign in with the new password</span>
        </label>

        {error && (
          <p className="text-red-500 text-sm font-medium mb-4">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm font-medium mb-4">Password changed successfully!</p>
        )}

        <OrangePillButton label={saving ? "Saving…" : "Save"} onClick={handleSave} disabled={saving} />

        <div className="mt-4">
          <a
            href="/settings/forgot-password"
            className="text-[#575555] text-sm font-medium hover:text-[#262626] transition-colors"
          >
            Forgot Password
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Two-Factor Authentication ──────────────────────────────────────────────

type TwoFASubView =
  | "intro"
  | "choose-method"
  | "email-add"
  | "email-verify"
  | "phone-add"
  | "phone-verify"
  | "complete-email"
  | "complete-phone";

function TwoFAView({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<TwoFASubView>("intro");
  const [method, setMethod] = useState<"email" | "phone" | null>(null);
  const [contact, setContact] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const cardClass = "bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden";

  function BackRow({ fn }: { fn: () => void }) {
    return (
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={fn}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
    );
  }

  function CodeInput() {
    return (
      <>
        <label className="block text-[#575555] text-sm mb-2">Enter code</label>
        <input
          type="text"
          maxLength={6}
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
          className="w-full border border-[#7d7d7d] rounded-[6px] px-4 py-3 text-base text-[#262626] focus:outline-none focus:border-[#f77f00]"
        />
        <button className="text-[#f77f00] text-sm font-semibold mt-2 mb-8 hover:text-[#e06500] transition-colors block">
          Resend Code
        </button>
      </>
    );
  }

  if (view === "intro") return (
    <div className={cardClass}>
      <BackRow fn={onBack} />
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-2">Two-factor authentication</h2>
        <p className="text-[#595959] text-sm mb-2">Secure your Impactshaala account with two-factor authentication.</p>
        <p className="text-[#575555] text-sm mb-8">This provides additional security by requiring an authentication code whenever you sign in with a new device.</p>
        <OrangePillButton label="Set up" onClick={() => setView("choose-method")} />
      </div>
    </div>
  );

  if (view === "choose-method") return (
    <div className={cardClass}>
      <BackRow fn={() => setView("intro")} />
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Two step verification</h2>
        <p className="text-[#595959] text-sm mb-5">Secure your Impactshaala account with two-step verification.</p>
        <p className="text-[#575555] text-sm font-medium mb-4">Choose your verification method</p>
        <div className="flex flex-col gap-4 mb-8">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <SquareCheckbox checked={method === "email"} onChange={() => setMethod(method === "email" ? null : "email")} />
            <span className="text-[#575555] text-base">E-mail</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <SquareCheckbox checked={method === "phone"} onChange={() => setMethod(method === "phone" ? null : "phone")} />
            <span className="text-[#575555] text-base">Phone number</span>
          </label>
        </div>
        <OrangePillButton label="Continue" onClick={() => {
          if (method === "email") { setContact(""); setView("email-add"); }
          else if (method === "phone") { setContact(""); setView("phone-add"); }
        }} />
      </div>
    </div>
  );

  if (view === "email-add") return (
    <div className={cardClass}>
      <BackRow fn={() => setView("choose-method")} />
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Add your email</h2>
        <p className="text-[#595959] text-sm mb-5">We'll send a verification code to this email account</p>
        <label className="block text-[#575555] text-sm mb-2">Type your email credentials</label>
        <input
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full border border-[#7d7d7d] rounded-[6px] px-4 py-3 text-base text-[#262626] focus:outline-none focus:border-[#f77f00] mb-8"
        />
        <OrangePillButton label="Send code" onClick={() => setView("email-verify")} />
      </div>
    </div>
  );

  if (view === "email-verify") return (
    <div className={cardClass}>
      <BackRow fn={() => setView("email-add")} />
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Enter your verification code</h2>
        <p className="text-[#595959] text-sm mb-5">
          We've sent a verification code to {contact ? contact.replace(/^(.).+(@.+)$/, "$1*****$2") : "**********"}
        </p>
        <CodeInput />
        <OrangePillButton label="Verify" onClick={() => setView("complete-email")} />
      </div>
    </div>
  );

  if (view === "phone-add") return (
    <div className={cardClass}>
      <BackRow fn={() => setView("choose-method")} />
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Add a phone number</h2>
        <p className="text-[#595959] text-sm mb-5">We'll send a verification code to this number</p>
        <label className="block text-[#575555] text-sm mb-2">Type your phone number</label>
        <input
          type="tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full border border-[#7d7d7d] rounded-[6px] px-4 py-3 text-base text-[#262626] focus:outline-none focus:border-[#f77f00] mb-8"
        />
        <OrangePillButton label="Send code" onClick={() => setView("phone-verify")} />
      </div>
    </div>
  );

  if (view === "phone-verify") return (
    <div className={cardClass}>
      <BackRow fn={() => setView("phone-add")} />
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-1">Enter your verification code</h2>
        <p className="text-[#595959] text-sm mb-5">We've sent a verification code to **********</p>
        <CodeInput />
        <OrangePillButton label="Verify" onClick={() => setView("complete-phone")} />
      </div>
    </div>
  );

  const isEmailComplete = view === "complete-email";
  return (
    <div className={cardClass}>
      <BackRow fn={onBack} />
      <div className="px-8 py-8">
        <h2 className="text-[#18191c] text-xl font-semibold mb-6">Two step verification complete</h2>
        <p className="text-[#595959] text-sm leading-relaxed mb-8">
          {isEmailComplete
            ? "We'll send a verification code to your email @**** whenever a new sign in to this account occurs."
            : "We'll send a verification code to your phone number ending in **** whenever a new sign in to this account occurs."}
          <br /><br />
          This will help keeping your account secure.
        </p>
        <button
          onClick={() => { setMethod(null); setContact(""); setVerifyCode(""); setView("choose-method"); }}
          className="text-[#f77f00] text-base font-semibold hover:text-[#e06500] transition-colors"
        >
          Change verification method
        </button>
      </div>
    </div>
  );
}

// ─── Login & Recovery ────────────────────────────────────────────────────────

function LoginRecoveryView({ onBack }: { onBack: () => void }) {
  const [subView, setSubView] = useState<LoginRecoverySubView>("overview");

  if (subView === "change-password") return <ChangePasswordView onBack={() => setSubView("overview")} />;
  if (subView === "two-fa") return <TwoFAView onBack={() => setSubView("overview")} />;

  const items: { label: string; sub: LoginRecoverySubView }[] = [
    { label: "Change password", sub: "change-password" },
    { label: "Two-factor authentication", sub: "two-fa" },
  ];

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-6 border-b border-[#e0e0e0]">
        <h2 className="text-[#18191c] text-xl font-semibold">Login and Recovery</h2>
      </div>
      {items.map((item, idx) => (
        <button
          key={item.sub}
          onClick={() => setSubView(item.sub)}
          className={`w-full flex items-center justify-between px-8 py-5 hover:bg-[#fafafa] transition-colors ${
            idx < items.length - 1 ? "border-b border-[#e0e0e0]" : ""
          }`}
        >
          <span className="text-[#262626] text-base font-medium">{item.label}</span>
          <ArrowRight />
        </button>
      ))}
    </div>
  );
}

function AccountsPrivacyContent() {
  const [view, setView] = useState<PrivacyView>("overview");

  if (view === "my-community") return <MyCommunityView onBack={() => setView("overview")} />;
  if (view === "review") return <ReviewView onBack={() => setView("overview")} />;
  if (view === "security-check") return <SecurityCheckView onBack={() => setView("overview")} />;
  if (view === "account-status") return <AccountStatusView onBack={() => setView("overview")} />;
  if (view === "login-recover") return <LoginRecoveryView onBack={() => setView("overview")} />;

  const menuItems: { label: string; view: PrivacyView }[] = [
    { label: "My Community", view: "my-community" },
    { label: "Review", view: "review" },
    { label: "Security Check", view: "security-check" },
    { label: "Account Status", view: "account-status" },
    { label: "Login & Recover", view: "login-recover" },
  ];

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-6 border-b border-[#e0e0e0]">
        <h2 className="text-[#18191c] text-xl font-semibold">Accounts & Privacy</h2>
      </div>
      {menuItems.map((item, idx) => (
        <button
          key={item.view}
          onClick={() => setView(item.view)}
          className={`w-full flex items-center justify-between px-8 py-5 hover:bg-[#fafafa] transition-colors ${
            idx < menuItems.length - 1 ? "border-b border-[#e0e0e0]" : ""
          }`}
        >
          <span className="text-[#262626] text-base font-medium">{item.label}</span>
          <ArrowRight />
        </button>
      ))}
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

type AdminPanelSubView = "overview" | "manage-admins" | "add-admin";

interface AdminEntry {
  id: string;
  name: string;
  subtitle: string;
  role: string;
}

const INITIAL_PAGE_ADMINS: AdminEntry[] = [
  { id: "a1", name: "Organisation 1", subtitle: "Website Design", role: "Super Admin" },
];

const MOCK_MEMBERS: { id: string; name: string; subtitle: string }[] = [
  { id: "m1", name: "user 1", subtitle: "Developer" },
  { id: "m2", name: "user 2", subtitle: "Developer" },
  { id: "m3", name: "user 3", subtitle: "Developer" },
  { id: "m4", name: "user 4", subtitle: "Developer" },
];

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <polyline points="3,6 5,6 21,6" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ManageAdminsView({
  admins,
  onAdd,
  onDelete,
  onBack,
}: {
  admins: AdminEntry[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-5 border-b border-[#e0e0e0] flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[#18191c] text-xl font-semibold">Page Admins ({admins.length})</h2>
          <p className="text-[#262626] text-sm mt-1">All page admins have access to admin view.</p>
        </div>
        <button
          onClick={onAdd}
          className="bg-[#ffeacc] text-[#f77f00] text-base font-semibold rounded-full px-6 py-2 hover:bg-[#ffdcaa] transition-colors shrink-0"
        >
          Add
        </button>
      </div>
      {/* Table header */}
      <div className="bg-[#eae9e9] grid grid-cols-[1fr_1fr_100px] px-8 py-3">
        <span className="text-[#18191c] text-sm font-semibold">Profile</span>
        <span className="text-[#18191c] text-sm font-semibold">Roles</span>
        <span className="text-[#18191c] text-sm font-semibold">Actions</span>
      </div>
      {/* Rows */}
      {admins.length === 0 ? (
        <div className="px-8 py-10 text-center">
          <p className="text-[#9199a3] text-sm">No admins added yet.</p>
        </div>
      ) : (
        admins.map((admin, idx) => (
          <div key={admin.id}>
            <div className="grid grid-cols-[1fr_1fr_100px] items-center px-8 py-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#f1f2f4] flex items-center justify-center shrink-0">
                  <span className="text-[#7c8493] text-base font-semibold">
                    {admin.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[#18191c] text-base font-semibold">{admin.name}</p>
                  <p className="text-[#555454] text-sm">{admin.subtitle}</p>
                </div>
              </div>
              <span className="text-[#18191c] text-base">{admin.role}</span>
              <div className="flex items-center gap-2">
                <button className="border border-[#d6ddeb] rounded-full p-2 hover:bg-[#fafafa] transition-colors">
                  <EditIcon />
                </button>
                <button
                  onClick={() => onDelete(admin.id)}
                  className="border border-[#d6ddeb] rounded-full p-2 hover:bg-[#fafafa] transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
            {idx < admins.length - 1 && <div className="h-px bg-[#e0e0e0] mx-8" />}
          </div>
        ))
      )}
    </div>
  );
}

function AddAdminView({
  onAdd,
  onBack,
}: {
  onAdd: (member: { id: string; name: string; subtitle: string }) => void;
  onBack: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; subtitle: string } | null>(null);
  const [superAdminChecked, setSuperAdminChecked] = useState(false);

  const filtered = MOCK_MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canAdd = selectedMember !== null && superAdminChecked;

  function handleSelectMember(member: { id: string; name: string; subtitle: string }) {
    setSelectedMember(member);
    setSearchQuery("");
    setShowDropdown(false);
  }

  function handleAdd() {
    if (selectedMember) {
      onAdd(selectedMember);
      setSelectedMember(null);
      setSuperAdminChecked(false);
      setSearchQuery("");
    }
  }

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
        >
          <ChevronLeft />
          Back
        </button>
      </div>
      <div className="px-8 py-5 border-b border-[#e0e0e0]">
        <h2 className="text-[#18191c] text-xl font-semibold">Add page admin</h2>
      </div>
      <div className="px-8 py-6">
        {/* Selected member display */}
        {selectedMember ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-[#f1f2f4] flex items-center justify-center shrink-0">
                <span className="text-[#7c8493] text-base font-semibold">
                  {selectedMember.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[#18191c] text-base font-semibold">{selectedMember.name}</p>
                <p className="text-[#686868] text-sm">{selectedMember.subtitle}</p>
              </div>
              <button
                onClick={() => { setSelectedMember(null); setSuperAdminChecked(false); }}
                className="text-[#9199a3] hover:text-[#262626] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="h-px bg-[#e0e0e0] mb-5" />
          </>
        ) : (
          /* Search input with dropdown */
          <div className="relative mb-5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(e.target.value.length > 0); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search for a member to assign roles"
              className={`w-full border rounded-[6px] px-4 py-3 text-base text-[#686868] placeholder-[#686868] focus:outline-none transition-colors ${
                showDropdown ? "border-[#030303]" : "border-[#7d7d7d]"
              }`}
            />
            {showDropdown && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-0.5 bg-white border border-[#5e5e5e] rounded-[8px] shadow-[0px_3px_4px_rgba(0,0,0,0.36)] z-10 overflow-hidden">
                {filtered.map((member) => (
                  <button
                    key={member.id}
                    onMouseDown={() => handleSelectMember(member)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#f1f2f4] flex items-center justify-center shrink-0">
                      <span className="text-[#7c8493] text-sm font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[#18191c] text-base font-semibold">{member.name}</p>
                      <p className="text-[#686868] text-sm">{member.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Role selection */}
        <label
          className={`flex items-start gap-3 cursor-pointer select-none mb-6 ${!selectedMember ? "pointer-events-none opacity-60" : ""}`}
        >
          <SquareCheckbox
            checked={superAdminChecked}
            onChange={() => setSuperAdminChecked((v) => !v)}
          />
          <div>
            <p className="text-[#969595] text-base font-medium">Super admin</p>
            <p className="text-[#575555] text-sm mt-0.5 leading-relaxed">
              This role manages everything on the page. It's the only role that can manage and edit the admins.
            </p>
          </div>
        </label>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className={`rounded-full px-8 py-2.5 text-base font-semibold transition-colors ${
            canAdd
              ? "bg-[#ffeacc] text-[#f77f00] hover:bg-[#ffdcaa]"
              : "bg-[#dbdbdb] text-[#545454] cursor-not-allowed"
          }`}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function AdminPanelContent() {
  const [view, setView] = useState<AdminPanelSubView>("overview");
  const [admins, setAdmins] = useState<AdminEntry[]>(INITIAL_PAGE_ADMINS);

  if (view === "manage-admins") {
    return (
      <ManageAdminsView
        admins={admins}
        onAdd={() => setView("add-admin")}
        onDelete={(id) => setAdmins((prev) => prev.filter((a) => a.id !== id))}
        onBack={() => setView("overview")}
      />
    );
  }

  if (view === "add-admin") {
    return (
      <AddAdminView
        onAdd={(member) => {
          setAdmins((prev) => [
            ...prev,
            { id: member.id, name: member.name, subtitle: member.subtitle, role: "Super Admin" },
          ]);
          setView("manage-admins");
        }}
        onBack={() => setView("manage-admins")}
      />
    );
  }

  return (
    <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">
      <div className="px-8 py-6 border-b border-[#e0e0e0]">
        <h2 className="text-[#18191c] text-xl font-semibold">Admin Panel</h2>
      </div>
      <button
        onClick={() => setView("manage-admins")}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-[#fafafa] transition-colors"
      >
        <span className="text-[#262626] text-base font-medium">Manage Admins</span>
        <ArrowRight />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const section = searchParams.get("section") ?? "mentions";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-3xl px-4 sm:px-6 py-8 md:px-10 md:py-10">
          <h1 className="text-[#18191c] text-2xl font-semibold mb-6">Settings</h1>

          {section === "mentions" && <MentionsContent key="mentions" />}
          {section === "blocked-accounts" && <BlockedAccountsContent key="blocked" />}
          {section === "accounts-privacy" && <AccountsPrivacyContent key="privacy" />}
          {section === "admin-panel" && <AdminPanelContent key="admin-panel" />}
        </div>
      </div>
    </div>
  );
}
