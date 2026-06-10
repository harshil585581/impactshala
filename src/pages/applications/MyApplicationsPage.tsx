import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import {
  fetchMyApplicationsAsSeeker,
  fetchMyEmployerPostings,
  fetchApplicationCountsForPostings,
} from '../../services/employmentService';
import type { MyApplication, EmployerPosting, ApplicationStatus } from '../../services/employmentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Tab = 'all' | 'applied' | 'maybe' | 'goodfit' | 'not_a_fit';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'Applied' },
  { key: 'maybe', label: 'Hold' },
  { key: 'goodfit', label: 'Accepted' },
  { key: 'not_a_fit', label: 'Rejected' },
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: 'bg-gray-100 text-gray-600',
  not_a_fit: 'bg-red-50 text-red-500',
  maybe: 'bg-yellow-50 text-yellow-600',
  goodfit: 'bg-green-50 text-green-600',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  not_a_fit: 'Rejected',
  maybe: 'On Hold',
  goodfit: 'Accepted',
};

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

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className}`} />;
}

// ─── Seeker view ──────────────────────────────────────────────────────────────

function SeekerView() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    fetchMyApplicationsAsSeeker()
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'all' ? apps : apps.filter(a => a.status === activeTab);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setPage(1); }}
            className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap
              ${activeTab === t.key ? 'bg-[#f77f00] text-white border-[#f77f00]' : 'bg-white text-[#f77f00] border-[#f77f00] hover:bg-[#fff8ee]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e7eb]">
        {loading ? (
          <div className="p-6 flex flex-col gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="px-6 py-16 text-center text-[#9ca3af] text-base">
            No applications in this category.
          </div>
        ) : (
          paged.map((app, idx) => (
            <div key={app.id}>
              <div className={`flex items-start justify-between px-6 py-5 ${idx === 0 ? 'rounded-t-2xl' : ''} ${idx === paged.length - 1 ? 'rounded-b-2xl' : ''}`}>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-[#18191c] text-xl font-bold leading-tight">
                    {app.posting?.job_title ?? '—'}
                  </h3>
                  <p className="text-[#18191c] text-[15px] mt-0.5">{app.posting?.org_name ?? ''}</p>
                  {app.posting?.work_mode && (
                    <p className="text-[#9ca3af] text-sm mt-0.5">{app.posting.work_mode}</p>
                  )}
                  <p className="text-[#9ca3af] text-sm mt-0.5">Applied {timeAgo(app.applied_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 pt-1">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>
              </div>
              {idx < paged.length - 1 && <div className="h-px bg-[#e5e7eb] mx-6" />}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${page === p ? 'bg-[#18191c] text-white' : 'text-[#374151] hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
          {totalPages > 6 && <span className="text-[#9ca3af] text-sm px-1">...</span>}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}
    </>
  );
}

// ─── Employer view ────────────────────────────────────────────────────────────

function EmployerView() {
  const navigate = useNavigate();
  const [postings, setPostings] = useState<EmployerPosting[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    fetchMyEmployerPostings()
      .then(async (posts) => {
        setPostings(posts);
        const c = await fetchApplicationCountsForPostings(posts.map(p => p.id));
        setCounts(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(postings.length / PAGE_SIZE));
  const paged = postings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e5e7eb]">
        {loading ? (
          <div className="p-6 flex flex-col gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[#9ca3af] text-base">No job postings yet.</p>
            <button
              onClick={() => navigate('/employment-hub/employer')}
              className="mt-4 px-6 py-2 bg-[#f77f00] text-white rounded-full text-sm font-semibold hover:bg-[#e68500] transition-colors"
            >
              Create a Posting
            </button>
          </div>
        ) : (
          paged.map((post, idx) => (
            <div key={post.id}>
              <div
                className={`flex items-start justify-between px-6 py-5 cursor-pointer hover:bg-[#fff8f0] transition-colors
                  ${idx === 0 ? 'rounded-t-2xl' : ''} ${idx === paged.length - 1 ? 'rounded-b-2xl' : ''}`}
                onClick={() => navigate(`/applications/detail/${post.id}`)}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-[#18191c] text-xl font-bold leading-tight">{post.job_title}</h3>
                  <p className="text-[#18191c] text-[15px] mt-0.5">{post.job_type ?? post.work_mode ?? '—'}</p>
                  {post.work_mode && post.job_type && (
                    <p className="text-[#9ca3af] text-sm mt-0.5">{post.work_mode}</p>
                  )}
                  <p className="text-[#9ca3af] text-sm mt-0.5">Posted on {formatDate(post.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 pt-1">
                  <span className="text-[#f77f00] font-medium text-sm whitespace-nowrap">
                    {counts.get(post.id) ?? 0} {(counts.get(post.id) ?? 0) === 1 ? 'Applicant' : 'Applicants'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#9ca3af]">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              {idx < paged.length - 1 && <div className="h-px bg-[#e5e7eb] mx-6" />}
            </div>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${page === p ? 'bg-[#18191c] text-white' : 'text-[#374151] hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
          {totalPages > 6 && <span className="text-[#9ca3af] text-sm px-1">...</span>}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyApplicationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isOrg = storedUser?.user_type === 'organization';

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-[#18191c] text-2xl font-bold mb-5">My Applications</h1>
          {isOrg ? <EmployerView /> : <SeekerView />}
        </div>
      </div>
    </div>
  );
}
