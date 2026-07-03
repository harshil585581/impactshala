import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import {
  fetchMyDiscoverApplications,
  withdrawDiscoverApplication,
  fetchMyDiscoverPosts,
  fetchDiscoverPostApplications,
} from '../../services/discoverService';
import type { MyDiscoverApplication, DiscoverMyPost, DiscoverApplication } from '../../services/discoverService';
import { useRequireAuth } from '../../hooks/useRequireAuth';

type FilterTab = 'applied' | 'received' | 'accepted' | 'hold' | 'rejected';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'received', label: 'Received' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'hold', label: 'Hold' },
  { key: 'rejected', label: 'Rejected' },
];

// Accepted/Hold/Rejected reflect the status the post owner assigned to an
// applicant on one of *their own* posts — not anything this user applied for.
const RECEIVED_STATUS_TABS: Partial<Record<FilterTab, DiscoverApplication['status']>> = {
  accepted: 'goodfit',
  hold: 'maybe',
  rejected: 'not_a_fit',
};

type ReceivedApplication = { post: DiscoverMyPost; app: DiscoverApplication };

function FilterTabsBar({ activeTab, onSelect }: { activeTab: FilterTab; onSelect: (tab: FilterTab) => void }) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {FILTER_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSelect(tab.key)}
          className={`h-[48px] px-[24px] rounded-[24px] text-[16px] font-medium border transition-colors whitespace-nowrap ${
            activeTab === tab.key
              ? 'bg-[#ff9400] text-white border-[#ff9400]'
              : 'bg-white text-[#ff9400] border-[#ff9400] hover:bg-[#fff8ee]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const PAGE_SIZE = 6;

function timeAgo(iso: string, prefix: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${prefix} ${mins || 1} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${prefix} ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${prefix} ${days} ${days === 1 ? 'day' : 'days'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${prefix} ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  return `${prefix} ${Math.floor(days / 30)} months ago`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded-lg ${className ?? ''}`} />;
}

function DotsMenuButton({
  options,
}: {
  options: { label: string; onClick: () => void; danger?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="p-2 rounded-full hover:bg-black/5 transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#9ca3af">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e5e5] rounded-xl shadow-lg py-1 z-30 min-w-[180px]">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); opt.onClick(); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt.danger ? 'text-red-500 hover:bg-red-50' : 'text-[#18191c] hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
}) {
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1 text-[#374151] text-sm font-medium px-3 py-2 rounded-full hover:bg-gray-100 disabled:opacity-40 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Previous
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="w-10 h-10 flex items-center justify-center text-sm text-[#9ca3af]">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p as number)}
            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
              page === p
                ? 'bg-[#1a1a1a] text-white'
                : 'text-[#374151] hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center gap-1 text-[#374151] text-sm font-medium px-3 py-2 rounded-full hover:bg-gray-100 disabled:opacity-40 transition-colors"
      >
        Next
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Applications view (identical for individual & organization accounts) ────
//
// Every account can both apply to other users' Discover posts and own posts
// that receive applications, so the tabs read from three independent sources:
//   - Applied                     -> applications *this user submitted*
//   - Received                    -> posts *this user owns*, with applicant counts
//   - Accepted/Hold/Rejected      -> applicants on posts *this user owns*, filtered
//                                    by the status this user assigned them

