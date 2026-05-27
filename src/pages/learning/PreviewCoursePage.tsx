import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { createCourse } from '../../services/learningService';
import { fetchProfile } from '../../services/profileService';
import type { UserProfile } from '../../types/profile';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

type Visibility = 'public' | 'community';
type ProgramLevel = 'school' | 'college' | 'professional';

const PROGRAM_LEVEL_LABELS: Record<ProgramLevel, string> = {
  school: 'For School Students',
  college: 'For College Students',
  professional: 'For Working Professionals',
};

const CURRICULUM_CATEGORIES = [
  { id: 'learning_approaches',    label: 'Learning Approaches' },
  { id: 'technology_integrations',label: 'Technology Integrations' },
  { id: 'global_exposure',        label: 'Global and holistic exposure programs' },
  { id: 'skill_career',           label: 'Skill and Career readiness programs' },
  { id: 'character_wellbeing',    label: 'Character and wellbeing initiatives' },
  { id: 'creative_development',   label: 'Creative development opportunities' },
  { id: 'holistic_programs',      label: 'Holistic programs or initiatives' },
  { id: 'co_curricular',          label: 'Co-curricular & Extracurricular Programs' },
  { id: 'facilities',             label: 'Facilities Available' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[#18191c] font-bold text-base mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p className="text-sm leading-relaxed">
      <span className="font-semibold text-[#18191c]">{label} : </span>
      <span className="text-[#6b7280]">{value}</span>
    </p>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[#fff3e0] text-[#f77f00] text-xs font-medium px-3 py-1 rounded-full">
      {children}
    </span>
  );
}

function VisibilityDropdown({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  const [open, setOpen] = useState(false);
  const OPTS = [
    { value: 'public' as Visibility, label: 'Public', sub: 'seen to everyone' },
    { value: 'community' as Visibility, label: 'My Community', sub: 'seen to community only' },
  ];
  const current = OPTS.find((o) => o.value === value)!;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f77f00] rounded">
        <span className="text-[#6b6b6b] text-base">Visible To : </span>
        <span className="text-[#121212] text-base font-medium">{current.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn('transition-transform duration-150', open ? 'rotate-180' : '')}>
          <path d="M6 9l6 6 6-6" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[340px] bg-white border border-[#d6d6d6] rounded-xl shadow-lg overflow-hidden z-30">
          {OPTS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn('w-full text-left flex items-center gap-1 px-4 py-3 hover:bg-[#fff8ee] transition-colors', isSelected ? 'border-l-4 border-[#f77f00]' : 'border-l-4 border-transparent')}>
                <span className={cn('font-semibold text-base', isSelected ? 'text-[#f77f00]' : 'text-[#18191c]')}>{opt.label} : </span>
                <span className={cn('text-sm', isSelected ? 'text-[#f77f00]' : 'text-[#6b6b6b]')}>{opt.sub}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormSidebar() {
  const [helpDismissed, setHelpDismissed] = useState(false);
  return (
    <aside className="w-[260px] shrink-0 flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <div className="h-20 bg-[#14313a] relative">
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-[#e2e8f0] border-[3px] border-white overflow-hidden shadow-sm flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#94a3b8" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#94a3b8" /></svg>
          </div>
        </div>
        <div className="pt-10 pb-4 px-4 text-center">
          <p className="text-[#18191c] font-bold text-base">Michael Anderson</p>
          <p className="text-[#6b7280] text-xs mt-0.5">UI/UX Designer • Accenture</p>
          <div className="flex items-center justify-around mt-3 pt-3 border-t border-[#f3f4f6]">
            <div className="text-center"><p className="text-[#18191c] font-bold text-sm">183</p><p className="text-[#9ca3af] text-[10px]">Reviews</p></div>
            <div className="w-px h-8 bg-[#e5e7eb]" />
            <div className="text-center"><p className="text-[#18191c] font-bold text-sm">56</p><p className="text-[#9ca3af] text-[10px]">Achievement</p></div>
            <div className="w-px h-8 bg-[#e5e7eb]" />
            <div className="text-center"><p className="text-[#f77f00] font-bold text-sm">1.2K</p><p className="text-[#9ca3af] text-[10px] leading-tight">Community<br />Members</p></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <p className="px-4 pt-3 pb-2 text-[#18191c] font-bold text-sm">Recommended Post</p>
        <div className="bg-[#18191c] px-4 py-3">
          <p className="text-white font-semibold text-sm">Figma Design</p>
          <p className="text-gray-400 text-[10px] mt-0.5">Learn &amp; Explore more at impactshala.com</p>
        </div>
        <div className="px-4 py-3">
          <h4 className="text-[#18191c] font-bold text-sm mb-2">UI/UX Certification Course</h4>
          <span className="bg-[#fff3e0] text-[#f77f00] text-xs px-3 py-0.5 rounded-full">Onsite</span>
          <p className="text-[#6b7280] text-xs mt-2 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <button className="mt-3 w-full border border-[#f77f00] text-[#f77f00] text-xs font-semibold py-2 rounded-full hover:bg-[#fff8ee] transition-colors">Know More</button>
        </div>
        <div className="flex justify-center gap-1.5 pb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f77f00]" /><div className="w-1.5 h-1.5 rounded-full bg-[#d6d6d6]" /><div className="w-1.5 h-1.5 rounded-full bg-[#d6d6d6]" />
        </div>
      </div>
      {!helpDismissed && (
        <div className="bg-[#fffcf8] border border-[#ffeacc] rounded-2xl p-4 relative">
          <button onClick={() => setHelpDismissed(true)} className="absolute top-3 right-3 text-[#9ca3af] hover:text-[#6b7280] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <span className="text-xl">📋</span>
          <p className="text-[#f77f00] font-bold text-sm mt-1">Help Box</p>
          <p className="text-[#6b7280] text-xs mt-1 leading-relaxed">Not able to find what you're looking for? Let us help you.</p>
          <button className="mt-3 bg-[#f77f00] text-white text-xs font-semibold px-5 py-2 rounded-full hover:bg-[#e07000] transition-colors">Click Here</button>
        </div>
      )}
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PreviewCoursePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as Record<string, unknown>;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(
    (state.visibility as Visibility | undefined) ?? 'public',
  );
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => {
    fetchProfile('me').then(setProfile).catch(() => {});
  }, []);

  const authorName = profile
    ? ([profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.orgName || 'Anonymous')
    : '';
  const authorSubtitle = profile
    ? ([profile.title, profile.company].filter(Boolean).join(' • ') || profile.orgName || '')
    : '';

  // Step 1 data
  const programLevel = (state.programLevel as ProgramLevel | undefined) ?? 'school';
  const courseTitle = (state.courseTitle as string | undefined) ?? '';
  const courseMode = (state.courseMode as string | undefined) ?? '';
  const venue = (state.venue as string | undefined) ?? '';
  const onlineAccess = (state.onlineAccess as string | undefined) ?? '';
  const educationBoard = (state.educationBoard as string | undefined) ?? '';
  const boardAffiliation = (state.boardAffiliation as string | undefined) ?? '';
  const admissionFor = (state.admissionFor as string[] | undefined) ?? [];
  const gradesFor = (state.gradesFor as string[] | undefined) ?? [];
  const academicLevels = (state.academicLevels as string[] | undefined) ?? [];
  const collegeStream = (state.collegeStream as string | undefined) ?? '';
  const courseLevels = (state.courseLevels as string[] | undefined) ?? [];
  const proStream = (state.proStream as string | undefined) ?? '';

  // Step 2 data
  const features = (state.features as Record<string, string[]> | undefined) ?? {};
  const languages = (state.languages as string[] | undefined) ?? [];
  const duration = (state.duration as string | undefined) ?? '';
  const startDate = (state.startDate as string | undefined) ?? '';
  const startTime = (state.startTime as string | undefined) ?? '';
  const endDate = (state.endDate as string | undefined) ?? '';
  const endTime = (state.endTime as string | undefined) ?? '';
  const lastDateToApply = (state.lastDateToApply as string | undefined) ?? '';
  const certification = (state.certification as string | undefined) ?? '';
  const otherBenefits = (state.otherBenefits as string | undefined) ?? '';
  const careerOutcomes = (state.careerOutcomes as string | undefined) ?? '';
  const eligibility = (state.eligibility as string[] | undefined) ?? [];
  const documents = (state.documents as string[] | undefined) ?? [];
  const description = (state.description as string | undefined) ?? '';
  const thumbnailUrl = (state.thumbnailUrl as string | undefined) ?? '';

  // Tags derived from step 1
  const levelLabel = PROGRAM_LEVEL_LABELS[programLevel];
  const levelTags: string[] = programLevel === 'school'
    ? admissionFor
    : programLevel === 'college'
    ? academicLevels
    : courseLevels;

  const hasMoreDetails = certification || otherBenefits || careerOutcomes;
  const hasEngagement = duration || startDate || endDate || lastDateToApply;
  const hasAccess = venue || onlineAccess;
  const hasSkills = CURRICULUM_CATEGORIES.some((c) => (features[c.id] ?? []).length > 0);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px]">
        <div className="flex gap-5 items-start px-4 sm:px-6 py-6">

          {/* ── Preview Card ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5">
              <p className="text-[#f77f00] text-xl font-semibold">Preview your application</p>
            </div>
            <hr className="border-[#f2f2f3]" />

            <div className="px-6 py-6 space-y-6">

              {/* Cover image */}
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt={courseTitle} className="w-full h-[200px] object-cover rounded-xl" />
              ) : (
                <div className="w-full h-[200px] bg-[#18191c] rounded-xl overflow-hidden flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#6b7280" strokeWidth="1.5" /><path d="M3 15l5-5 4 4 3-3 6 6" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8.5" cy="8.5" r="1.5" fill="#6b7280" /></svg>
                </div>
              )}

              {/* Title & author */}
              {courseTitle && (
                <h2 className="text-[#18191c] text-xl font-bold leading-snug">{courseTitle}</h2>
              )}

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#e2e8f0] overflow-hidden flex items-center justify-center shrink-0">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#94a3b8" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#94a3b8" /></svg>
                  )}
                </div>
                <div>
                  <p className="text-[#18191c] text-sm font-semibold">{authorName}</p>
                  <p className="text-[#6b7280] text-xs">{authorSubtitle || levelLabel}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Tag>{levelLabel}</Tag>
                {courseMode && <Tag>{courseMode.charAt(0).toUpperCase() + courseMode.slice(1)}</Tag>}
                {levelTags.slice(0, 2).map((t) => <Tag key={t}>{t}</Tag>)}
                {educationBoard && <Tag>{educationBoard === 'indian' ? 'Indian Education Board' : 'International Education Board'}</Tag>}
                {boardAffiliation && <Tag>{boardAffiliation}</Tag>}
                {collegeStream && <Tag>{collegeStream}</Tag>}
                {proStream && <Tag>{proStream}</Tag>}
              </div>

              {/* More Details */}
              {hasMoreDetails && (
                <PreviewSection title="More Details">
                  <PreviewRow label="Certification / Accreditation" value={certification} />
                  <PreviewRow label="Other Benefits / Exposure" value={otherBenefits} />
                  <PreviewRow label="Career Outcomes / Benefits" value={careerOutcomes} />
                </PreviewSection>
              )}

              {/* Engagement Details */}
              {hasEngagement && (
                <PreviewSection title="Engagement Details">
                  <PreviewRow label="Duration" value={duration} />
                  <PreviewRow label="Application deadline" value={lastDateToApply} />
                  {startDate && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <PreviewRow label="Start Date" value={startDate} />
                      <PreviewRow label="Time" value={startTime} />
                      <PreviewRow label="End Date" value={endDate} />
                      <PreviewRow label="Time" value={endTime} />
                    </div>
                  )}
                </PreviewSection>
              )}

              {/* Access Details */}
              {hasAccess && (
                <PreviewSection title="Access Details">
                  <PreviewRow label="Onsite Venue" value={venue} />
                  <PreviewRow label="Online Access" value={onlineAccess} />
                </PreviewSection>
              )}

              {/* Skills, Tools & Attributes */}
              {hasSkills && (
                <PreviewSection title="Skills, Tools & Attributes">
                  {CURRICULUM_CATEGORIES.map((cat, i) => {
                    const selected = features[cat.id] ?? [];
                    if (selected.length === 0) return null;
                    return (
                      <div key={cat.id}>
                        <p className="text-[#18191c] text-xs font-semibold">{i + 1}. {cat.label} <span className="font-normal text-[#6b6b6b]">(Select all that apply)</span></p>
                        <p className="text-[#6b7280] text-sm mt-0.5">{selected.join(', ')}</p>
                      </div>
                    );
                  })}
                </PreviewSection>
              )}

              {/* Languages */}
              {languages.length > 0 && (
                <PreviewSection title="Language">
                  <p className="text-sm text-[#6b7280]">{languages.join(', ')}</p>
                </PreviewSection>
              )}

              {/* Eligibility */}
              {eligibility.length > 0 && (
                <PreviewSection title="Eligibility Criteria">
                  {eligibility.map((e, i) => (
                    <p key={i} className="text-sm text-[#6b7280] leading-relaxed">• {e}</p>
                  ))}
                </PreviewSection>
              )}

              {/* Documents */}
              {documents.length > 0 && (
                <PreviewSection title="Documents Required">
                  {documents.map((d, i) => (
                    <p key={i} className="text-sm text-[#6b7280] leading-relaxed">• {d}</p>
                  ))}
                </PreviewSection>
              )}

              {/* Description */}
              {description && (
                <PreviewSection title="Description">
                  <p className="text-sm text-[#6b7280] leading-relaxed whitespace-pre-wrap">{description}</p>
                </PreviewSection>
              )}
            </div>

            {/* Footer */}
            {publishError && (
              <div className="px-6 py-2 bg-red-50 border-t border-red-100 text-center">
                <p className="text-red-600 text-xs">{publishError}</p>
              </div>
            )}
            <hr className="border-[#f2f2f3]" />
            <div className="px-6 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="border border-[#f77f00] text-[#f77f00] text-[13px] font-medium rounded-full hover:bg-[#fff8ee] transition-colors"
                style={{ width: 120, height: 39 }}
              >
                Back
              </button>
              <VisibilityDropdown value={visibility} onChange={setVisibility} />
              <button
                type="button"
                disabled={publishing}
                onClick={async () => {
                  setPublishing(true);
                  setPublishError(null);
                  try {
                    await createCourse({
                      programLevel: programLevel,
                      courseTitle: courseTitle,
                      courseMode: courseMode,
                      venue: venue,
                      onlineAccess: onlineAccess,
                      visibility: visibility,
                      admissionFor: admissionFor,
                      educationBoard: educationBoard,
                      boardAffiliation: boardAffiliation,
                      gradesFor: gradesFor,
                      academicLevels: academicLevels,
                      collegeStream: collegeStream,
                      courseLevels: courseLevels,
                      proStream: proStream,
                      features: features,
                      languages: languages,
                      duration: duration,
                      startDate: startDate,
                      startTime: startTime,
                      endDate: endDate,
                      endTime: endTime,
                      lastDateToApply: lastDateToApply,
                      certification: certification,
                      otherBenefits: otherBenefits,
                      careerOutcomes: careerOutcomes,
                      eligibility: eligibility,
                      documents: documents,
                      feeType: (state.feeType as string | undefined) ?? '',
                      description: description,
                    });
                    navigate('/learning-directory');
                  } catch (e: unknown) {
                    setPublishError(e instanceof Error ? e.message : 'Failed to publish');
                    setPublishing(false);
                  }
                }}
                className={cn(
                  'text-[13px] font-medium rounded-full transition-colors',
                  publishing
                    ? 'bg-[#f7a050] text-white cursor-not-allowed'
                    : 'bg-[#f77f00] text-white hover:bg-[#e07000]',
                )}
                style={{ width: 120, height: 39 }}
              >
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <FormSidebar />
        </div>
      </div>
    </div>
  );
}
