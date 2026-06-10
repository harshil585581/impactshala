import { useState, useEffect } from 'react';
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
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className ?? ''}`} />;
}

// ─── Chevron ──────────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0 transition-transform duration-200', open ? '' : 'rotate-180')}
    >
      <path
        d="M18 15l-6-6-6 6"
        stroke="#6b7280"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function CollapseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between h-[50px] border border-[#b4b4b4] rounded-sm px-4"
      >
        <span className="text-base font-medium text-black">{title}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="border border-[#b4b4b4] border-t-0 rounded-b-sm">{children}</div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

export default function MyPostingsPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Postings
  const [postings, setPostings] = useState<EmployerPosting[]>([]);
  const [selectedPosting, setSelectedPosting] = useState<EmployerPosting | null>(null);

  // Applications for selected posting
  const [applications, setApplications] = useState<EmploymentApplication[]>([]);
  const [seekerProfiles, setSeekerProfiles] = useState<SeekerProfile[]>([]);

  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

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
    setSelectedAppId(null);
    setPage(1);
    fetchApplicationsForPosting(selectedPosting.id)
      .then((apps) => {
        setApplications(apps);
        if (apps.length > 0) setSelectedAppId(apps[0].id);
      })
      .catch(() => {})
      .finally(() => setAppsLoading(false));
  }, [selectedPosting?.id]);

  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const pagedApps = applications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedApp = applications.find((a) => a.id === selectedAppId) ?? null;
  const selectedProfile = selectedApp
    ? seekerProfiles.find((p) => p.user_id === selectedApp.applicant_id) ?? null
    : null;

  async function handleStatus(appId: string, status: ApplicationStatus) {
    setStatusUpdating(appId + status);
    try {
      await updateApplicationStatus(appId, status);
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    } catch {}
    setStatusUpdating(null);
  }

  const postingInitial = selectedPosting?.job_title?.charAt(0).toUpperCase() ?? 'J';

  // ── No postings empty state ──────────────────────────────────────────────
  if (!loading && postings.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fe]">
        <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen flex items-center justify-center">
          <div className="bg-white border border-[#e5e5e5] p-16 flex flex-col items-center justify-center text-center max-w-md w-full mx-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-4">
              <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[#6b7280] font-semibold text-base">No job postings yet</p>
            <p className="text-[#9ca3af] text-sm mt-1 mb-5">
              Create your first job posting to start receiving applicants.
            </p>
            <button
              type="button"
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
    <div className="min-h-screen bg-[#f8f9fe]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="px-4 sm:px-6 py-6">

          {/* ── Posting selector (only when multiple postings) ── */}
          {postings.length > 1 && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              {postings.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPosting(p)}
                  className={cn(
                    'h-9 px-4 rounded-full text-sm font-medium border transition-colors',
                    selectedPosting?.id === p.id
                      ? 'bg-[#f77f00] text-white border-[#f77f00]'
                      : 'border-[#e5e5e5] text-[#6b7280] hover:border-[#f77f00] hover:text-[#f77f00]',
                  )}
                >
                  {p.job_title || 'Untitled Role'}
                </button>
              ))}
            </div>
          )}

          {/* ── Job posting header ── */}
          {loading ? (
            <div className="bg-white border border-[#e5e5e5] p-5 flex items-center gap-4">
              <Skeleton className="w-[63px] h-[63px] rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          ) : selectedPosting ? (
            <div className="bg-white border border-[#e5e5e5] p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-[63px] h-[63px] rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xl">{postingInitial}</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-normal text-black leading-tight">
                      {selectedPosting.job_title}
                    </h1>
                    <p className="text-sm text-black">{selectedPosting.org_name}</p>
                    {selectedPosting.work_mode && (
                      <p className="text-sm text-black">({selectedPosting.work_mode})</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-[#05a12c]">
                      {selectedPosting.status.charAt(0).toUpperCase() +
                        selectedPosting.status.slice(1)}
                    </span>
                    <span className="text-[#6e6e6e]">
                      • Posted {timeAgo(selectedPosting.created_at)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-5 rounded-full hover:bg-[#fff8ee] transition-colors whitespace-nowrap"
                  >
                    Manage Job
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── Divider ── */}
          <div className="h-px bg-[#e5e5e5]" />

          {/* ── Main content ── */}
          {loading || appsLoading ? (
            <div className="flex gap-6 pt-5">
              <div className="flex-1 space-y-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
              <Skeleton className="w-[533px] shrink-0 h-[600px]" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#e5e7eb] rounded mt-5">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-3">
                <path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-[#6b7280] font-semibold text-base">No applications yet</p>
              <p className="text-[#9ca3af] text-sm mt-1">
                Applicants will appear here once people apply.
              </p>
            </div>
          ) : (
            <div className="flex gap-6 pt-5">

              {/* ── Left: applicant list ── */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-normal text-black mb-4">
                  Applicants ({applications.length})
                </h2>

                <div className="flex flex-col gap-4">
                  {pagedApps.map((app) => {
                    const isSelected = app.id === selectedAppId;
                    const appProfile =
                      seekerProfiles.find((p) => p.user_id === app.applicant_id) ?? null;
                    const initial = app.name?.[0]?.toUpperCase() ?? 'A';
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedAppId(app.id)}
                        className={cn(
                          'w-full text-left border border-[#e5e5e5] p-5 transition-colors',
                          isSelected ? 'bg-white' : 'bg-[#f8e1cb]',
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-[63px] h-[63px] rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-xl">{initial}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-2xl font-normal text-black leading-tight">
                              {app.name}
                            </p>
                            {selectedPosting?.org_name && (
                              <p className="text-sm text-black mt-0.5">
                                {selectedPosting.org_name}
                              </p>
                            )}
                            {(appProfile?.current_location || selectedPosting?.work_mode) && (
                              <p className="text-sm text-black">
                                {appProfile?.current_location ?? ''}
                                {selectedPosting?.work_mode
                                  ? ` (${selectedPosting.work_mode})`
                                  : ''}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="shrink-0 p-2 rounded hover:bg-black/5 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg width="4" height="20" viewBox="0 0 4 20" fill="#6b7280">
                              <circle cx="2" cy="2" r="2" />
                              <circle cx="2" cy="10" r="2" />
                              <circle cx="2" cy="18" r="2" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-[#6e6e6e] text-sm font-semibold mt-3 ml-[79px]">
                          Applied {timeAgo(app.applied_at)}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-6">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 px-3 rounded-full text-xs font-medium border border-[#e4e5e8] text-[#6b6b6b] hover:border-[#f77f00] hover:text-[#f77f00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Previous
                    </button>
                    {(() => {
                      const pages: (number | '...')[] = [];
                      if (totalPages <= 5) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (page > 3) pages.push('...');
                        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                        if (page < totalPages - 2) pages.push('...');
                        pages.push(totalPages);
                      }
                      return pages.map((p, i) =>
                        p === '...' ? (
                          <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-[#6b6b6b]">
                            ...
                          </span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPage(p as number)}
                            className={cn(
                              'w-8 h-8 rounded-full text-xs font-semibold transition-colors',
                              page === p
                                ? 'bg-[#1a1a1a] text-white'
                                : 'border border-[#e4e5e8] text-[#6b6b6b] hover:border-[#f77f00] hover:text-[#f77f00]',
                            )}
                          >
                            {p}
                          </button>
                        ),
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-8 px-3 rounded-full text-xs font-medium border border-[#e4e5e8] text-[#6b6b6b] hover:border-[#f77f00] hover:text-[#f77f00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      Next
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* ── Right: applicant detail ── */}
              {selectedApp && (
                <div className="w-[533px] shrink-0 bg-white border border-[#e5e5e5] p-5 self-start sticky top-[90px] flex flex-col gap-6 max-h-[calc(100vh-110px)] overflow-y-auto">

                  {/* Profile header + status buttons */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-[46px] h-[46px] rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-base">
                          {selectedApp.name?.[0]?.toUpperCase() ?? 'A'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-normal text-black leading-tight">
                          {selectedApp.name}
                        </p>
                        {selectedPosting?.org_name && (
                          <p className="text-[10px] text-black">{selectedPosting.org_name}</p>
                        )}
                        {(selectedProfile?.current_location || selectedPosting?.work_mode) && (
                          <p className="text-[10px] text-black">
                            {selectedProfile?.current_location ?? ''}
                            {selectedPosting?.work_mode ? ` (${selectedPosting.work_mode})` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    {(['not_a_fit', 'maybe', 'goodfit'] as ApplicationStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={!!statusUpdating}
                        onClick={() => handleStatus(selectedApp.id, s)}
                        className={cn(
                          'h-[30px] w-[70px] rounded-full text-xs whitespace-nowrap transition-colors shrink-0 border',
                          selectedApp.status === s
                            ? 'bg-[#f77f00] text-white border-[#f77f00]'
                            : 'border-[#f77f00] text-[#f77f00] hover:bg-[#fff8ee]',
                        )}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#e5e5e5]" />

                  {/* Profile Overview */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-base font-medium text-black">Profile Overview</h3>

                    {selectedApp.message && (
                      <div>
                        <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Message</p>
                        <p className="text-xs text-black leading-relaxed">{selectedApp.message}</p>
                      </div>
                    )}

                    {selectedProfile ? (
                      <>
                        {(selectedProfile.career_goals || selectedProfile.work_drives_you) && (
                          <div>
                            <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Bio</p>
                            <p className="text-xs text-black leading-relaxed">
                              {selectedProfile.career_goals || selectedProfile.work_drives_you}
                            </p>
                          </div>
                        )}

                        {selectedProfile.looking_for_roles && (
                          <div>
                            <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Experience</p>
                            <p className="text-sm font-normal text-black leading-relaxed">
                              {selectedProfile.looking_for_roles}
                            </p>
                            {selectedProfile.current_status && (
                              <p className="text-[10px] font-semibold text-[#898e96] mt-0.5">
                                {selectedProfile.current_status}
                              </p>
                            )}
                          </div>
                        )}

                        {selectedProfile.job_industry && (
                          <div>
                            <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Education</p>
                            <p className="text-sm font-normal text-black leading-relaxed">
                              {selectedProfile.job_industry}
                            </p>
                            {selectedProfile.department && (
                              <p className="text-xs text-black">{selectedProfile.department}</p>
                            )}
                          </div>
                        )}

                        {(selectedProfile.technical_skills?.length > 0 ||
                          selectedProfile.soft_skills?.length > 0) && (
                          <div>
                            <p className="text-sm font-semibold text-[#6e6e6e] mb-2">Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                ...(selectedProfile.technical_skills ?? []),
                                ...(selectedProfile.soft_skills ?? []),
                              ]
                                .slice(0, 6)
                                .map((sk, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-[#fff3e0] text-[#f77f00] px-2 py-0.5 rounded-full"
                                  >
                                    {sk}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      !selectedApp.message && (
                        <p className="text-xs text-[#9f9f9f] italic">
                          No additional profile information available.
                        </p>
                      )
                    )}
                  </div>

                  {/* View Profile */}
                  <button
                    type="button"
                    className="border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-4 rounded-full hover:bg-[#fff8ee] transition-colors w-full"
                  >
                    View Profile
                  </button>

                  {/* Resume */}
                  <CollapseSection title="Resume">
                    {selectedProfile?.resume_url ? (
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-[#0f172a]">Resume</span>
                        <a
                          href={selectedProfile.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-[#f77f00] text-[#f77f00] text-xs rounded-full h-[19px] w-[51px] flex items-center justify-center hover:bg-[#fff8ee] transition-colors"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <p className="px-4 py-3 text-xs text-[#9f9f9f] italic">
                        No resume uploaded
                      </p>
                    )}
                  </CollapseSection>

                  {/* Eligibility */}
                  <CollapseSection title="Eligibility">
                    {(selectedPosting?.eligibility_criteria ?? []).length === 0 ? (
                      <p className="px-4 py-3 text-xs text-[#9f9f9f] italic">
                        No eligibility criteria
                      </p>
                    ) : (
                      <div className="divide-y divide-[#f2f2f3]">
                        {selectedPosting!.eligibility_criteria.map((c, i) => (
                          <p key={i} className="px-4 py-2 text-xs text-[#0f172a]">{c}</p>
                        ))}
                      </div>
                    )}
                  </CollapseSection>

                  {/* Documents */}
                  <CollapseSection title="Documents">
                    {(selectedPosting?.required_documents ?? []).length === 0 ? (
                      <p className="px-4 py-3 text-xs text-[#9f9f9f] italic">
                        No documents required
                      </p>
                    ) : (
                      <div className="divide-y divide-[#f2f2f3] py-2">
                        {selectedPosting!.required_documents.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-2">
                            <span className="text-xs text-[#0f172a]">{doc}</span>
                            <span className="border border-[#f77f00] text-[#f77f00] text-xs rounded-full h-[19px] w-[51px] flex items-center justify-center">
                              View
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapseSection>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
