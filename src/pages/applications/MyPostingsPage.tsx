import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import {
  fetchMyEmployerPostings,
  fetchRichApplicationsForPosting,
  fetchApplicationCountsForPostings,
  updateApplicationStatus,
  fetchMyApplicationsAsSeeker,
  withdrawEmploymentApplication,
} from '../../services/employmentService';
import type {
  EmployerPosting,
  ApplicationStatus,
  MyApplication,
  RichEmploymentApplication,
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

type FilterTab = 'applied' | 'received' | 'accepted' | 'hold' | 'rejected';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'received', label: 'Received' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'hold', label: 'Hold' },
  { key: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 6;

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
    <div className="border border-[#b4b4b4] rounded-[2px]">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between h-[50px] px-[17px] bg-white">
        <span className="text-black font-medium text-base">{title}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={`shrink-0 transition-transform duration-200 ${open ? '' : 'rotate-180'}`}>
          <path d="M18 15l-6-6-6 6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="border-t border-[#b4b4b4]">{children}</div>}
    </div>
  );
}

function DotsMenuButton({ options }: { options: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  return (
    <div className="relative shrink-0" ref={ref}>
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(v => !v); }} className="p-2 rounded-full hover:bg-black/5 transition-colors">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#9ca3af">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e5e5] rounded-xl shadow-lg py-1 z-30 min-w-[180px]">
          {options.map(opt => (
            <button key={opt.label} type="button"
              onClick={e => { e.stopPropagation(); setOpen(false); opt.onClick(); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${opt.danger ? 'text-red-500 hover:bg-red-50' : 'text-[#18191c] hover:bg-gray-50'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PaginationBar({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
        className="flex items-center gap-1 text-[#374151] text-sm font-medium px-3 py-2 rounded-full hover:bg-gray-100 disabled:opacity-40 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Previous
      </button>
      {pages.map((p, i) => p === '...' ? (
        <span key={`e${i}`} className="w-10 h-10 flex items-center justify-center text-sm text-[#9ca3af]">...</span>
      ) : (
        <button key={p} type="button" onClick={() => setPage(p as number)}
          className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${page === p ? 'bg-[#1a1a1a] text-white' : 'text-[#374151] hover:bg-gray-100'}`}>
          {p}
        </button>
      ))}
      <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="flex items-center gap-1 text-[#374151] text-sm font-medium px-3 py-2 rounded-full hover:bg-gray-100 disabled:opacity-40 transition-colors">
        Next
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}

// ─── Seeker View ──────────────────────────────────────────────────────────────

function SeekerView() {
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('applied');
  const [page, setPage] = useState(1);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    fetchMyApplicationsAsSeeker()
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function filterApps(tab: FilterTab): MyApplication[] {
    switch (tab) {
      case 'applied':  return apps;
      case 'received': return apps.filter(a => a.status !== 'applied');
      case 'accepted': return apps.filter(a => a.status === 'goodfit');
      case 'hold':     return apps.filter(a => a.status === 'maybe');
      case 'rejected': return apps.filter(a => a.status === 'not_a_fit');
    }
  }

  const filtered = filterApps(activeTab);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleWithdraw(appId: string) {
    setWithdrawing(appId);
    try {
      await withdrawEmploymentApplication(appId);
      setApps(prev => prev.filter(a => a.id !== appId));
    } catch {}
    setWithdrawing(null);
  }

  return (
    <div className="flex flex-col gap-[30px]">
      {/* Filter tabs */}
      <div className="flex items-center gap-4 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button key={tab.key} type="button"
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`h-[48px] px-[24px] rounded-[24px] text-[16px] font-medium border transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#ff9400] text-white border-[#ff9400]'
                : 'bg-white text-[#ff9400] border-[#ff9400] hover:bg-[#fff8ee]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card list */}
      <div className="border border-[#bebebe] rounded-[20px] p-[10px] bg-white">
        {loading ? (
          <div className="flex flex-col gap-1 p-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="p-[10px] flex flex-col gap-4">
                <Skeleton className="h-8 w-64" /><Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center text-[#9ca3af] text-base">No applications in this category.</div>
        ) : (
          paged.map((app, idx) => {
            const posting = app.posting;
            const locationParts: string[] = [];
            if (posting?.work_mode) locationParts.push(posting.work_mode);
            const locationStr = locationParts.join(', ');
            return (
              <div key={app.id}>
                <div className="bg-white rounded-[24px] p-[10px] flex items-start justify-between gap-[10px]">
                  <div className="flex-1 flex flex-col gap-[12px] min-w-0">
                    <div className="flex flex-col gap-[6px]">
                      <p className="text-[20px] font-medium text-black"
                        style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '24px' }}>
                        {posting?.job_title || '—'}
                      </p>
                      {posting?.org_name && (
                        <p className="text-[16px] font-normal text-black"
                          style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '20px' }}>
                          {posting.org_name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-[4px] opacity-40">
                      {locationStr && <p className="text-[13px] font-medium text-black">{locationStr}</p>}
                      <p className="text-[13px] font-medium text-black">Applied {timeAgo(app.applied_at)}</p>
                    </div>
                  </div>
                  <DotsMenuButton options={[{
                    label: withdrawing === app.id ? 'Withdrawing…' : 'Withdraw Application',
                    onClick: () => handleWithdraw(app.id),
                    danger: true,
                  }]} />
                </div>
                {idx < paged.length - 1 && <div className="h-px bg-[#bebebe] w-full" />}
              </div>
            );
          })
        )}
      </div>

      {!loading && totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />}
    </div>
  );
}

// ─── Org / Employer View ──────────────────────────────────────────────────────

function ApplicantDetailPanel({
  selected,
  selectedPosting,
  applications,
  setApplications,
  setSelectedId,
  statusUpdating,
  setStatusUpdating,
}: {
  selected: RichEmploymentApplication;
  selectedPosting: EmployerPosting;
  applications: RichEmploymentApplication[];
  setApplications: React.Dispatch<React.SetStateAction<RichEmploymentApplication[]>>;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  statusUpdating: string | null;
  setStatusUpdating: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const sp = selected.seeker_profile;

  async function handleStatus(appId: string, status: ApplicationStatus) {
    setStatusUpdating(appId + status);
    try {
      await updateApplicationStatus(appId, status);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    } catch {}
    setStatusUpdating(null);
  }

  return (
    <div className="w-[420px] shrink-0 bg-white border border-[#e5e5e5] rounded-lg p-5 self-start sticky top-[90px] flex flex-col gap-5 max-h-[calc(100vh-110px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <LetterAvatar name={selected.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-black leading-tight">{selected.name}</p>
          {(sp?.current_location || selectedPosting.work_mode) && (
            <p className="text-xs text-[#6b7280]">
              {[sp?.current_location, selectedPosting.work_mode ? `(${selectedPosting.work_mode})` : ''].filter(Boolean).join(' ')}
            </p>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          {(['not_a_fit', 'maybe', 'goodfit'] as ApplicationStatus[]).map(s => (
            <button key={s} disabled={!!statusUpdating} onClick={() => handleStatus(selected.id, s)}
              className={cn('h-[30px] px-3 rounded-full text-xs whitespace-nowrap transition-colors border',
                selected.status === s ? 'bg-[#f77f00] text-white border-[#f77f00]' : 'border-[#f77f00] text-[#f77f00] hover:bg-[#fff8ee]')}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5]" />

      <div className="flex flex-col gap-4">
        {/* Bio */}
        {(sp?.career_goals || sp?.work_drives_you) && (
          <div>
            <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Bio</p>
            <p className="text-sm text-black leading-relaxed">{sp.career_goals || sp.work_drives_you}</p>
          </div>
        )}
        {/* Cover message */}
        {selected.message && (
          <div>
            <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Cover Message</p>
            <p className="text-sm text-black leading-relaxed">{selected.message}</p>
          </div>
        )}
        {/* Experience */}
        {(selected.experiences?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-semibold text-[#6e6e6e] mb-2">Experience</p>
            <div className="flex flex-col gap-3">
              {selected.experiences!.map((exp, i) => {
                const start = [exp.start_month, exp.start_year].filter(Boolean).join(' ');
                const end = exp.is_current ? 'Present' : [exp.end_month, exp.end_year].filter(Boolean).join(' ');
                const period = [start, end].filter(Boolean).join(' - ');
                return (
                  <div key={i}>
                    <p className="text-sm font-semibold text-black">{exp.role} at {exp.company}</p>
                    {period && <p className="text-xs text-[#6e6e6e] mt-0.5">{period}</p>}
                    {exp.location && <p className="text-xs text-[#9ca3af] mt-0.5">{exp.location}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Education */}
        {(selected.educations?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-semibold text-[#6e6e6e] mb-2">Education</p>
            <div className="flex flex-col gap-3">
              {selected.educations!.map((edu, i) => {
                const degree = [edu.level, edu.field_of_study].filter(Boolean).join(', ');
                const startYear = edu.start_date ? edu.start_date.split('-')[0] : null;
                const endYear = edu.end_date ? edu.end_date.split('-')[0] : null;
                const period = startYear && endYear ? `${startYear} - ${endYear}` : startYear ?? endYear ?? '';
                return (
                  <div key={i}>
                    <p className="text-sm font-semibold text-black">{edu.school}</p>
                    {degree && <p className="text-xs text-black mt-0.5">{degree}</p>}
                    {period && <p className="text-xs text-[#6e6e6e] mt-0.5">{period}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Skills */}
        {((sp?.technical_skills?.length ?? 0) > 0 || (sp?.soft_skills?.length ?? 0) > 0) && (
          <div>
            <p className="text-sm font-semibold text-[#6e6e6e] mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {[...(sp?.technical_skills ?? []), ...(sp?.soft_skills ?? [])].slice(0, 8).map((sk, i) => (
                <span key={i} className="text-xs bg-[#fff3e0] text-[#f77f00] px-2 py-0.5 rounded-full">{sk}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button type="button" className="border border-[#f77f00] text-[#f77f00] text-sm font-medium shrink-0 py-[12px] px-4 rounded-full hover:bg-[#fff8ee] transition-colors w-full">
        View Profile
      </button>

      {/* Resume — fetched from applicant's profile (users.resume_url → signed URL) */}
      <Accordion title="Resume" defaultOpen>
        {selected.user_profile?.resume_signed_url ? (
          <div className="flex flex-col gap-3 px-[17px] py-3">
            <div className="bg-[#e7e7e7] w-full overflow-hidden" style={{ height: 300 }}>
              <iframe src={selected.user_profile.resume_signed_url} className="w-full h-full" title="Resume Preview" />
            </div>
            <div className="flex justify-end">
              <a href={selected.user_profile.resume_signed_url} download target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-4 rounded-full hover:bg-[#fff8ee] transition-colors">
                Download
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        ) : <p className="px-[17px] py-3 text-xs text-[#9f9f9f] italic">No resume uploaded</p>}
      </Accordion>

      {/* Eligibility */}
      <Accordion title="Eligibility">
        {(selectedPosting.eligibility_criteria ?? []).length > 0 ? (
          <div className="flex flex-col gap-3 py-3">
            {selectedPosting.eligibility_criteria.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5 px-[17px]">
                <span className="text-xs text-[#0f172a] flex-1 leading-normal">{c}</span>
                <div className="shrink-0 w-3.5 h-3.5 mt-0.5 rounded-[4px] bg-[#ff9400] flex items-center justify-center">
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="px-[17px] py-3 text-xs text-[#9f9f9f] italic">No eligibility criteria</p>}
      </Accordion>

      {/* Documents */}
      <Accordion title="Documents">
        {(selectedPosting.required_documents ?? []).length > 0 ? (
          <div className="flex flex-col gap-3 py-3">
            {selectedPosting.required_documents.map((doc, i) => {
              const uploadedDoc = (selected.document_data ?? []).find(
                d => d.name === doc
              ) ?? (selected.document_data ?? [])[i];
              return (
                <div key={i} className="flex items-center gap-2.5 px-[17px]">
                  <span className="text-xs text-[#0f172a] flex-1 truncate">{doc}</span>
                  {uploadedDoc?.url ? (
                    <a href={uploadedDoc.url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 border border-[#f77f00] text-[#f77f00] text-xs rounded-full h-[19px] w-[51px] flex items-center justify-center hover:bg-[#fff8ee] transition-colors">
                      View
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs text-[#9ca3af]">N/A</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : <p className="px-[17px] py-3 text-xs text-[#9f9f9f] italic">No documents required</p>}
      </Accordion>
    </div>
  );
}

function OrgView() {
  const navigate = useNavigate();
  // View state: 'list' = all postings, 'applicants' = applicants for selected posting
  const [view, setView] = useState<'list' | 'applicants'>('list');
  const [postings, setPostings] = useState<EmployerPosting[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [selectedPosting, setSelectedPosting] = useState<EmployerPosting | null>(null);
  const [applications, setApplications] = useState<RichEmploymentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchMyEmployerPostings()
      .then(async posts => {
        setPostings(posts);
        if (posts.length > 0) {
          const countMap = await fetchApplicationCountsForPostings(posts.map(p => p.id));
          setCounts(countMap);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openPosting(posting: EmployerPosting) {
    setSelectedPosting(posting);
    setView('applicants');
    setApplications([]);
    setSelectedId(null);
    setPage(1);
    setAppsLoading(true);
    fetchRichApplicationsForPosting(posting.id)
      .then(apps => {
        setApplications(apps);
        if (apps.length > 0) setSelectedId(apps[0].id);
      })
      .catch(() => {})
      .finally(() => setAppsLoading(false));
  }

  function handleRemove(appId: string) {
    setApplications(prev => {
      const next = prev.filter(a => a.id !== appId);
      if (selectedId === appId) setSelectedId(next[0]?.id ?? null);
      return next;
    });
    // Update count for selected posting
    if (selectedPosting) {
      setCounts(prev => {
        const next = new Map(prev);
        next.set(selectedPosting.id, Math.max(0, (next.get(selectedPosting.id) ?? 1) - 1));
        return next;
      });
    }
  }

  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const pagedApps = applications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = applications.find(a => a.id === selectedId) ?? null;

  // ── View 1: Postings list ──────────────────────────────────────────────────
  if (view === 'list') {
    if (loading) {
      return (
        <div className="max-w-[900px] border border-[#bebebe] rounded-[20px] p-[10px] bg-white flex flex-col gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="p-[10px] flex flex-col gap-4">
              <Skeleton className="h-8 w-56" /><Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      );
    }

    if (postings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[#6b7280] font-semibold text-base mb-2">No job postings yet</p>
          <p className="text-[#9ca3af] text-sm mb-5">Create your first job posting to start receiving applicants.</p>
          <button onClick={() => navigate('/employment-hub/employer')}
            className="bg-[#f77f00] text-white text-sm font-semibold h-10 px-6 rounded-full hover:bg-[#e07000] transition-colors">
            Create Posting
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-[900px] border border-[#bebebe] rounded-[20px] p-[10px] bg-white">
        {postings.map((posting, idx) => {
          const count = counts.get(posting.id) ?? 0;
          const locationParts: string[] = [];
          if (posting.org_name) locationParts.push(posting.org_name);
          if (posting.work_mode) locationParts.push(posting.work_mode);
          return (
            <div key={posting.id}>
              <div
                onClick={() => openPosting(posting)}
                className="bg-white rounded-[24px] p-[10px] flex items-start justify-between gap-[10px] cursor-pointer hover:bg-[#fffaf5] transition-colors"
              >
                <div className="flex-1 flex flex-col gap-[12px] min-w-0">
                  <div className="flex flex-col gap-[6px]">
                    <p className="text-[20px] font-medium text-black"
                      style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '24px' }}>
                      {posting.job_title || 'Untitled Role'}
                    </p>
                    {posting.industry && (
                      <p className="text-[16px] font-normal text-black"
                        style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '20px' }}>
                        {posting.industry}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-[4px] opacity-40">
                    {locationParts.length > 0 && (
                      <p className="text-[13px] font-medium text-black">{locationParts.join(', ')}</p>
                    )}
                    <p className="text-[13px] font-medium text-black">Posted {timeAgo(posting.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 mt-1">
                  <span className="text-[#f77f00] text-[14px] font-medium whitespace-nowrap">
                    {count} {count === 1 ? 'Applicant' : 'Applicants'}
                  </span>
                  <DotsMenuButton options={[
                    { label: 'View Applicants', onClick: () => openPosting(posting) },
                    { label: 'Delete Posting', onClick: () => {}, danger: true },
                  ]} />
                </div>
              </div>
              {idx < postings.length - 1 && <div className="h-px bg-[#bebebe] w-full" />}
            </div>
          );
        })}
      </div>
    );
  }

  // ── View 2: Applicants for selected posting ────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Posting header card */}
      {selectedPosting && (
        <div className="bg-white border border-[#e5e5e5] px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-semibold text-black leading-tight mb-1">
              {selectedPosting.job_title}
            </h1>
            {selectedPosting.industry && (
              <p className="text-sm text-[#49454f] mb-0.5">{selectedPosting.industry}</p>
            )}
            {(selectedPosting.org_name || selectedPosting.work_mode) && (
              <p className="text-sm text-[#49454f] mb-0.5">
                {[selectedPosting.org_name, selectedPosting.work_mode ? `(${selectedPosting.work_mode})` : ''].filter(Boolean).join(' ')}
              </p>
            )}
            <p className="text-sm mt-1">
              <span className={selectedPosting.status === 'active' ? 'text-[#05a12c] font-semibold' : 'text-[#6b7280] font-semibold'}>
                {selectedPosting.status.charAt(0).toUpperCase() + selectedPosting.status.slice(1)}
              </span>
              <span className="text-[#6e6e6e]"> • Posted {timeAgo(selectedPosting.created_at)}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 mt-1">
            <button
              type="button"
              onClick={() => { setView('list'); setSelectedPosting(null); }}
              className="border border-[#e5e5e5] text-[#6b7280] text-sm font-medium h-[41px] px-5 rounded-full hover:border-[#f77f00] hover:text-[#f77f00] transition-colors whitespace-nowrap"
            >
              ← All Postings
            </button>
            <button
              type="button"
              className="border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-5 rounded-full hover:bg-[#fff8ee] transition-colors whitespace-nowrap"
            >
              Manage Job
            </button>
          </div>
        </div>
      )}

      {appsLoading ? (
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-28" />)}</div>
          <Skeleton className="w-[420px] shrink-0 h-[600px]" />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#e5e7eb] rounded-2xl">
          <p className="text-[#6b7280] font-semibold text-[15px]">No applications yet</p>
          <p className="text-[#9ca3af] text-sm mt-1">Applicants will appear here once people apply.</p>
        </div>
      ) : (
        <div className="flex gap-6 items-start">
          {/* Left: applicant cards */}
          <div className="flex-1 min-w-0">
            <div className="border border-[#bebebe] rounded-[20px] p-[10px] bg-white">
              {pagedApps.map((app, idx) => {
                const isSelected = app.id === selectedId;
                const locationParts: string[] = [];
                if (app.seeker_profile?.current_location) locationParts.push(app.seeker_profile.current_location);
                if (selectedPosting?.work_mode) locationParts.push(selectedPosting.work_mode);
                const locationStr = locationParts.join(', ');
                return (
                  <div key={app.id}>
                    <div onClick={() => setSelectedId(app.id)}
                      className={cn('rounded-[24px] p-[10px] flex items-start justify-between gap-[10px] cursor-pointer transition-colors',
                        isSelected ? 'bg-[#fffaf5]' : 'bg-white hover:bg-[#fffaf5]')}>
                      <div className="flex-1 flex flex-col gap-[12px] min-w-0">
                        <div className="flex flex-col gap-[6px]">
                          <p className="text-[20px] font-medium text-black"
                            style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '24px' }}>
                            {app.name}
                          </p>
                          {selectedPosting?.org_name && (
                            <p className="text-[16px] font-normal text-black"
                              style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '20px' }}>
                              {selectedPosting.org_name}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-[4px] opacity-40">
                          {locationStr && <p className="text-[13px] font-medium text-black">{locationStr}</p>}
                          <p className="text-[13px] font-medium text-black">Applied {timeAgo(app.applied_at)}</p>
                        </div>
                      </div>
                      <DotsMenuButton options={[{
                        label: 'Remove',
                        onClick: () => handleRemove(app.id),
                        danger: true,
                      }]} />
                    </div>
                    {idx < pagedApps.length - 1 && <div className="h-px bg-[#bebebe] w-full" />}
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />}
          </div>

          {/* Right: applicant detail */}
          {selected && selectedPosting && (
            <ApplicantDetailPanel
              selected={selected}
              selectedPosting={selectedPosting}
              applications={applications}
              setApplications={setApplications}
              setSelectedId={setSelectedId}
              statusUpdating={statusUpdating}
              setStatusUpdating={setStatusUpdating}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyPostingsPage() {
  useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isOrg = storedUser?.user_type === 'organization';

  return (
    <div className="min-h-screen bg-[#f8f9fe]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
          {isOrg ? <OrgView /> : (
            <div className="max-w-[900px]">
              <SeekerView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
