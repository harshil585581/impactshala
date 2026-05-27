import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
// ─── Types ────────────────────────────────────────────────────────────────────

type EducationBoard = '' | 'indian' | 'international';
type Visibility = 'public' | 'community';
type ProgramLevel = 'school' | 'college' | 'professional';
type CourseMode = '' | 'onsite' | 'remote' | 'hybrid';

// ─── School constants ─────────────────────────────────────────────────────────

const GRADE_OPTIONS = [
  'Pre-School (Pre K - UKG)',
  'Primary School (Grade 1 to 4)',
  'Secondary School (Grade 5 to 7)',
  'Senior Secondary School (Grade 8 to 10)',
  'High School (Grade 11 to 12)',
];

const INDIAN_BOARD_OPTIONS = [
  'State Board',
  'Central Board of Secondary Education (CBSE)',
  'Indian Certificate of Secondary Education (ICSE)',
  'Council for the Indian School Certificate Examination (CISCE)',
  'National Institute of Open Schooling (NIOS)',
];

const INTERNATIONAL_BOARD_OPTIONS = [
  'International Baccalaureate (IB)',
  'CAIE (Cambridge Assessment International Education)',
];

const EDUCATION_BOARD_OPTIONS = [
  { value: 'indian', label: 'Indian Education Board' },
  { value: 'international', label: 'International Education Board' },
];

// ─── College constants ────────────────────────────────────────────────────────

const COLLEGE_ACADEMIC_LEVELS = [
  'High School (Grade 11 to 12)',
  'Diploma',
  'Under Graduate',
  'Post Graduate',
  'PhD',
];

const COLLEGE_STREAMS = [
  'STEM (Science, Technology, Engineering & Math)',
  'Commerce, Finance & Business',
  'Arts, Humanities & Social Sciences',
  'Law, Governance & Public Policy',
  'Health, Medicine & Allied Sciences',
  'Design, Media & Creative Arts',
  'Education & Teaching',
  'Vocational, Skill-based & Technical Training',
  'Technology & Digital Skills',
  'Professional Development & Soft Skills',
  'Entrepreneurship & Startup Skills',
  'Test Prep & Competitive Exams',
  'Personal Growth & Wellbeing',
  'Others',
];

// ─── Professional constants ───────────────────────────────────────────────────

const PROFESSIONAL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const PROFESSIONAL_STREAMS = [
  'Technology & IT',
  'Finance & FinTech',
  'Marketing & Sales',
  'Business, Management & Strategy',
  'Design, Media & Creative',
  'Legal, Compliance & Public Policy',
  'Healthcare & Life Sciences',
  'Education & Training',
  'Human Resources & People Ops',
  'Logistics, Supply Chain & Operations',
  'Social Impact & Development Sector',
  'Hospitality, Travel & Tourism',
  'Manufacturing & Engineering',
  'Media, Entertainment & Content',
  'Language & Communication',
  'Others',
];

// ─── Shared constants ─────────────────────────────────────────────────────────

const COURSE_MODE_OPTIONS = [
  { value: 'onsite', label: 'Onsite' },
  { value: 'remote', label: 'Remote / Online' },
  { value: 'hybrid', label: 'Hybrid' },
];

