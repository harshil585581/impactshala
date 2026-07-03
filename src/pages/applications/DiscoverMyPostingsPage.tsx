import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import {
  fetchMyDiscoverPosts,
  fetchDiscoverPostApplications,
  updateDiscoverApplicationStatus,
  deleteDiscoverApplication,
} from '../../services/discoverService';
import type {
  DiscoverMyPost,
  DiscoverApplication,
  DiscoverApplicationStatus,
} from '../../services/discoverService';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { cn } from '@/lib/cn';

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

function postTags(post: DiscoverMyPost): string[] {
  const parts: string[] = [];
  if (post.domain) parts.push(post.domain);
  if (post.nature) {
    post.nature.split(':').forEach((p) => { const t = p.trim(); if (t) parts.push(t); });
  }
  return parts;
}

const STATUS_LABELS: Record<DiscoverApplicationStatus, string> = {
  applied: 'Applied',
  not_a_fit: 'Not a fit',
  maybe: 'Maybe',
  goodfit: 'Goodfit',
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className ?? ''}`} />;
}

function CollapseSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#b4b4b4] rounded-[2px]">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between h-[50px] px-[17px] bg-white">
        <span className="text-base font-medium text-black">{title}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          className={cn('shrink-0 transition-transform duration-200', open ? '' : 'rotate-180')}>
          <path d="M18 15l-6-6-6 6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="border-t border-[#b4b4b4]">{children}</div>}
    </div>
  );
}

function Avatar({ name, url, size = 56 }: { name: string; url?: string | null; size?: number }) {
  const initial = name?.[0]?.toUpperCase() ?? '?';
  if (url) {
    return <img src={url} alt={name} className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}>
      <span className="text-white font-bold" style={{ fontSize: size * 0.36 }}>{initial}</span>
    </div>
  );
}

const PAGE_SIZE = 5;

export default function DiscoverMyPostingsPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectPostId = searchParams.get('postId');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [posts, setPosts] = useState<DiscoverMyPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<DiscoverMyPost | null>(null);
  const [applications, setApplications] = useState<DiscoverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyDiscoverPosts()
      .then((data) => {
        setPosts(data);
        if (data.length > 0) {
          const preSelected = preSelectPostId ? data.find((p) => p.id === preSelectPostId) : null;
          setSelectedPost(preSelected ?? data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPost) return;
    setAppsLoading(true);
    setApplications([]);
    setSelectedAppId(null);
    setPage(1);
    fetchDiscoverPostApplications(selectedPost.id)
      .then((apps) => {
        setApplications(apps);
        if (apps.length > 0) setSelectedAppId(apps[0].id);
      })
      .catch(() => {})
      .finally(() => setAppsLoading(false));
  }, [selectedPost?.id]);

  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const pagedApps = applications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedApp = applications.find((a) => a.id === selectedAppId) ?? null;

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleDeleteApp(appId: string) {
    setOpenMenuId(null);
    try {
      await deleteDiscoverApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      if (selectedAppId === appId) setSelectedAppId(null);
    } catch {}
  }

  async function handleStatus(appId: string, status: DiscoverApplicationStatus) {
    setStatusUpdating(appId + status);
    try {
      await updateDiscoverApplicationStatus(appId, status);
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    } catch {}
    setStatusUpdating(null);
  }

  const tags = selectedPost ? postTags(selectedPost) : [];

  if (!loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fe]">
        <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen flex items-center justify-center">
          <div className="bg-white border border-[#e5e5e5] p-16 flex flex-col items-center justify-center text-center max-w-md w-full mx-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-4">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[#6b7280] font-semibold text-base">No discover posts yet</p>
            <p className="text-[#9ca3af] text-sm mt-1 mb-5">
              Create your first discover post to start receiving applicants.
            </p>
            <button type="button" onClick={() => navigate('/discover/create/provider')}
              className="bg-[#f77f00] text-white text-sm font-semibold h-10 px-6 rounded-full hover:bg-[#e07000] transition-colors">
              Create Post
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
        <div className="px-4 sm:px-6 py-6 max-w-[1200px] mx-auto gap-6">

          {/* Post header */}
          {loading ? (
            <div className="bg-white border border-[#e5e5e5] px-6 py-5 space-y-2">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : selectedPost ? (
            <div className="bg-white border border-[#e5e5e5] px-6 py-5 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[20px] font-semibold text-black leading-tight mb-1">
                  {selectedPost.title}
                </h1>
                {tags.length > 0 && (
                  <p className="text-sm text-[#49454f] mb-0.5">
                    {tags.join(' • ')}
                  </p>
                )}
                {(selectedPost.address || selectedPost.deliveryMode) && (
                  <p className="text-sm text-[#49454f] mb-0.5">
                    {[selectedPost.address, selectedPost.deliveryMode ? `(${selectedPost.deliveryMode})` : '']
                      .filter(Boolean).join(' ')}
                  </p>
                )}
                <p className="text-sm mt-1">
                  <span className="text-[#05a12c] font-semibold">Active</span>
                  <span className="text-[#6e6e6e]"> • Posted {timeAgo(selectedPost.createdAt)}</span>
                </p>
              </div>
              <button type="button" onClick={() => navigate('/discover')}
                className="shrink-0 border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-6 rounded-full hover:bg-[#fff8ee] transition-colors whitespace-nowrap mt-1">
                Manage Post
              </button>
            </div>
          ) : null}

          <div className="mb-5" />

          {/* Main content */}
          {loading || appsLoading ? (
            <div className="flex gap-6">
              <div className="flex-1 space-y-4">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
              </div>
              <Skeleton className="w-[420px] shrink-0 h-[600px]" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#e5e7eb] rounded">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-3">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[#6b7280] font-semibold text-base">No applications yet</p>
              <p className="text-[#9ca3af] text-sm mt-1">Applicants will appear here once people apply.</p>
            </div>
          ) : (
            <div className="flex gap-6">

              {/* Left: applicant list */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-normal text-black mb-4">
                  Applicants ({applications.length})
                </h2>

                <div className="flex flex-col gap-3">
                  {pagedApps.map((app) => {
                    const isSelected = app.id === selectedAppId;
                    const avatarUrl = app.user_profile?.avatar_url;
                    const appTags = selectedPost ? postTags(selectedPost) : [];
                    const location = app.seeker_profile?.current_location ?? '';
                    const mode = selectedPost?.deliveryMode ?? '';
                    const locationStr = [location, mode ? `(${mode})` : ''].filter(Boolean).join(' ');
                    return (
                      <button key={app.id} type="button" onClick={() => setSelectedAppId(app.id)}
                        className={cn('w-full text-left border border-[#e5e5e5] p-4 rounded-lg transition-colors',
                          isSelected ? 'bg-white shadow-sm' : 'bg-[#fdf3e7]')}>
                        <div className="flex items-start gap-4">
                          <Avatar name={app.name} url={avatarUrl} size={56} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[16px] font-semibold text-black leading-tight">{app.name}</p>
                            {appTags.length > 0 && (
                              <p className="text-xs text-[#49454f] mt-0.5">{appTags.join(' • ')}</p>
                            )}
                            {locationStr && (
                              <p className="text-xs text-[#6e6e6e] mt-0.5">{locationStr}</p>
                            )}
                            <p className="text-xs text-[#6e6e6e] font-semibold mt-1">
                              Applied {timeAgo(app.created_at)}
                            </p>
                          </div>
                          <div className="relative shrink-0" ref={openMenuId === app.id ? menuRef : null}>
                            <button
                              type="button"
                              className="p-2 rounded hover:bg-black/5 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId((prev) => (prev === app.id ? null : app.id));
                              }}
                            >
                              <svg width="4" height="20" viewBox="0 0 4 20" fill="#6b7280">
                                <circle cx="2" cy="2" r="2" /><circle cx="2" cy="10" r="2" /><circle cx="2" cy="18" r="2" />
                              </svg>
                            </button>
                            {openMenuId === app.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e5e5] rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteApp(app.id); }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-6">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="h-8 px-3 rounded-full text-xs font-medium border border-[#e4e5e8] text-[#6b6b6b] hover:border-[#f77f00] hover:text-[#f77f00] disabled:opacity-40 transition-colors flex items-center gap-1">
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
                          <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-[#6b6b6b]">...</span>
                        ) : (
                          <button key={p} type="button" onClick={() => setPage(p as number)}
                            className={cn('w-8 h-8 rounded-full text-xs font-semibold transition-colors',
                              page === p ? 'bg-[#1a1a1a] text-white' : 'border border-[#e4e5e8] text-[#6b6b6b] hover:border-[#f77f00] hover:text-[#f77f00]')}>
                            {p}
                          </button>
                        ),
                      );
                    })()}
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="h-8 px-3 rounded-full text-xs font-medium border border-[#e4e5e8] text-[#6b6b6b] hover:border-[#f77f00] hover:text-[#f77f00] disabled:opacity-40 transition-colors flex items-center gap-1">
                      Next
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: applicant detail */}
              {selectedApp && (
                <div className="w-[420px] shrink-0 bg-white border border-[#e5e5e5] rounded-lg p-5 self-start sticky top-[90px] flex flex-col gap-5 max-h-[calc(100vh-110px)] overflow-y-auto">

                  {/* Header: avatar + name + status buttons */}
                  <div className="flex items-start gap-3 flex-wrap">
                    <Avatar
                      name={selectedApp.name}
                      url={selectedApp.user_profile?.avatar_url}
                      size={46}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-black leading-tight">{selectedApp.name}</p>
                      {selectedApp.seeker_profile?.institute_name && (
                        <p className="text-xs text-[#6b7280]">{selectedApp.seeker_profile.institute_name}</p>
                      )}
                      {(selectedApp.seeker_profile?.current_location || selectedPost?.deliveryMode) && (
                        <p className="text-xs text-[#6b7280]">
                          {[selectedApp.seeker_profile?.current_location, selectedPost?.deliveryMode ? `(${selectedPost.deliveryMode})` : ''].filter(Boolean).join(' ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                      {(['not_a_fit', 'maybe', 'goodfit'] as DiscoverApplicationStatus[]).map((s) => (
                        <button key={s} type="button" disabled={!!statusUpdating}
                          onClick={() => handleStatus(selectedApp.id, s)}
                          className={cn('h-[30px] px-3 rounded-full text-xs whitespace-nowrap transition-colors border',
                            selectedApp.status === s
                              ? 'bg-[#f77f00] text-white border-[#f77f00]'
                              : 'border-[#f77f00] text-[#f77f00] hover:bg-[#fff8ee]')}>
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-[#e5e5e5]" />

                  {/* Profile info */}
                  <div className="flex flex-col gap-4">
                    {(selectedApp.message || selectedApp.seeker_profile?.career_goals || selectedApp.seeker_profile?.work_drives_you || selectedApp.user_profile?.bio) && (
                      <div>
                        <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Bio</p>
                        <p className="text-sm text-black leading-relaxed">
                          {selectedApp.message || selectedApp.seeker_profile?.career_goals || selectedApp.seeker_profile?.work_drives_you || selectedApp.user_profile?.bio}
                        </p>
                      </div>
                    )}

                    {selectedApp.user_profile?.user_type === 'organization' && (
                      (selectedApp.user_profile.work_sector || selectedApp.user_profile.work_industry || selectedApp.user_profile.website)
                    ) && (
                      <div>
                        <p className="text-sm font-semibold text-[#6e6e6e] mb-2">Organization Details</p>
                        <div className="flex flex-col gap-1.5">
                          {selectedApp.user_profile.work_sector && (
                            <p className="text-sm text-black">{selectedApp.user_profile.work_sector}</p>
                          )}
                          {selectedApp.user_profile.work_industry && (
                            <p className="text-sm text-[#6e6e6e]">{selectedApp.user_profile.work_industry}</p>
                          )}
                          {selectedApp.user_profile.website && (
                            <a href={selectedApp.user_profile.website} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-[#f77f00] hover:underline w-fit">
                              {selectedApp.user_profile.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {(selectedApp.experiences?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-[#6e6e6e] mb-2">Experience</p>
                        <div className="flex flex-col gap-3">
                          {selectedApp.experiences!.map((exp, i) => {
                            const start = [exp.start_month, exp.start_year].filter(Boolean).join(' ');
                            const end = exp.is_current ? 'Present' : [exp.end_month, exp.end_year].filter(Boolean).join(' ');
                            const period = [start, end].filter(Boolean).join(' - ');
                            return (
                              <div key={i}>
                                <p className="text-sm font-semibold text-black">{exp.role} at {exp.company}</p>
                                {period && <p className="text-xs text-[#6e6e6e] mt-0.5">{period}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(selectedApp.educations?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-[#6e6e6e] mb-2">Education</p>
                        <div className="flex flex-col gap-3">
                          {selectedApp.educations!.map((edu, i) => {
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

                    {(selectedApp.seeker_profile?.technical_skills?.length || selectedApp.seeker_profile?.soft_skills?.length) ? (
                      <div>
                        <p className="text-sm font-semibold text-[#6e6e6e] mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[...(selectedApp.seeker_profile?.technical_skills ?? []), ...(selectedApp.seeker_profile?.soft_skills ?? [])]
                            .slice(0, 6).map((sk, i) => (
                              <span key={i} className="text-xs bg-[#fff3e0] text-[#f77f00] px-2 py-0.5 rounded-full">{sk}</span>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* View Profile */}
                  <button type="button"
                    onClick={() => selectedApp.user_id && navigate(`/profile/${selectedApp.user_id}`)}
                    disabled={!selectedApp.user_id}
                    className="border border-[#f77f00] text-[#f77f00] text-sm font-medium shrink-0 py-[12px] px-4 rounded-full hover:bg-[#fff8ee] transition-colors w-full disabled:opacity-50">
                    View Profile
                  </button>

                  {/* Resume — from applicant's profile (users.resume_url → signed URL) */}
                  <CollapseSection title="Resume" defaultOpen>
                    {selectedApp.user_profile?.resume_signed_url ? (
                      <div className="flex flex-col gap-3 px-[17px] py-3">
                        <div className="bg-[#e7e7e7] w-full overflow-hidden" style={{ height: 300 }}>
                          <iframe
                            src={selectedApp.user_profile.resume_signed_url}
                            className="w-full h-full"
                            title="Resume Preview"
                          />
                        </div>
                        <div className="flex justify-end">
                          <a
                            href={selectedApp.user_profile.resume_signed_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-4 rounded-full hover:bg-[#fff8ee] transition-colors"
                          >
                            Download
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="px-[17px] py-3 text-xs text-[#9f9f9f] italic">No resume uploaded</p>
                    )}
                  </CollapseSection>

                  {/* Eligibility */}
                  <CollapseSection title="Eligibility">
                    {(selectedPost?.eligibilityCriteria ?? []).length === 0 ? (
                      <p className="px-[17px] py-3 text-xs text-[#9f9f9f] italic">No eligibility criteria</p>
                    ) : (
                      <div className="flex flex-col gap-3 py-3">
                        {selectedPost!.eligibilityCriteria.map((c, i) => (
                          <div key={i} className="flex items-start gap-2.5 px-[17px]">
                            <span className="text-xs text-[#0f172a] flex-1 leading-normal">{c}</span>
                            <div className="shrink-0 w-3.5 h-3.5 mt-0.5 rounded-[4px] bg-[#ff9400] flex items-center justify-center">
                              <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapseSection>

                  {/* Documents */}
                  <CollapseSection title="Documents">
                    {!selectedApp.document_data?.length ? (
                      <p className="px-[17px] py-3 text-xs text-[#9f9f9f] italic">No documents uploaded</p>
                    ) : (
                      <div className="flex flex-col gap-3 py-3">
                        {selectedApp.document_data.map((doc, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-[17px]">
                            <span className="text-xs text-[#0f172a] flex-1 truncate">{doc.name}</span>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                              className="shrink-0 border border-[#f77f00] text-[#f77f00] text-xs rounded-full h-[19px] w-[51px] flex items-center justify-center hover:bg-[#fff8ee] transition-colors">
                              View
                            </a>
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
