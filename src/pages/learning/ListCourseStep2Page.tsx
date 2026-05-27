import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { uploadCourseImage } from '../../services/learningService';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

type Visibility = 'public' | 'community';

// ─── Curriculum categories ────────────────────────────────────────────────────

const CURRICULUM_CATEGORIES = [
  {
    id: 'learning_approaches',
    label: '1. Learning Approaches',
    sublabel: '(Select all that apply)',
    options: [
      'Project-based learning',
      'Specialized / Career-focused training',
      'Inquiry-Based Learning',
      'Interdisciplinary Curriculum',
      'Flipped Classroom Mode',
      'Socio-emotional / Adaptive Learning',
      'Competency-Based Learning',
      'Montessori method (for early years)',
      'Peer-Based Learning',
      'Activity-Based Learning',
      'Others',
    ],
  },
  {
    id: 'technology_integrations',
    label: '2. Technology Integrations',
    sublabel: '(Select all that apply)',
    options: [
      'Maker Labs / Digital Boards',
      'Lab Integration (Google Classroom, Websites etc.)',
      'AR/VR and Gamification',
      'Coding / Computation-based learning',
      'AI / AI-Based Learning Modules',
      'Others',
    ],
  },
  {
    id: 'global_exposure',
    label: '3. Global and holistic exposure programs',
    sublabel: '(Select all that apply)',
    options: [
      'International Student Exchange',
      'Global Citizenship Curriculum',
      'Foreign Language Programs (Spanish, French etc.)',
      'Cambridge / IB International Education',
      'Model UN / MUN Integration',
      'Others',
    ],
  },
  {
    id: 'skill_career',
    label: '4. Skill and Career readiness programs',
    sublabel: '(Select all that apply)',
    options: [
      'Life Skills Education',
      'Financial Literacy',
      'Career Counseling / Aptitude Testing',
      'Entrepreneurial Mindset Development',
      'College Prep (SAT, TOEFL etc.)',
      'Industry Exposure / Field Visits',
      'Others',
    ],
  },
  {
    id: 'character_wellbeing',
    label: '5. Character and wellbeing initiatives',
    sublabel: '(Select all that apply)',
    options: [
      'Value-Based Education',
      'Mindfulness & Mental Wellness Programs',
      'Social Emotional Learning (SEL)',
      'Physical Education & Sports in Academics',
      'Yoga & Artistic Development',
      'Others',
    ],
  },
  {
    id: 'creative_development',
    label: '6. Creative development opportunities',
    sublabel: '(Select all that apply)',
    options: [
      'Integrating Arts Curriculum',
      'Creative Writing & Public Speaking',
      'Authoring Arts / Editing',
      'Others',
    ],
  },
  {
    id: 'holistic_programs',
    label: '7. Holistic programs or initiatives',
    sublabel: '(Select all that apply)',
    options: [
      'Multidisciplinary Education (Special Needs Support)',
      'Leadership Development',
      'Peer Mentoring & Buddy Programs',
      'Bridge & Support Programs',
      'Others',
    ],
  },
  {
    id: 'co_curricular',
    label: '8. Co-curricular & Extracurricular Programs',
    sublabel: '(Select all that apply)',
    options: [
      'Sports & Physical Education',
      'Performing Arts (Music, Dance, Theatre)',
      'Robotics & STEM',
      'Chess / Academic Clubs',
      'Others',
    ],
  },
  {
    id: 'facilities',
    label: '9. Facilities Available',
    sublabel: '(Select all that apply)',
    options: [
      'Library',
      'Fully-Equipped Lab',
      'Science Labs',
      'Sports Ground',
      'Swimming Pool',
      'Auditorium',
      'Cafeteria',
      'Transport Facility',
      'Boarding / Hostel',
      'Safety & Security',
    ],
  },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function CurriculumSection({
  label,
  sublabel,
  options,
  checked,
  onToggle,
}: {
  label: string;
  sublabel: string;
  options: readonly string[];
  checked: Set<string>;
  onToggle: (opt: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[#18191c] text-sm font-medium">
        {label} <span className="text-[#6b6b6b] font-normal">{sublabel}</span>
      </p>
      <div className="grid grid-cols-3 gap-0 bg-white rounded-lg border border-[#f2f2f3]">
        {options.map((opt) => {
          const isChecked = checked.has(opt);
          return (
            <label key={opt} className="flex items-center gap-2 px-3 py-3 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => onToggle(opt)}
                aria-checked={isChecked}
                role="checkbox"
                className={cn(
                  'shrink-0 w-5 h-5 rounded flex items-center justify-center',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f77f00] focus-visible:ring-offset-1',
                  isChecked ? 'bg-[#f77f00] border-2 border-[#f77f00]' : 'border-2 border-[#c7c7c7]',
                )}
              >
                {isChecked && (
                  <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l4 4 6-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-[#6b6b6b] text-xs leading-4">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[#18191c] text-base font-semibold">{children}</p>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[#18191c] text-sm mb-2">{children}</p>;
}

function StyledInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-11 bg-white border border-[#e4e5e8] rounded-lg px-4 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors"
    />
  );
}

function AmPmToggle({ value, onChange }: { value: 'AM' | 'PM'; onChange: (v: 'AM' | 'PM') => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-[#e4e5e8]">
      {(['AM', 'PM'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'w-10 h-11 text-xs font-semibold transition-colors',
            value === v ? 'bg-[#f77f00] text-white' : 'bg-white text-[#6b6b6b] hover:bg-[#fff8ee]',
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

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

function FileDropZone({
  label,
  hint,
  file,
  onFile,
  accept = 'image/*,.pdf',
}: {
  label: string;
  hint?: string;
  file: File | null;
  onFile: (f: File | null) => void;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          dragging ? 'border-[#f77f00] bg-[#fff8ee]' : 'border-[#e4e5e8] hover:border-[#f77f00]',
        )}
      >
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p className="text-[#18191c] text-sm font-medium">{file.name}</p>
            <p className="text-[#9ca3af] text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="17 8 12 3 7 8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="3" x2="12" y2="15" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <p className="text-[#18191c] text-sm"><span className="text-[#f77f00] font-medium">Browse photo</span> or drop here</p>
            <p className="text-[#9ca3af] text-xs">{hint ?? 'File up to 5MB'}</p>
          </div>
        )}
      </div>
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

export default function ListCourseStep2Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const step1State = (location.state ?? {}) as Record<string, unknown>;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Curriculum features: categoryId → selected options
  const [features, setFeatures] = useState<Record<string, Set<string>>>(
    () => Object.fromEntries(CURRICULUM_CATEGORIES.map((c) => [c.id, new Set<string>()])),
  );

  // Languages
  const [languages, setLanguages] = useState<string[]>(['English', 'Hindi']);
  const [langInput, setLangInput] = useState('');

  // Engagement details
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [startAmPm, setStartAmPm] = useState<'AM' | 'PM'>('AM');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [endAmPm, setEndAmPm] = useState<'AM' | 'PM'>('PM');
  const [lastDateToApply, setLastDateToApply] = useState('');

  // More details
  const [certification, setCertification] = useState('');
  const [otherBenefits, setOtherBenefits] = useState('');
  const [careerOutcomes, setCareerOutcomes] = useState('');

  // Eligibility
  const [eligibility, setEligibility] = useState<string[]>(['']);

  // Documents
  const [documents, setDocuments] = useState<string[]>(['']);

  // Fee
  const [feeType, setFeeType] = useState<'range' | 'fixed'>('range');
  const feeFileRef = useRef<HTMLInputElement>(null);
  const [feeFileName, setFeeFileName] = useState('');

  // Uploads
  const [brochure, setBrochure] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  // Description
  const [description, setDescription] = useState('');

  // Visibility
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [uploading, setUploading] = useState(false);

  function toggleFeature(categoryId: string, opt: string) {
    setFeatures((prev) => {
      const set = new Set(prev[categoryId]);
      set.has(opt) ? set.delete(opt) : set.add(opt);
      return { ...prev, [categoryId]: set };
    });
  }

  function addLanguage() {
    const lang = langInput.trim();
    if (lang && !languages.includes(lang)) {
      setLanguages((prev) => [...prev, lang]);
      setLangInput('');
    }
  }

  function removeLanguage(lang: string) {
    setLanguages((prev) => prev.filter((l) => l !== lang));
  }

  function updateEligibility(i: number, val: string) {
    setEligibility((prev) => { const n = [...prev]; n[i] = val; return n; });
  }
  function removeEligibility(i: number) {
    setEligibility((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateDocument(i: number, val: string) {
    setDocuments((prev) => { const n = [...prev]; n[i] = val; return n; });
  }
  function removeDocument(i: number) {
    setDocuments((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleProceed() {
    setUploading(true);
    try {
      let thumbnailUrl = '';
      let brochureUrl = '';
      if (thumbnail) {
        try { thumbnailUrl = await uploadCourseImage(thumbnail); } catch { /* continue without */ }
      }
      if (brochure) {
        try { brochureUrl = await uploadCourseImage(brochure); } catch { /* continue without */ }
      }
      navigate('/learning-directory/list-course/preview', {
        state: {
          ...step1State,
          features: Object.fromEntries(
            Object.entries(features).map(([k, v]) => [k, Array.from(v)]),
          ),
          languages,
          duration,
          startDate,
          startTime: startTime ? `${startTime} ${startAmPm}` : '',
          endDate,
          endTime: endTime ? `${endTime} ${endAmPm}` : '',
          lastDateToApply,
          certification,
          otherBenefits,
          careerOutcomes,
          eligibility: eligibility.filter(Boolean),
          documents: documents.filter(Boolean),
          feeType,
          description,
          visibility,
          thumbnailUrl,
          brochureUrl,
        },
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px]">
        <div className="flex gap-5 items-start px-4 sm:px-6 py-6">

          {/* ── Form Card ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#f2f2f3] overflow-visible">

            {/* Step header */}
            <div className="px-6 py-5">
              <p className="text-[#f77f00] text-xl font-semibold leading-5">2 of 2: Course details</p>
            </div>
            <hr className="border-[#f2f2f3]" />

            <div className="px-6 py-6 space-y-10">

              {/* ── Special Curriculum Features ── */}
              <div>
                <SectionLabel>Special Curriculum Features</SectionLabel>
                <p className="text-[#6b6b6b] text-sm mt-1 mb-6">
                  Select the most suitable options that best represent all your course's learning options.
                </p>
                <div className="space-y-6">
                  {CURRICULUM_CATEGORIES.map((cat) => (
                    <CurriculumSection
                      key={cat.id}
                      label={cat.label}
                      sublabel={cat.sublabel}
                      options={cat.options}
                      checked={features[cat.id]}
                      onToggle={(opt) => toggleFeature(cat.id, opt)}
                    />
                  ))}
                </div>
              </div>

              <hr className="border-[#f2f2f3]" />

              {/* ── Languages of Instruction ── */}
              <div>
                <SectionLabel>Languages of Instruction</SectionLabel>
                <div className="flex flex-wrap gap-2 mt-3">
                  {languages.map((lang) => (
                    <span key={lang} className="flex items-center gap-1.5 bg-[#f77f00] text-white text-sm px-3 py-1 rounded-full">
                      {lang}
                      <button type="button" onClick={() => removeLanguage(lang)} className="hover:opacity-70 transition-opacity leading-none">×</button>
                    </span>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      value={langInput}
                      onChange={(e) => setLangInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                      placeholder="Add language"
                      className="h-8 border border-[#e4e5e8] rounded-full px-3 text-sm text-[#18191c] focus:outline-none focus:border-[#f77f00] transition-colors w-36"
                    />
                    <button type="button" onClick={addLanguage} className="text-[#f77f00] text-sm font-medium hover:underline">
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-[#f2f2f3]" />

              {/* ── Engagement Details ── */}
              <div className="space-y-5">
                <SectionLabel>Engagement Details</SectionLabel>

                <div>
                  <FieldLabel>Duration</FieldLabel>
                  <StyledInput value={duration} onChange={setDuration} placeholder="e.g. 3 Months, 5 Hours" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Start Date</FieldLabel>
                    <StyledInput value={startDate} onChange={setStartDate} type="date" />
                  </div>
                  <div>
                    <FieldLabel>Start Time</FieldLabel>
                    <div className="flex gap-2">
                      <StyledInput value={startTime} onChange={setStartTime} placeholder="10:00" />
                      <AmPmToggle value={startAmPm} onChange={setStartAmPm} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>End Date</FieldLabel>
                    <StyledInput value={endDate} onChange={setEndDate} type="date" />
                  </div>
                  <div>
                    <FieldLabel>End Time</FieldLabel>
                    <div className="flex gap-2">
                      <StyledInput value={endTime} onChange={setEndTime} placeholder="01:00" />
                      <AmPmToggle value={endAmPm} onChange={setEndAmPm} />
                    </div>
                  </div>
                </div>

                <div>
                  <FieldLabel>Last Date to Apply</FieldLabel>
                  <StyledInput value={lastDateToApply} onChange={setLastDateToApply} type="date" />
                </div>
              </div>

              <hr className="border-[#f2f2f3]" />

              {/* ── More Details ── */}
              <div className="space-y-5">
                <SectionLabel>More Details</SectionLabel>
                <div>
                  <FieldLabel>Certification / Accreditation</FieldLabel>
                  <StyledInput value={certification} onChange={setCertification} placeholder="e.g. ISO certified, NAAC accredited" />
                </div>
                <div>
                  <FieldLabel>Other Benefits / Exposure</FieldLabel>
                  <StyledInput value={otherBenefits} onChange={setOtherBenefits} placeholder="e.g. Industry exposure, field visits" />
                </div>
                <div>
                  <FieldLabel>Career Outcomes / Benefits</FieldLabel>
                  <StyledInput value={careerOutcomes} onChange={setCareerOutcomes} placeholder="e.g. Placement support, certification" />
                </div>
              </div>

              <hr className="border-[#f2f2f3]" />

              {/* ── Eligibility Criteria ── */}
              <div>
                <SectionLabel>Mention the eligibility criteria (if applicable)</SectionLabel>
                <div className="mt-3 space-y-3">
                  {eligibility.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={item}
                        onChange={(e) => updateEligibility(i, e.target.value)}
                        placeholder="Enter your criteria"
                        className="flex-1 h-11 bg-white border border-[#e4e5e8] rounded-lg px-4 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors"
                      />
                      <button type="button" onClick={() => removeEligibility(i)} className="text-[#f77f00] text-sm font-medium hover:underline shrink-0">
                        Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEligibility((p) => [...p, ''])} className="flex items-center gap-1 text-[#f77f00] text-sm font-medium hover:underline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f77f00" strokeWidth="1.5" /><path d="M12 8v8M8 12h8" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    Add
                  </button>
                </div>
              </div>

              <hr className="border-[#f2f2f3]" />

              {/* ── Documents ── */}
              <div>
                <SectionLabel>Document to be attached by applicant</SectionLabel>
                <div className="mt-3 space-y-3">
                  {documents.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={item}
                        onChange={(e) => updateDocument(i, e.target.value)}
                        placeholder="Enter document name"
                        className="flex-1 h-11 bg-white border border-[#e4e5e8] rounded-lg px-4 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors"
                      />
                      <button type="button" onClick={() => removeDocument(i)} className="text-[#f77f00] text-sm font-medium hover:underline shrink-0">
                        Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setDocuments((p) => [...p, ''])} className="flex items-center gap-1 text-[#f77f00] text-sm font-medium hover:underline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f77f00" strokeWidth="1.5" /><path d="M12 8v8M8 12h8" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    Add
                  </button>
                </div>
              </div>

              <hr className="border-[#f2f2f3]" />

              {/* ── Fee Details ── */}
              <div>
                <SectionLabel>Fee Details</SectionLabel>
                <div className="mt-3 flex items-center gap-6">
                  {(['range', 'fixed'] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setFeeType(type)}
                        className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                          feeType === type ? 'border-[#f77f00]' : 'border-[#c7c7c7]',
                        )}
                      >
                        {feeType === type && <div className="w-2 h-2 rounded-full bg-[#f77f00]" />}
                      </div>
                      <span className="text-[#18191c] text-sm capitalize">{type}</span>
                    </label>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <input
                      ref={feeFileRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => setFeeFileName(e.target.files?.[0]?.name ?? '')}
                    />
                    <button
                      type="button"
                      onClick={() => feeFileRef.current?.click()}
                      className="flex items-center gap-1.5 border border-[#f77f00] text-[#f77f00] text-sm font-medium px-4 py-2 rounded-full hover:bg-[#fff8ee] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      {feeFileName ? feeFileName : 'Upload File'}
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-[#f2f2f3]" />

              {/* ── Upload Brochure ── */}
              <FileDropZone
                label="Upload Brochure / Flyers / E-brochures"
                hint="File up to 5MB"
                file={brochure}
                onFile={setBrochure}
                accept=".pdf,.jpg,.jpeg,.png"
              />

              {/* ── Upload Thumbnail ── */}
              <FileDropZone
                label="Upload Thumbnail / Cover Image"
                hint="Recommended 1200×628 px — File up to 5MB"
                file={thumbnail}
                onFile={setThumbnail}
                accept="image/*"
              />

              <hr className="border-[#f2f2f3]" />

              {/* ── Description ── */}
              <div>
                <SectionLabel>Add any additional details if required</SectionLabel>
                <div className="mt-3 border border-[#e4e5e8] rounded-xl overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-[#e4e5e8] bg-[#fafafa]">
                    {['B', 'I', 'U'].map((fmt) => (
                      <button key={fmt} type="button" className={cn('w-7 h-7 rounded text-sm font-bold text-[#6b6b6b] hover:bg-[#f0f0f0] transition-colors flex items-center justify-center', fmt === 'B' && 'font-extrabold', fmt === 'I' && 'italic', fmt === 'U' && 'underline')}>
                        {fmt}
                      </button>
                    ))}
                    <div className="w-px h-5 bg-[#e4e5e8] mx-1" />
                    {['≡', '☰'].map((ic, i) => (
                      <button key={i} type="button" className="w-7 h-7 rounded text-sm text-[#6b6b6b] hover:bg-[#f0f0f0] transition-colors flex items-center justify-center">
                        {ic}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a description about your course…"
                    rows={6}
                    className="w-full px-4 py-3 text-sm text-[#18191c] placeholder-[#9ca3af] resize-none focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
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
                disabled={uploading}
                onClick={handleProceed}
                className={cn(
                  'text-[13px] font-medium rounded-full transition-colors',
                  uploading
                    ? 'bg-[#f7a050] text-white cursor-not-allowed'
                    : 'bg-[#f77f00] text-white hover:bg-[#e07000]',
                )}
                style={{ width: 120, height: 39 }}
              >
                {uploading ? 'Uploading…' : 'Preview'}
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
