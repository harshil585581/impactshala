import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import { fetchMyCourses, fetchCourseApplications } from '../../services/learningService';
import type { MyCourse, CourseApplication } from '../../services/learningService';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { cn } from '@/lib/cn';
import { getAuthenticatedSession } from '../../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

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

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className ?? ''}`} />;
}

function LetterAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colors = ['#6b7280', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#f77f00'];
  const cls = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm';
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: colors[hash % colors.length] }}
    >
      {initials}
    </div>
  );
}

function Accordion({
  title, defaultOpen = false, children,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
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

// Resolves storage paths to signed URLs via backend and labels them with required_documents names
function DocumentsList({ paths, requiredDocs }: { paths: string[]; requiredDocs: string[] }) {
  const [urls, setUrls] = useState<{ name: string; href: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paths.length) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const session = await getAuthenticatedSession();
      const token = session?.access_token ?? '';
      const resolved = await Promise.all(
        paths.map(async (path, i) => {
          const docLabel = requiredDocs[i] ?? `Document ${i + 1}`;
          try {
            const res = await fetch(
              `${API_URL}/api/storage/signed-url?bucket=documents&path=${encodeURIComponent(path)}`,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} },
            );
            if (res.ok) {
              const { url } = await res.json() as { url: string };
              return { name: docLabel, href: url };
            }
          } catch {}
          return { name: docLabel, href: '' };
        }),
      );
      if (!cancelled) { setUrls(resolved); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [paths.join(',')]);

  if (loading) return <div className="px-4 py-3 text-sm text-[#9ca3af]">Loading…</div>;
  if (!urls.length) return <div className="px-4 py-3 text-sm text-[#9ca3af]">No documents submitted.</div>;
  return (
    <div>
      {urls.map((doc, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center justify-between px-4 py-3',
            i < urls.length - 1 ? 'border-b border-[#f3f4f6]' : '',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#f77f00]">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[#374151] text-sm truncate">{doc.name}</span>
          </div>
          {doc.href ? (
            <a
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="shrink-0 ml-2 border border-[#f77f00] text-[#f77f00] text-xs rounded-full h-[26px] px-3 flex items-center justify-center hover:bg-[#fff8ee] transition-colors"
            >
              View
            </a>
          ) : (
            <span className="shrink-0 ml-2 text-xs text-[#9ca3af]">Unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ThreeDotsMenu({ id, openId, setOpenId }: {
  id: string; openId: string | null; setOpenId: (id: string | null) => void;
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
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); setOpenId(null); }}
            className="w-full text-left px-4 py-3 text-sm text-[#374151] hover:bg-gray-50 transition-colors"
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function LearningDirectoryMyApplicationsPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<MyCourse | null>(null);
  const [applications, setApplications] = useState<CourseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Load my courses
  useEffect(() => {
    fetchMyCourses()
      .then(cs => {
        setCourses(cs);
        if (cs.length > 0) setSelectedCourse(cs[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load applicants when course changes
  useEffect(() => {
    if (!selectedCourse) return;
    setAppsLoading(true);
    setApplications([]);
    setSelectedId(null);
    setPage(1);
    fetchCourseApplications(selectedCourse.id)
      .then(apps => {
        setApplications(apps);
        if (apps.length > 0) setSelectedId(apps[0].id);
      })
      .catch(() => {})
      .finally(() => setAppsLoading(false));
  }, [selectedCourse?.id]);

  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const pagedApps = applications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = applications.find(a => a.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">

          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[120px] rounded-none" />
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-3">
                  {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
                <div className="w-[420px] shrink-0"><Skeleton className="h-[500px] rounded-2xl" /></div>
              </div>
            </div>
          ) : courses.length === 0 ? (
            /* ── No courses empty state ── */
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-16 flex flex-col items-center text-center max-w-md w-full">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-4">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[#18191c] font-bold text-base">No courses listed yet</p>
                <p className="text-[#9ca3af] text-sm mt-1 mb-5">
                  List your first course to start receiving applications.
                </p>
                <button
                  onClick={() => navigate('/learning-directory/list-course')}
                  className="bg-[#f77f00] text-white text-sm font-semibold h-10 px-6 rounded-full hover:bg-[#e07000] transition-colors"
                >
                  List a Course
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Course tabs (multiple courses) ── */}
              {courses.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap mb-5">
                  {courses.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCourse(c)}
                      className={cn(
                        'px-5 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
                        selectedCourse?.id === c.id
                          ? 'bg-[#f77f00] text-white border-[#f77f00]'
                          : 'bg-white text-[#f77f00] border-[#f77f00] hover:bg-[#fff8ee]',
                      )}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Course header (sharp edges, like my-postings) ── */}
              {selectedCourse && (
                <div className="bg-white border border-[#e5e7eb] p-5 mb-6 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-full bg-[#18191c] flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-xl">
                        {selectedCourse.title?.charAt(0).toUpperCase() ?? 'C'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-[#18191c] text-2xl sm:text-[28px] font-bold leading-tight">
                        {selectedCourse.title}
                      </h1>
                      <p className="text-[#18191c] text-[15px] mt-0.5 capitalize">
                        {selectedCourse.program_level}
                      </p>
                      <p className="text-[#6b7280] text-sm mt-0.5 capitalize">
                        {selectedCourse.course_mode}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`font-semibold text-sm ${selectedCourse.status === 'published' ? 'text-[#16a34a]' : 'text-[#6b7280]'}`}>
                          {selectedCourse.status === 'published' ? 'Active' : selectedCourse.status.charAt(0).toUpperCase() + selectedCourse.status.slice(1)}
                        </span>
                        <span className="text-[#6b7280] text-sm">•</span>
                        <span className="text-[#6b7280] text-sm">Posted {timeAgo(selectedCourse.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/learning-directory/list-course')}
                    className="shrink-0 px-5 py-2 border border-[#f77f00] text-[#f77f00] rounded-full text-sm font-semibold hover:bg-[#fff8ee] transition-colors whitespace-nowrap"
                  >
                    Manage Post
                  </button>
                </div>
              )}

              {/* ── Applicants heading ── */}
              <h2 className="text-[#18191c] text-xl font-bold mb-4">
                Applicants ({appsLoading ? '…' : applications.length})
              </h2>

              {/* ── Main split layout ── */}
              {appsLoading ? (
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-3">
                    {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                  </div>
                  <div className="w-[420px] shrink-0"><Skeleton className="h-[500px] rounded-2xl" /></div>
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
                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedId(app.id)}
                          className={cn(
                            'rounded-2xl p-4 cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-white border border-[#e5e7eb] shadow-sm'
                              : 'bg-[#fff8f0]',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <LetterAvatar name={app.applicant_name} />
                              <div className="min-w-0">
                                <p className="text-[#18191c] font-bold text-base leading-tight">
                                  {app.applicant_name}
                                </p>
                                <p className="text-[#6b7280] text-sm mt-0.5 truncate">
                                  {app.applicant_email}
                                </p>
                                {app.applicant_mobile && (
                                  <p className="text-[#6b7280] text-sm">{app.applicant_mobile}</p>
                                )}
                                <p className="text-[#9ca3af] text-sm mt-1">
                                  Applied {timeAgo(app.created_at)}
                                </p>
                              </div>
                            </div>
                            <ThreeDotsMenu id={app.id} openId={openMenuId} setOpenId={setOpenMenuId} />
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
                            <LetterAvatar name={selected.applicant_name} size="lg" />
                            <div className="min-w-0">
                              <p className="text-[#18191c] font-semibold text-[15px] leading-tight">
                                {selected.applicant_name}
                              </p>
                              <p className="text-[#6b7280] text-xs mt-0.5 truncate">
                                {selected.applicant_email}
                              </p>
                              {selected.applicant_mobile && (
                                <p className="text-[#6b7280] text-xs">{selected.applicant_mobile}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-4 max-h-[calc(100vh-240px)] overflow-y-auto">
                          <h3 className="text-[#18191c] font-bold text-base">Profile Overview</h3>

                          {/* Cover message */}
                          <div>
                            <p className="text-[#9ca3af] text-xs font-semibold mb-1">Cover Message</p>
                            {selected.message ? (
                              <p className="text-[#374151] text-sm leading-relaxed">{selected.message}</p>
                            ) : (
                              <p className="text-[#9ca3af] text-sm italic">No message provided.</p>
                            )}
                          </div>

                          {/* Applied date */}
                          <div>
                            <p className="text-[#9ca3af] text-xs font-semibold mb-0.5">Applied</p>
                            <p className="text-[#374151] text-sm">
                              {new Date(selected.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </p>
                          </div>

                          {/* View Profile */}
                          <button className="w-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold h-9 rounded-full hover:bg-[#fff8ee] transition-colors">
                            View Profile
                          </button>

                          {/* Accordions */}
                          <Accordion title="Resume">
                            <div className="px-4 py-3 text-sm text-[#9ca3af]">No resume uploaded.</div>
                          </Accordion>

                          <Accordion title="Eligibility">
                            {(selectedCourse?.eligibility_criteria ?? []).length > 0 ? (
                              <div className="px-4 py-3 space-y-1">
                                {selectedCourse!.eligibility_criteria.map((c, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                                    <span className="text-[#f77f00] mt-0.5 shrink-0">•</span>
                                    <span>{c}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="px-4 py-3 text-sm text-[#9ca3af]">No eligibility criteria set.</div>
                            )}
                          </Accordion>

                          <Accordion
                            title={`Documents (${(selected.document_urls ?? []).length})`}
                            defaultOpen={(selected.document_urls ?? []).length > 0}
                          >
                            <DocumentsList
                              paths={selected.document_urls ?? []}
                              requiredDocs={selectedCourse?.required_documents ?? []}
                            />
                          </Accordion>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