function ApplicationsView({ isOrg }: { isOrg: boolean }) {
  const navigate = useNavigate();
  const [apps, setApps] = useState<MyDiscoverApplication[]>([]);
  const [posts, setPosts] = useState<DiscoverMyPost[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<ReceivedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('applied');
  const [page, setPage] = useState(1);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const orgName =
    storedUser.org_name ||
    [storedUser.first_name, storedUser.last_name].filter(Boolean).join(' ') ||
    '';

  useEffect(() => {
    Promise.all([fetchMyDiscoverApplications(), fetchMyDiscoverPosts()])
      .then(async ([fetchedApps, fetchedPosts]) => {
        setApps(fetchedApps);
        setPosts(fetchedPosts);
        const perPost = await Promise.all(
          fetchedPosts.map(async (post) => {
            const postApps = await fetchDiscoverPostApplications(post.id).catch(() => []);
            return postApps.map((app) => ({ post, app }));
          }),
        );
        setReceivedApplications(perPost.flat());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleWithdraw(appId: string) {
    setWithdrawing(appId);
    try {
      await withdrawDiscoverApplication(appId);
      setApps((prev) => prev.filter((a) => a.id !== appId));
    } catch {}
    setWithdrawing(null);
  }

  function goToPostings(postId: string) {
    navigate(`/applications/postings?postId=${postId}`);
  }

  const isReceivedTab = activeTab === 'received';
  const isStatusTab = activeTab === 'accepted' || activeTab === 'hold' || activeTab === 'rejected';

  const filteredApps = activeTab === 'applied' ? apps : [];
  const filteredPosts = isReceivedTab ? posts : [];
  const filteredReceived = isStatusTab
    ? receivedApplications.filter((r) => r.app.status === RECEIVED_STATUS_TABS[activeTab])
    : [];

  const totalItems = isReceivedTab ? filteredPosts.length : isStatusTab ? filteredReceived.length : filteredApps.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const pagedApps = filteredApps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedPosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedReceived = filteredReceived.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-[30px]">
      {/* Filter tabs */}
      <FilterTabsBar activeTab={activeTab} onSelect={(tab) => { setActiveTab(tab); setPage(1); }} />

      {/* Card list */}
      <div className="border border-[#bebebe] rounded-[20px] p-[10px] bg-white">
        {loading ? (
          <div className="flex flex-col gap-1 p-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="p-[10px] flex flex-col gap-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        ) : isReceivedTab && pagedPosts.length === 0 && posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#9ca3af] text-base mb-4">No discover posts yet.</p>
            <button
              type="button"
              onClick={() => navigate(isOrg ? '/discover/create/provider' : '/discover/create/seeker')}
              className="px-6 py-2 bg-[#ff9400] text-white rounded-full text-sm font-semibold hover:bg-[#e68500] transition-colors"
            >
              Create Post
            </button>
          </div>
        ) : isReceivedTab && pagedPosts.length === 0 ? (
          <div className="py-16 text-center text-[#9ca3af] text-base">
            No postings in this category.
          </div>
        ) : isStatusTab && pagedReceived.length === 0 ? (
          <div className="py-16 text-center text-[#9ca3af] text-base">
            No applications in this category.
          </div>
        ) : !isReceivedTab && !isStatusTab && pagedApps.length === 0 ? (
          <div className="py-16 text-center text-[#9ca3af] text-base">
            No applications in this category.
          </div>
        ) : isReceivedTab ? (
          pagedPosts.map((post, idx) => {
            const locationParts: string[] = [];
            if (post.address) locationParts.push(post.address);
            if (post.deliveryMode) locationParts.push(post.deliveryMode);
            const locationStr = locationParts.join(', ');
            const count = post.applicant_count ?? 0;

            return (
              <div key={post.id}>
                <div
                  className="bg-white rounded-[24px] p-[10px] flex items-start justify-between gap-[10px] cursor-pointer hover:bg-[#fffaf5] transition-colors"
                  onClick={() => goToPostings(post.id)}
                >
                  <div className="flex-1 flex flex-col gap-[12px] min-w-0">
                    <div className="flex flex-col gap-[6px]">
                      <p
                        className="text-[20px] font-medium text-black"
                        style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '24px' }}
                      >
                        {post.title || '—'}
                      </p>
                      {orgName && (
                        <p
                          className="text-[16px] font-normal text-black"
                          style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '20px' }}
                        >
                          {orgName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-[4px] opacity-40">
                      {locationStr && (
                        <p className="text-[13px] font-medium text-black">{locationStr}</p>
                      )}
                      <p className="text-[13px] font-medium text-black">
                        {timeAgo(post.createdAt, 'Posted')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#ff9400] text-sm font-semibold whitespace-nowrap">
                      {count} {count === 1 ? 'Applicant' : 'Applicants'}
                    </span>
                    <DotsMenuButton
                      options={[
                        {
                          label: 'View Applicants',
                          onClick: () => goToPostings(post.id),
                        },
                      ]}
                    />
                  </div>
                </div>
                {idx < pagedPosts.length - 1 && (
                  <div className="h-px bg-[#bebebe] w-full" />
                )}
              </div>
            );
          })
        ) : isStatusTab ? (
          pagedReceived.map(({ post, app }, idx) => {
            const locationParts: string[] = [];
            if (post.address) locationParts.push(post.address);
            if (post.deliveryMode) locationParts.push(post.deliveryMode);
            const locationStr = locationParts.join(', ');

            return (
              <div key={app.id}>
                <div
                  className="bg-white rounded-[24px] p-[10px] flex items-start justify-between gap-[10px] cursor-pointer hover:bg-[#fffaf5] transition-colors"
                  onClick={() => goToPostings(post.id)}
                >
                  <div className="flex-1 flex flex-col gap-[12px] min-w-0">
                    <div className="flex flex-col gap-[6px]">
                      <p
                        className="text-[20px] font-medium text-black"
                        style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '24px' }}
                      >
                        {post.title || '—'}
                      </p>
                      {app.name && (
                        <p
                          className="text-[16px] font-normal text-black"
                          style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '20px' }}
                        >
                          {app.name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-[4px] opacity-40">
                      {locationStr && (
                        <p className="text-[13px] font-medium text-black">{locationStr}</p>
                      )}
                      <p className="text-[13px] font-medium text-black">
                        {timeAgo(app.created_at, 'Applied')}
                      </p>
                    </div>
                  </div>
                  <DotsMenuButton
                    options={[
                      {
                        label: 'View Applicant',
                        onClick: () => goToPostings(post.id),
                      },
                    ]}
                  />
                </div>
                {idx < pagedReceived.length - 1 && (
                  <div className="h-px bg-[#bebebe] w-full" />
                )}
              </div>
            );
          })
        ) : (
          pagedApps.map((app, idx) => {
            const locationParts: string[] = [];
            if (app.post?.address) locationParts.push(app.post.address);
            if (app.post?.delivery_mode) locationParts.push(app.post.delivery_mode);
            const locationStr = locationParts.join(', ');

            const c = app.post_creator;
            const creatorName = c
              ? c.org_name || [c.first_name, c.last_name].filter(Boolean).join(' ')
              : '';

            return (
              <div key={app.id}>
                <div className="bg-white rounded-[24px] p-[10px] flex items-start justify-between gap-[10px]">
                  <div className="flex-1 flex flex-col gap-[12px] min-w-0">
                    <div className="flex flex-col gap-[6px]">
                      <p
                        className="text-[20px] font-medium text-black"
                        style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '24px' }}
                      >
                        {app.post?.title || '—'}
                      </p>
                      {creatorName && (
                        <p
                          className="text-[16px] font-normal text-black"
                          style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '20px' }}
                        >
                          {creatorName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-[4px] opacity-40">
                      {locationStr && (
                        <p className="text-[13px] font-medium text-black">{locationStr}</p>
                      )}
                      <p className="text-[13px] font-medium text-black">
                        {timeAgo(app.created_at, 'Applied')}
                      </p>
                    </div>
                  </div>
                  <DotsMenuButton
                    options={[
                      {
                        label: withdrawing === app.id ? 'Withdrawing…' : 'Withdraw Application',
                        onClick: () => handleWithdraw(app.id),
                        danger: true,
                      },
                    ]}
                  />
                </div>
                {idx < pagedApps.length - 1 && (
                  <div className="h-px bg-[#bebebe] w-full" />
                )}
              </div>
            );
          })
        )}
      </div>

      {!loading && totalPages > 1 && (
        <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoverAppliedPage() {
  useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isOrg = storedUser?.user_type === 'organization';

  return (
    <div className="min-h-screen bg-[#f8f9fe]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
          <div className="max-w-[900px]">
            <ApplicationsView isOrg={isOrg} />
          </div>
        </div>
      </div>
    </div>
  );
}
