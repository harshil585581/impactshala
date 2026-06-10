import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import {
  fetchEmployerPostingById,
  fetchApplicationsForPosting,
  updateApplicationStatus,
} from '../../services/employmentService';
import type { EmployerPosting, EmploymentApplication, ApplicationStatus } from '../../services/employmentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: 'bg-gray-100 text-gray-600',
  not_a_fit: 'bg-red-50 text-red-500',
  maybe: 'bg-yellow-50 text-yellow-600',
  goodfit: 'bg-green-50 text-green-600',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  not_a_fit: 'Not a fit',
  maybe: 'Maybe',
  goodfit: 'Good fit',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function LetterAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colors = ['#6b7280', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#f77f00'];
  const bg = colors[hash % colors.length];
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm';
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white shrink-0`} style={{ backgroundColor: bg }}>
      {initials}
    </div>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
        <span className="text-[#18191c] font-semibold text-sm">{title}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="border-t border-[#e5e7eb]">{children}</div>}
    </div>
  );
}

// ─── Three-dot menu ───────────────────────────────────────────────────────────

function ThreeDotsMenu({ id, openId, setOpenId, onCopyLink, onRemove }: {
  id: string; openId: string | null; setOpenId: (id: string | null) => void;
  onCopyLink: () => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenId(null);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [setOpenId]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={e => { e.stopPropagation(); setOpenId(openId === id ? null : id); }}
        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="5" cy="12" r="1.5" fill="#6b7280" />
          <circle cx="12" cy="12" r="1.5" fill="#6b7280" />
          <circle cx="19" cy="12" r="1.5" fill="#6b7280" />
        </svg>
      </button>
      {openId === id && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
          <button onClick={onCopyLink} className="w-full text-left px-4 py-3 text-sm text-[#374151] hover:bg-gray-50 transition-colors">Copy Link</button>
          <button onClick={onRemove} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors">Remove</button>
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

const PAGE_SIZE = 8;

export default function ApplicantsDetailPage() {
  const { postingId = '' } = useParams<{ postingId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posting, setPosting] = useState<EmployerPosting | null>(null);
  const [applications, setApplications] = useState<EmploymentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!postingId) return;
    setLoading(true);
    Promise.all([
      fetchEmployerPostingById(postingId),
      fetchApplicationsForPosting(postingId),
    ])
      .then(([p, apps]) => {
        setPosting(p);
        setApplications(apps);
        if (apps.length > 0) setSelectedId(apps[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postingId]);

  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const pagedApps = applications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = applications.find(a => a.id === selectedId) ?? null;

  async function handleStatus(appId: string, status: ApplicationStatus) {
    setStatusUpdating(appId + status);
    try {
      await updateApplicationStatus(appId, status);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    } catch {}
    setStatusUpdating(null);
  }

  function handleRemove(appId: string) {
    setApplications(prev => {
      const next = prev.filter(a => a.id !== appId);
      if (selectedId === appId) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">

          {/* Back */}
          <button onClick={() => navigate('/applications')} className="flex items-center gap-1.5 text-[#6b7280] text-sm font-medium hover:text-[#18191c] mb-5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            My Applications
          </button>

          {/* Posting header */}
          {loading ? (
            <div className="flex items-start gap-4 mb-6">
              <Skeleton className="w-14 h-14 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ) : posting ? (
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-14 h-14 rounded-full bg-[#18191c] flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xl">{posting.job_title?.charAt(0) ?? 'J'}</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-[#18191c] text-2xl sm:text-[28px] font-bold leading-tight">{posting.job_title}</h1>
                  <p className="text-[#18191c] text-[15px] mt-0.5">{posting.org_name}</p>
                  {posting.work_mode && <p className="text-[#6b7280] text-sm mt-0.5">{posting.work_mode}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-semibold text-sm ${posting.status === 'active' ? 'text-[#16a34a]' : 'text-[#6b7280]'}`}>
                      {posting.status.charAt(0).toUpperCase() + posting.status.slice(1)}
                    </span>
                    <span className="text-[#6b7280] text-sm">•</span>
                    <span className="text-[#6b7280] text-sm">Posted {timeAgo(posting.created_at)}</span>
                  </div>
                </div>
              </div>
              <button className="shrink-0 px-5 py-2 border border-[#f77f00] text-[#f77f00] rounded-full text-sm font-semibold hover:bg-[#fff8ee] transition-colors whitespace-nowrap">
                Manage Job
              </button>
            </div>
          ) : (
            <p className="text-[#6b7280] mb-6">Posting not found.</p>
          )}

          {/* Applicants heading */}
          <h2 className="text-[#18191c] text-xl font-bold mb-4">
            Applicants ({applications.length})
          </h2>

          {loading ? (
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-3">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
              <div className="w-[420px] shrink-0">
                <Skeleton className="h-[500px] rounded-2xl" />
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#e5e7eb] rounded-2xl">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-3">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[#6b7280] font-semibold text-[15px]">No applications yet</p>
              <p className="text-[#9ca3af] text-sm mt-1">Applicants will appear here once people apply.</p>
            </div>
          ) : (
            <div className="flex gap-4 items-start">
              {/* Left: applicant list + pagination */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                {pagedApps.map(app => {
                  const isSelected = app.id === selectedId;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedId(app.id)}
                      className={`rounded-2xl p-4 cursor-pointer transition-colors ${isSelected ? 'bg-white border border-[#e5e7eb] shadow-sm' : 'bg-[#fff8f0]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <LetterAvatar name={app.name} />
                          <div className="min-w-0">
                            <p className="text-[#18191c] font-bold text-base leading-tight">{app.name}</p>
                            <p className="text-[#6b7280] text-sm mt-0.5 truncate">{app.email}</p>
                            {app.mobile && <p className="text-[#6b7280] text-sm">{app.mobile}</p>}
                            <p className="text-[#9ca3af] text-sm mt-1">Applied {timeAgo(app.applied_at)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status]}`}>
                            {STATUS_LABELS[app.status]}
                          </span>
                          <ThreeDotsMenu
                            id={app.id}
                            openId={openMenuId}
                            setOpenId={setOpenMenuId}
                            onCopyLink={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/applications/detail/${postingId}`).catch(() => {});
                              setOpenMenuId(null);
                            }}
                            onRemove={() => { handleRemove(app.id); setOpenMenuId(null); }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${page === p ? 'bg-[#18191c] text-white' : 'text-[#374151] hover:bg-gray-100'}`}>
                        {p}
                      </button>
                    ))}
                    {totalPages > 5 && <span className="text-[#9ca3af] text-sm px-1">...</span>}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors">
                      Next
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: profile panel */}
              {selected && (
                <div className="w-[420px] shrink-0 sticky top-[90px]">
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 p-4 border-b border-[#f3f4f6]">
                      <div className="flex items-start gap-3 min-w-0">
                        <LetterAvatar name={selected.name} size="lg" />
                        <div className="min-w-0">
                          <p className="text-[#18191c] font-semibold text-[15px] leading-tight">{selected.name}</p>
                          <p className="text-[#6b7280] text-xs mt-0.5 truncate">{selected.email}</p>
                          {selected.mobile && <p className="text-[#6b7280] text-xs">{selected.mobile}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                        {(['not_a_fit', 'maybe', 'goodfit'] as const).map(s => (
                          <button
                            key={s}
                            disabled={!!statusUpdating}
                            onClick={() => handleStatus(selected.id, s)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap border
                              ${selected.status === s
                                ? s === 'goodfit' ? 'bg-[#f77f00] text-white border-[#f77f00]' : 'bg-[#fff8ee] text-[#f77f00] border-[#f77f00]'
                                : s === 'goodfit' ? 'bg-[#f77f00] text-white border-[#f77f00] hover:bg-[#e68500]' : 'border-[#f77f00] text-[#f77f00] hover:bg-[#fff8ee]'
                              }`}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scrollable body */}
                    <div className="p-4 space-y-4 max-h-[calc(100vh-240px)] overflow-y-auto">
                      <h3 className="text-[#18191c] font-bold text-base">Profile Overview</h3>

                      {/* Message */}
                      <div>
                        <p className="text-[#9ca3af] text-xs font-semibold mb-1">Cover Message</p>
                        {selected.message ? (
                          <p className="text-[#374151] text-sm leading-relaxed">{selected.message}</p>
                        ) : (
                          <p className="text-[#9ca3af] text-sm italic">No message provided.</p>
                        )}
                      </div>

                      {/* Applied time + status */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <p className="text-[#9ca3af] text-xs font-semibold mb-0.5">Applied</p>
                          <p className="text-[#374151] text-sm">{new Date(selected.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-[#9ca3af] text-xs font-semibold mb-0.5">Status</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>
                            {STATUS_LABELS[selected.status]}
                          </span>
                        </div>
                      </div>

                      {/* Eligibility accordion */}
                      {posting && (posting.eligibility_criteria ?? []).length > 0 && (
                        <Accordion title="Eligibility Criteria" defaultOpen>
                          <div className="px-4 py-3 space-y-1">
                            {posting.eligibility_criteria.map((c, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                                <span className="text-[#f77f00] mt-0.5 shrink-0">•</span>
                                <span>{c}</span>
                              </div>
                            ))}
                          </div>
                        </Accordion>
                      )}

                      {/* Documents accordion */}
                      <Accordion title="Required Documents" defaultOpen>
                        {posting && (posting.required_documents ?? []).length > 0 ? (
                          <div>
                            {posting.required_documents.map((doc, i) => (
                              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < posting.required_documents.length - 1 ? 'border-b border-[#f3f4f6]' : ''}`}>
                                <span className="text-[#374151] text-sm">{doc}</span>
                                <span className="text-[#9ca3af] text-xs">Not uploaded</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-[#9ca3af]">No documents required.</div>
                        )}
                      </Accordion>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
