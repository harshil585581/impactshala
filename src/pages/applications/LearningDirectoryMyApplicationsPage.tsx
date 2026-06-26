import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import {
  fetchMyCourses,
  fetchCourseApplications,
  fetchCourseApplicationCountsBatch,
  fetchMyLearningApplications,
} from '../../services/learningService';
import type { MyCourse, CourseApplication, MyLearningApplication } from '../../services/learningService';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { cn } from '@/lib/cn';
import { getAuthenticatedSession } from '../../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PAGE_SIZE = 6;

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

// ─── Shared sub-components ────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className ?? ''}`} />;
}

function LetterAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colors = ['#6b7280', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#f77f00'];
  const cls = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm';
  return (
    <div className={`${cls} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: colors[hash % colors.length] }}>
      {initials}
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
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-2 rounded-full hover:bg-black/5 transition-colors">
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

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#b4b4b4] rounded-[2px]">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between h-[50px] px-[17px] bg-white">
        <span className="text-black font-medium text-base">{title}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          className={`shrink-0 transition-transform duration-200 ${open ? '' : 'rotate-180'}`}>
          <path d="M18 15l-6-6-6 6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="border-t border-[#b4b4b4]">{children}</div>}
    </div>
  );
}

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
  if (loading) return <div className="px-[17px] py-3 text-sm text-[#9ca3af]">Loading…</div>;
  if (!urls.length) return <div className="px-[17px] py-3 text-sm text-[#9ca3af]">No documents submitted.</div>;
  return (
    <div className="flex flex-col gap-3 py-3">
      {urls.map((doc, i) => (
        <div key={i} className="flex items-center gap-2.5 px-[17px]">
          <span className="text-xs text-[#0f172a] flex-1 truncate">{doc.name}</span>
          {doc.href ? (
            <a href={doc.href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="shrink-0 border border-[#f77f00] text-[#f77f00] text-xs rounded-full h-[19px] w-[51px] flex items-center justify-center hover:bg-[#fff8ee] transition-colors">
              View
            </a>
          ) : (
            <span className="shrink-0 text-xs text-[#9ca3af]">N/A</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Seeker View ──────────────────────────────────────────────────────────────

function SeekerView() {
  const [apps, setApps] = useState<MyLearningApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchMyLearningApplications()
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(apps.length / PAGE_SIZE));
  const paged = apps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-[900px] flex flex-col gap-6">
      <div className="border border-[#bebebe] rounded-[20px] p-[10px] bg-white">
        {loading ? (
          <div className="flex flex-col gap-1 p-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="p-[10px] flex flex-col gap-3">
                <Skeleton className="h-6 w-56" /><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center text-[#9ca3af] text-base">No course applications yet.</div>
        ) : (
          paged.map((app, idx) => (
            <div key={app.id}>
              <div className="bg-white rounded-[24px] p-[10px] flex items-start justify-between gap-[10px]">
                <div className="flex-1 flex flex-col gap-[12px] min-w-0">
                  <div className="flex flex-col gap-[6px]">
                    <p className="text-[20px] font-medium text-black"
                      style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '24px' }}>
                      {app.course?.title || '—'}
                    </p>
                    {app.course?.program_level && (
                      <p className="text-[16px] font-normal text-black"
                        style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '20px' }}>
                        {app.course.program_level}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-[4px] opacity-40">
                    {app.course?.course_mode && (
                      <p className="text-[13px] font-medium text-black capitalize">{app.course.course_mode}</p>
                    )}
                    <p className="text-[13px] font-medium text-black">Applied {timeAgo(app.created_at)}</p>
                  </div>
                </div>
                <DotsMenuButton options={[{ label: 'Copy Link', onClick: () => navigator.clipboard.writeText(window.location.href).catch(() => {}) }]} />
              </div>
              {idx < paged.length - 1 && <div className="h-px bg-[#bebebe] w-full" />}
            </div>
          ))
        )}
      </div>
      {!loading && totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />}
    </div>
  );
}

// ─── Org View ─────────────────────────────────────────────────────────────────

function OrgView() {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'applicants'>('list');
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<MyCourse | null>(null);
  const [applications, setApplications] = useState<CourseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchMyCourses()
      .then(async cs => {
        setCourses(cs);
        if (cs.length > 0) {
          const countMap = await fetchCourseApplicationCountsBatch(cs.map(c => c.id));
          setCounts(countMap);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCourse(course: MyCourse) {
    setSelectedCourse(course);
    setView('applicants');
    setApplications([]);
    setSelectedId(null);
    setPage(1);
    setAppsLoading(true);
    fetchCourseApplications(course.id)
      .then(apps => {
        setApplications(apps);
        if (apps.length > 0) setSelectedId(apps[0].id);
      })
      .catch(() => {})
      .finally(() => setAppsLoading(false));
  }

  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const pagedApps = applications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = applications.find(a => a.id === selectedId) ?? null;

  // ── View 1: Courses list ───────────────────────────────────────────────────
  if (view === 'list') {
    if (loading) {
      return (
        <div className="max-w-[900px] border border-[#bebebe] rounded-[20px] p-[10px] bg-white flex flex-col gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="p-[10px] flex flex-col gap-3">
              <Skeleton className="h-6 w-56" /><Skeleton className="h-4 w-44" /><Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      );
    }

    if (courses.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[#6b7280] font-semibold text-base mb-2">No courses listed yet</p>
          <p className="text-[#9ca3af] text-sm mb-5">List your first course to start receiving applications.</p>
          <button onClick={() => navigate('/learning-directory/list-course')}
            className="bg-[#f77f00] text-white text-sm font-semibold h-10 px-6 rounded-full hover:bg-[#e07000] transition-colors">
            List a Course
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-[900px] border border-[#bebebe] rounded-[20px] p-[10px] bg-white">
        {courses.map((course, idx) => {
          const count = counts.get(course.id) ?? 0;
          return (
            <div key={course.id}>
              <div onClick={() => openCourse(course)}
                className="bg-white rounded-[24px] p-[10px] flex items-start justify-between gap-[10px] cursor-pointer hover:bg-[#fffaf5] transition-colors">
                <div className="flex-1 flex flex-col gap-[12px] min-w-0">
                  <div className="flex flex-col gap-[6px]">
                    <p className="text-[20px] font-medium text-black"
                      style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '24px' }}>
                      {course.title || 'Untitled Course'}
                    </p>
                    {course.program_level && (
                      <p className="text-[16px] font-normal text-black"
                        style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '20px' }}>
                        {course.program_level}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-[4px] opacity-40">
                    {course.course_mode && (
                      <p className="text-[13px] font-medium text-black capitalize">{course.course_mode}</p>
                    )}
                    <p className="text-[13px] font-medium text-black">Posted {timeAgo(course.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 mt-1">
                  <span className="text-[#f77f00] text-[14px] font-medium whitespace-nowrap">
                    {count} {count === 1 ? 'Applicant' : 'Applicants'}
                  </span>
                  <DotsMenuButton options={[
                    { label: 'View Applicants', onClick: () => openCourse(course) },
                    { label: 'Manage Course', onClick: () => navigate('/learning-directory/list-course') },
                  ]} />
                </div>
              </div>
              {idx < courses.length - 1 && <div className="h-px bg-[#bebebe] w-full" />}
            </div>
          );
        })}
      </div>
    );
  }

  // ── View 2: Applicants for selected course ─────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Course header card */}
      {selectedCourse && (
        <div className="bg-white border border-[#e5e5e5] px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-semibold text-black leading-tight mb-1">
              {selectedCourse.title}
            </h1>
            {selectedCourse.program_level && (
              <p className="text-sm text-[#49454f] mb-0.5">{selectedCourse.program_level}</p>
            )}
            {selectedCourse.course_mode && (
              <p className="text-sm text-[#49454f] mb-0.5 capitalize">{selectedCourse.course_mode}</p>
            )}
            <p className="text-sm mt-1">
              <span className={selectedCourse.status === 'published' ? 'text-[#05a12c] font-semibold' : 'text-[#6b7280] font-semibold'}>
                {selectedCourse.status === 'published' ? 'Active' : selectedCourse.status.charAt(0).toUpperCase() + selectedCourse.status.slice(1)}
              </span>
              <span className="text-[#6e6e6e]"> • Posted {timeAgo(selectedCourse.created_at)}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 mt-1">
            <button type="button" onClick={() => { setView('list'); setSelectedCourse(null); }}
              className="border border-[#e5e5e5] text-[#6b7280] text-sm font-medium h-[41px] px-5 rounded-full hover:border-[#f77f00] hover:text-[#f77f00] transition-colors whitespace-nowrap">
              ← All Courses
            </button>
            <button type="button" onClick={() => navigate('/learning-directory/list-course')}
              className="border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-5 rounded-full hover:bg-[#fff8ee] transition-colors whitespace-nowrap">
              Manage Course
            </button>
          </div>
        </div>
      )}

      {appsLoading ? (
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="w-[420px] shrink-0 h-[500px]" />
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
                return (
                  <div key={app.id}>
                    <div onClick={() => setSelectedId(app.id)}
                      className={cn('rounded-[24px] p-[10px] flex items-start justify-between gap-[10px] cursor-pointer transition-colors',
                        isSelected ? 'bg-[#fffaf5]' : 'bg-white hover:bg-[#fffaf5]')}>
                      <div className="flex-1 flex flex-col gap-[12px] min-w-0">
                        <div className="flex flex-col gap-[6px]">
                          <p className="text-[20px] font-medium text-black"
                            style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '24px' }}>
                            {app.applicant_name}
                          </p>
                          <p className="text-[16px] font-normal text-black"
                            style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: '20px' }}>
                            {app.applicant_email}
                          </p>
                        </div>
                        <div className="flex flex-col gap-[4px] opacity-40">
                          {app.applicant_mobile && (
                            <p className="text-[13px] font-medium text-black">{app.applicant_mobile}</p>
                          )}
                          <p className="text-[13px] font-medium text-black">Applied {timeAgo(app.created_at)}</p>
                        </div>
                      </div>
                      <DotsMenuButton options={[{ label: 'Copy Link', onClick: () => navigator.clipboard.writeText(window.location.href).catch(() => {}) }]} />
                    </div>
                    {idx < pagedApps.length - 1 && <div className="h-px bg-[#bebebe] w-full" />}
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />}
          </div>

          {/* Right: applicant detail panel */}
          {selected && (
            <div className="w-[420px] shrink-0 bg-white border border-[#e5e5e5] rounded-lg p-5 self-start sticky top-[90px] flex flex-col gap-5 max-h-[calc(100vh-110px)] overflow-y-auto">
              <div className="flex items-start gap-3">
                <LetterAvatar name={selected.applicant_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-black leading-tight">{selected.applicant_name}</p>
                  <p className="text-xs text-[#6b7280] truncate">{selected.applicant_email}</p>
                  {selected.applicant_mobile && (
                    <p className="text-xs text-[#6b7280]">{selected.applicant_mobile}</p>
                  )}
                </div>
              </div>

              <div className="h-px bg-[#e5e5e5]" />

              <div className="flex flex-col gap-4">
                {selected.message && (
                  <div>
                    <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Cover Message</p>
                    <p className="text-sm text-black leading-relaxed">{selected.message}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Applied</p>
                  <p className="text-sm text-black">
                    {new Date(selected.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <button type="button"
                className="border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-4 rounded-full hover:bg-[#fff8ee] transition-colors w-full">
                View Profile
              </button>

              <Accordion title="Resume" defaultOpen>
                <p className="px-[17px] py-3 text-xs text-[#9f9f9f] italic">No resume uploaded.</p>
              </Accordion>

              <Accordion title="Eligibility">
                {(selectedCourse?.eligibility_criteria ?? []).length > 0 ? (
                  <div className="flex flex-col gap-3 py-3">
                    {selectedCourse!.eligibility_criteria.map((c, i) => (
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
                ) : (
                  <p className="px-[17px] py-3 text-xs text-[#9ca3af] italic">No eligibility criteria set.</p>
                )}
              </Accordion>

              <Accordion title="Documents">
                <DocumentsList
                  paths={selected.document_urls ?? []}
                  requiredDocs={selectedCourse?.required_documents ?? []}
                />
              </Accordion>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearningDirectoryMyApplicationsPage() {
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
          {isOrg ? <OrgView /> : <SeekerView />}
        </div>
      </div>
    </div>
  );
}
