import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import {
  fetchMyEmployerPostings,
  fetchApplicationsForPosting,
  updateApplicationStatus,
  fetchAllSeekerProfiles,
} from '../../services/employmentService';
import type {
  EmployerPosting,
  EmploymentApplication,
  ApplicationStatus,
  SeekerProfile,
} from '../../services/employmentService';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { cn } from '@/lib/cn';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''} ago`;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  not_a_fit: 'Not a fit',
  maybe: 'Maybe',
  goodfit: 'Goodfit',
};


// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className ?? ''}`} />;
}

function LetterAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colors = ['#6b7280', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#f77f00'];
  const bg = colors[hash % colors.length];
  const cls = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm';
  return (
    <div className={`${cls} rounded-full flex items-center justify-center font-semibold text-white shrink-0`} style={{ backgroundColor: bg }}>
      {initials}
    </div>
  );
}

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-[#18191c] font-semibold text-sm">{title}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="border-t border-[#e5e7eb]">{children}</div>}
    </div>
  );
}

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
      <button
        onClick={e => { e.stopPropagation(); setOpenId(openId === id ? null : id); }}
        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="5" cy="12" r="1.5" fill="#6b7280" />
          <circle cx="12" cy="12" r="1.5" fill="#6b7280" />
          <circle cx="19" cy="12" r="1.5" fill="#6b7280" />
        </svg>
      </button>
      {openId === id && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
          <button onClick={onCopyLink} className="w-full text-left px-4 py-3 text-sm text-[#374151] hover:bg-gray-50 transition-colors">
            Copy Link
          </button>
          <button onClick={onRemove} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors">
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function MyPostingsPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [postings, setPostings] = useState<EmployerPosting[]>([]);
  const [selectedPosting, setSelectedPosting] = useState<EmployerPosting | null>(null);
  const [applications, setApplications] = useState<EmploymentApplication[]>([]);
  const [seekerProfiles, setSeekerProfiles] = useState<SeekerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Load postings + seeker profiles once
  useEffect(() => {
    Promise.all([fetchMyEmployerPostings(), fetchAllSeekerProfiles()])
      .then(([posts, profiles]) => {
        setPostings(posts);
        setSeekerProfiles(profiles);
        if (posts.length > 0) setSelectedPosting(posts[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load applications when selected posting changes
  useEffect(() => {
    if (!selectedPosting) return;
    setAppsLoading(true);
    setApplications([]);
    setSelectedId(null);
    setPage(1);
    fetchApplicationsForPosting(selectedPosting.id)
      .then(apps => {
        setApplications(apps);
        if (apps.length > 0) setSelectedId(apps[0].id);
      })
      .catch(() => {})
      .finally(() => setAppsLoading(false));
  }, [selectedPosting?.id]);

  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const pagedApps = applications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = applications.find(a => a.id === selectedId) ?? null;
  const selectedProfile = selected
    ? seekerProfiles.find(p => p.user_id === selected.applicant_id) ?? null
    : null;

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

  // ── No postings empty state ────────────────────────────────────────────────
  if (!loading && postings.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-16 flex flex-col items-center text-center max-w-md w-full mx-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-4">
              <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[#18191c] font-bold text-base">No job postings yet</p>
            <p className="text-[#9ca3af] text-sm mt-1 mb-5">Create your first job posting to start receiving applicants.</p>
            <button
              onClick={() => navigate('/employment-hub/employer')}
              className="bg-[#f77f00] text-white text-sm font-semibold h-10 px-6 rounded-full hover:bg-[#e07000] transition-colors"
            >
              Create Posting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">

          {/* ── Posting selector tabs (multiple postings) ── */}
          {!loading && postings.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap mb-5">
              {postings.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPosting(p)}
                  className={cn(
                    'px-5 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
                    selectedPosting?.id === p.id
                      ? 'bg-[#f77f00] text-white border-[#f77f00]'
                      : 'bg-white text-[#f77f00] border-[#f77f00] hover:bg-[#fff8ee]',
                  )}
                >
                  {p.job_title || 'Untitled Role'}
                </button>
              ))}
            </div>
          )}

          {/* ── Posting header ── */}
          {loading ? (
            <div className="bg-white border border-[#e5e7eb] p-5 mb-6 flex items-start gap-4">
              <Skeleton className="w-14 h-14 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ) : selectedPosting ? (
            <div className="bg-white border border-[#e5e7eb] p-5 mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-14 h-14 rounded-full bg-[#18191c] flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xl">
                    {selectedPosting.job_title?.charAt(0).toUpperCase() ?? 'J'}
                  </span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-[#18191c] text-2xl sm:text-[28px] font-bold leading-tight">
                    {selectedPosting.job_title}
                  </h1>
                  <p className="text-[#18191c] text-[15px] mt-0.5">{selectedPosting.org_name}</p>
                  {selectedPosting.work_mode && (
                    <p className="text-[#6b7280] text-sm mt-0.5">{selectedPosting.work_mode}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-semibold text-sm ${selectedPosting.status === 'active' ? 'text-[#16a34a]' : 'text-[#6b7280]'}`}>
                      {selectedPosting.status.charAt(0).toUpperCase() + selectedPosting.status.slice(1)}
                    </span>
                    <span className="text-[#6b7280] text-sm">•</span>
                    <span className="text-[#6b7280] text-sm">Posted {timeAgo(selectedPosting.created_at)}</span>
                  </div>
                </div>
              </div>
              <button className="shrink-0 px-5 py-2 border border-[#f77f00] text-[#f77f00] rounded-full text-sm font-semibold hover:bg-[#fff8ee] transition-colors whitespace-nowrap">
                Manage Job
              </button>
            </div>
          ) : null}

          {/* ── Applicants heading ── */}
          {!loading && (
            <h2 className="text-[#18191c] text-xl font-bold mb-4">
              Applicants ({applications.length})
            </h2>
          )}

          {/* ── Main content ── */}
          {loading || appsLoading ? (
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
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[#6b7280] font-semibold text-[15px]">No applications yet</p>
              <p className="text-[#9ca3af] text-sm mt-1">Applicants will appear here once people apply.</p>
            </div>
          ) : (
            <div className="flex gap-4 items-start">

              {/* ── Left: applicant list ── */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                {pagedApps.map(app => {
                  const isSelected = app.id === selectedId;
                  const profile = seekerProfiles.find(p => p.user_id === app.applicant_id) ?? null;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedId(app.id)}
                      className={cn(
                        'rounded-2xl p-4 cursor-pointer transition-colors',
                        isSelected ? 'bg-white border border-[#e5e7eb] shadow-sm' : 'bg-[#fff8f0]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <LetterAvatar name={app.name} />
                          <div className="min-w-0">
                            <p className="text-[#18191c] font-bold text-base leading-tight">{app.name}</p>
                            {selectedPosting?.org_name && (
                              <p className="text-[#18191c] text-sm mt-0.5">{selectedPosting.org_name}</p>
                            )}
                            {(profile?.current_location || selectedPosting?.work_mode) && (
                              <p className="text-[#6b7280] text-sm mt-0.5">
                                {[profile?.current_location, selectedPosting?.work_mode ? `( ${selectedPosting.work_mode} )` : '']
                                  .filter(Boolean).join(' ')}
                              </p>
                            )}
                            <p className="text-[#9ca3af] text-sm mt-1">Applied {timeAgo(app.applied_at)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <ThreeDotsMenu
                            id={app.id}
                            openId={openMenuId}
                            setOpenId={setOpenMenuId}
                            onCopyLink={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/applications/detail/${selectedPosting?.id}`).catch(() => {});
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
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          'w-9 h-9 rounded-full text-sm font-medium transition-colors',
                          page === p ? 'bg-[#18191c] text-white' : 'text-[#374151] hover:bg-gray-100',
                        )}
                      >
                        {p}
                      </button>
                    ))}
                    {totalPages > 5 && <span className="text-[#9ca3af] text-sm px-1">...</span>}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors"
                    >
                      Next
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* ── Right: applicant detail panel ── */}
              {selected && (
                <div className="w-[420px] shrink-0 sticky top-[90px]">
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">

                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 p-4 border-b border-[#f3f4f6]">
                      <div className="flex items-start gap-3 min-w-0">
                        <LetterAvatar name={selected.name} size="lg" />
                        <div className="min-w-0">
                          <p className="text-[#18191c] font-semibold text-[15px] leading-tight">{selected.name}</p>
                          {selectedPosting?.org_name && (
                            <p className="text-[#6b7280] text-xs mt-0.5">{selectedPosting.org_name}</p>
                          )}
                          {(selectedProfile?.current_location || selectedPosting?.work_mode) && (
                            <p className="text-[#6b7280] text-xs">
                              {[selectedProfile?.current_location, selectedPosting?.work_mode ? `( ${selectedPosting.work_mode} )` : '']
                                .filter(Boolean).join(' ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                        {(['not_a_fit', 'maybe', 'goodfit'] as ApplicationStatus[]).map(s => (
                          <button
                            key={s}
                            disabled={!!statusUpdating}
                            onClick={() => handleStatus(selected.id, s)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap border',
                              selected.status === s
                                ? 'bg-[#f77f00] text-white border-[#f77f00]'
                                : 'border-[#f77f00] text-[#f77f00] hover:bg-[#fff8ee]',
                            )}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scrollable body */}
                    <div className="p-4 space-y-4 max-h-[calc(100vh-240px)] overflow-y-auto">

                      <h3 className="text-[#18191c] font-bold text-base">Profile Overview</h3>

                      {/* Bio */}
                      {(selectedProfile?.career_goals || selectedProfile?.work_drives_you) && (
                        <div>
                          <p className="text-[#9ca3af] text-xs font-semibold mb-1">Bio</p>
                          <p className="text-[#374151] text-sm leading-relaxed">
                            {selectedProfile.career_goals || selectedProfile.work_drives_you}
                          </p>
                        </div>
                      )}

                      {/* Cover message */}
                      {selected.message && (
                        <div>
                          <p className="text-[#9ca3af] text-xs font-semibold mb-1">Cover Message</p>
                          <p className="text-[#374151] text-sm leading-relaxed">{selected.message}</p>
                        </div>
                      )}

                      {/* Experience */}
                      {selectedProfile?.looking_for_roles && (
                        <div>
                          <p className="text-[#9ca3af] text-xs font-semibold mb-1.5">Experience</p>
                          <div className="flex flex-col gap-1">
                            <p className="text-[#18191c] text-sm font-medium">{selectedProfile.looking_for_roles}</p>
                            {selectedProfile.current_status && (
                              <p className="text-[#9ca3af] text-xs">{selectedProfile.current_status}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {selectedProfile?.job_industry && (
                        <div>
                          <p className="text-[#9ca3af] text-xs font-semibold mb-1.5">Education</p>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-[#18191c] text-sm font-medium">{selectedProfile.job_industry}</p>
                            {selectedProfile.department && (
                              <p className="text-[#374151] text-xs">{selectedProfile.department}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {((selectedProfile?.technical_skills?.length ?? 0) > 0 || (selectedProfile?.soft_skills?.length ?? 0) > 0) && (
                        <div>
                          <p className="text-[#9ca3af] text-xs font-semibold mb-2">Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              ...(selectedProfile?.technical_skills ?? []),
                              ...(selectedProfile?.soft_skills ?? []),
                            ].slice(0, 8).map((sk, i) => (
                              <span key={i} className="text-xs bg-[#fff3e0] text-[#f77f00] px-2.5 py-0.5 rounded-full">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {!selectedProfile && !selected.message && (
                        <p className="text-[#9ca3af] text-sm italic">No additional profile information available.</p>
                      )}

                      {/* View Profile */}
                      <button className="w-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold h-9 rounded-full hover:bg-[#fff8ee] transition-colors">
                        View Profile
                      </button>

                      {/* Resume accordion */}
                      <Accordion title="Resume">
                        {selectedProfile?.resume_url ? (
                          <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-[#374151] text-sm">Resume</span>
                            <a
                              href={selectedProfile.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="border border-[#f77f00] text-[#f77f00] text-xs rounded-full h-[26px] px-3 flex items-center justify-center hover:bg-[#fff8ee] transition-colors"
                            >
                              View
                            </a>
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-[#9ca3af]">No resume uploaded.</div>
                        )}
                      </Accordion>

                      {/* Eligibility accordion */}
                      <Accordion title="Eligibility">
                        {(selectedPosting?.eligibility_criteria ?? []).length > 0 ? (
                          <div className="px-4 py-3 space-y-1">
                            {selectedPosting!.eligibility_criteria.map((c, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                                <span className="text-[#f77f00] mt-0.5 shrink-0">•</span>
                                <span>{c}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-[#9ca3af]">No eligibility criteria.</div>
                        )}
                      </Accordion>

                      {/* Documents accordion */}
                      <Accordion title="Documents">
                        {(selectedPosting?.required_documents ?? []).length > 0 ? (
                          <div>
                            {selectedPosting!.required_documents.map((doc, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'flex items-center justify-between px-4 py-3',
                                  i < selectedPosting!.required_documents.length - 1 ? 'border-b border-[#f3f4f6]' : '',
                                )}
                              >
                                <span className="text-[#374151] text-sm">{doc}</span>
                                <span className="border border-[#f77f00] text-[#f77f00] text-xs rounded-full h-[26px] px-3 flex items-center justify-center">
                                  View
                                </span>
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