const PROGRAM_LEVEL_LABELS: Record<ProgramLevel, string> = {
  school: 'For School Students',
  college: 'For College Students',
  professional: 'For Working Professionals',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function toggleSet(set: Set<string>, val: string): Set<string> {
  const next = new Set(set);
  next.has(val) ? next.delete(val) : next.add(val);
  return next;
}

// ─── PillDropdown ─────────────────────────────────────────────────────────────

interface PillDropdownOption {
  value: string;
  label: string;
}

function PillDropdown({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: PillDropdownOption[];
  placeholder?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#18191c] text-base leading-5">{label}</p>
      <div className="relative" ref={ref}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={cn(
            'w-full h-12 bg-white border border-[#e4e5e8] rounded-full flex items-center justify-between px-4',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f77f00] focus-visible:ring-offset-2',
            disabled && 'opacity-60 cursor-not-allowed',
            !disabled && 'cursor-pointer',
          )}
        >
          <span className={cn('text-base leading-5', selectedLabel ? 'text-[#18191c]' : 'text-[#9f9f9f]')}>
            {selectedLabel || placeholder || 'Select'}
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={cn('shrink-0 transition-transform duration-150', open ? 'rotate-180' : '')}>
            <path d="M6 9l6 6 6-6" stroke="#9f9f9f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 bg-white border border-[#d6d6d6] rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={cn(
                    'w-full text-left flex items-center px-4 py-3 text-base hover:bg-[#fff8ee] transition-colors',
                    isSelected ? 'text-[#f77f00] font-semibold border-l-4 border-[#f77f00]' : 'text-[#6b6b6b] border-l-4 border-transparent',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CheckboxGroup ────────────────────────────────────────────────────────────

function CheckboxGroup({
  label,
  options,
  checked,
  onToggle,
  cols = 3,
}: {
  label: string;
  options: string[];
  checked: Set<string>;
  onToggle: (v: string) => void;
  cols?: 2 | 3;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#18191c] text-base leading-5">{label}</p>
      <div className={cn('bg-white rounded-lg border border-[#f2f2f3]', cols === 3 ? 'grid grid-cols-3' : 'grid grid-cols-2')}>
        {options.map((opt) => {
          const isChecked = checked.has(opt);
          return (
            <label key={opt} className="flex items-center gap-3 px-3 py-3.5 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => onToggle(opt)}
                aria-checked={isChecked}
                role="checkbox"
                className={cn(
                  'shrink-0 w-5 h-5 rounded flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f77f00] focus-visible:ring-offset-1',
                  isChecked ? 'bg-[#f77f00] border-2 border-[#f77f00]' : 'border-2 border-[#c7c7c7]',
                )}
              >
                {isChecked && (
                  <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l4 4 6-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-[#6b6b6b] text-sm leading-5">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#18191c] text-base leading-5">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ''}
        className="w-full h-12 bg-white border border-[#e4e5e8] rounded-full px-4 text-base text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors"
      />
    </div>
  );
}

// ─── VisibilityDropdown ───────────────────────────────────────────────────────

function VisibilityDropdown({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);
  const OPTS = [
    { value: 'public' as Visibility, label: 'Public', sub: 'seen to everyone' },
    { value: 'community' as Visibility, label: 'My Community', sub: 'seen to community only' },
  ];
  const current = OPTS.find((o) => o.value === value)!;
  return (
    <div className="relative" ref={ref}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ListCoursePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const programLevel =
    (location.state as { programLevel?: ProgramLevel } | null)?.programLevel ?? 'school';

  // Shared
  const [courseTitle, setCourseTitle] = useState('');
  const [courseMode, setCourseMode] = useState<CourseMode>('');
  const [venue, setVenue] = useState('');
  const [onlineAccess, setOnlineAccess] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');

  // School
  const [admissionFor, setAdmissionFor] = useState<Set<string>>(new Set());
  const [educationBoard, setEducationBoard] = useState<EducationBoard>('');
  const [boardAffiliation, setBoardAffiliation] = useState('');
  const [gradesFor, setGradesFor] = useState<Set<string>>(new Set());

  // College
  const [academicLevels, setAcademicLevels] = useState<Set<string>>(new Set());
  const [collegeStream, setCollegeStream] = useState('');

  // Professional
  const [courseLevels, setCourseLevels] = useState<Set<string>>(new Set());
  const [proStream, setProStream] = useState('');

  const affiliationOptions = educationBoard === 'indian'
    ? INDIAN_BOARD_OPTIONS.map((o) => ({ value: o, label: o }))
    : educationBoard === 'international'
    ? INTERNATIONAL_BOARD_OPTIONS.map((o) => ({ value: o, label: o }))
    : [];

  const canProceed = (() => {
    if (!courseTitle.trim() || !courseMode) return false;
    if (programLevel === 'school') return admissionFor.size > 0 && educationBoard !== '';
    if (programLevel === 'college') return academicLevels.size > 0 && collegeStream !== '';
    if (programLevel === 'professional') return courseLevels.size > 0 && proStream !== '';
    return false;
  })();

  function handleProceed() {
    navigate('/learning-directory/list-course/step2', {
      state: {
        programLevel,
        courseTitle,
        courseMode,
        venue,
        onlineAccess,
        // school
        admissionFor: Array.from(admissionFor),
        educationBoard,
        boardAffiliation,
        gradesFor: Array.from(gradesFor),
        // college
        academicLevels: Array.from(academicLevels),
        collegeStream,
        // professional
        courseLevels: Array.from(courseLevels),
        proStream,
      },
    });
  }

  const showVenue = courseMode === 'onsite' || courseMode === 'hybrid';
  const showOnline = courseMode === 'remote' || courseMode === 'hybrid';

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px]">
        <div className="flex gap-5 items-start px-4 sm:px-6 py-6">

          {/* ── Form Card ── */}
          <div className="w-full max-w-[920px] mx-auto bg-white rounded-2xl border border-[#f2f2f3] overflow-visible">

            {/* Step header */}
            <div className="px-6 py-5">
              <p className="text-[#f77f00] text-xl font-semibold leading-5">1 of 2: General information</p>
            </div>
            <hr className="border-[#f2f2f3]" />

            {/* Fields */}
            <div className="px-6 py-6 space-y-8">

              {/* Program Level */}
              <div className="flex flex-col gap-3">
                <p className="text-[#18191c] text-base leading-5 font-medium">Program Level</p>
                <div className="w-fit h-12 bg-[#f77f00] text-white text-base font-medium px-6 rounded-full flex items-center">
                  {PROGRAM_LEVEL_LABELS[programLevel]}
                </div>
              </div>

              {/* Course Title */}
              <TextInput
                label="Course / Program Title"
                value={courseTitle}
                onChange={setCourseTitle}
                placeholder="Enter your course or program name"
              />

              {/* ── School-specific fields ── */}
              {programLevel === 'school' && (
                <>
                  <CheckboxGroup
                    label="Admission Open For"
                    options={GRADE_OPTIONS}
                    checked={admissionFor}
                    onToggle={(v) => setAdmissionFor((prev) => toggleSet(prev, v))}
                  />

                  <PillDropdown
                    label="Education Board"
                    value={educationBoard}
                    options={EDUCATION_BOARD_OPTIONS}
                    onChange={(v) => { setEducationBoard(v as EducationBoard); setBoardAffiliation(''); }}
                  />

                  <PillDropdown
                    label="Specific Education board affiliation"
                    value={boardAffiliation}
                    options={affiliationOptions}
                    onChange={setBoardAffiliation}
                    disabled={educationBoard === ''}
                    placeholder="Select affiliation"
                  />

                  {educationBoard !== '' && (
                    <CheckboxGroup
                      label="Admission Open For Which Grades"
                      options={GRADE_OPTIONS}
                      checked={gradesFor}
                      onToggle={(v) => setGradesFor((prev) => toggleSet(prev, v))}
                    />
                  )}
                </>
              )}

              {/* ── College-specific fields ── */}
              {programLevel === 'college' && (
                <>
                  <CheckboxGroup
                    label="Academic Level"
                    options={COLLEGE_ACADEMIC_LEVELS}
                    checked={academicLevels}
                    onToggle={(v) => setAcademicLevels((prev) => toggleSet(prev, v))}
                    cols={2}
                  />

                  <PillDropdown
                    label="Higher Education Stream"
                    value={collegeStream}
                    options={COLLEGE_STREAMS.map((s) => ({ value: s, label: s }))}
                    placeholder="Select stream"
                    onChange={setCollegeStream}
                  />
                </>
              )}

              {/* ── Professional-specific fields ── */}
              {programLevel === 'professional' && (
                <>
                  <CheckboxGroup
                    label="Course Level"
                    options={PROFESSIONAL_LEVELS}
                    checked={courseLevels}
                    onToggle={(v) => setCourseLevels((prev) => toggleSet(prev, v))}
                    cols={2}
                  />

                  <PillDropdown
                    label="Professional / Industry Stream"
                    value={proStream}
                    options={PROFESSIONAL_STREAMS.map((s) => ({ value: s, label: s }))}
                    placeholder="Select stream"
                    onChange={setProStream}
                  />
                </>
              )}

              {/* ── Shared: Course Mode ── */}
              <PillDropdown
                label="Course Mode"
                value={courseMode}
                options={COURSE_MODE_OPTIONS}
                placeholder="Select mode"
                onChange={(v) => setCourseMode(v as CourseMode)}
              />

              {showVenue && (
                <TextInput
                  label="Onsite Venue / Location"
                  value={venue}
                  onChange={setVenue}
                  placeholder="e.g. Impactshaala Auditorium, JP Nagar, Bangalore"
                />
              )}

              {showOnline && (
                <TextInput
                  label="Online Access"
                  value={onlineAccess}
                  onChange={setOnlineAccess}
                  placeholder="e.g. Zoom Link (provided after registration)"
                />
              )}
            </div>

            {/* Footer */}
            <hr className="border-[#f2f2f3]" />
            <div className="px-6 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/learning-directory')}
                className="border border-[#f77f00] text-[#f77f00] text-[13px] font-medium rounded-full hover:bg-[#fff8ee] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f77f00] focus-visible:ring-offset-2"
                style={{ width: 120, height: 39 }}
              >
                Back
              </button>

              <VisibilityDropdown value={visibility} onChange={setVisibility} />

              <button
                type="button"
                disabled={!canProceed}
                onClick={handleProceed}
                className={cn(
                  'text-[13px] font-medium rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  canProceed
                    ? 'bg-[#f77f00] text-white hover:bg-[#e07000] focus-visible:ring-[#f77f00]'
                    : 'bg-[#eaeaea] text-[#121212] border border-[#b4b4b4] cursor-not-allowed',
                )}
                style={{ width: 120, height: 39 }}
              >
                Proceed
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
