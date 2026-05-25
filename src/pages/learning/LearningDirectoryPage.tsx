import { useState, useRef } from "react";
import SubCategoryPills, { type GradeLevel } from "../../features/learning-directory/components/SubCategoryPills";
import CollegeSubCategoryPills, { type AcademicLevel } from "../../features/learning-directory/components/CollegeSubCategoryPills";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = "school" | "college" | "professional";
type LevelTab = "beginner" | "intermediate" | "advanced";
type AppStep = "details" | "eligibility" | "documents" | null;

interface Course {
  id: number;
  image: string;
  university: string;
  title: string;
  academicLevel: string;
  mode: string;
  courseFee: string;
  duration: string;
  applicationDeadline: string;
  eligibilityCriteria: string[];
  requiredDocs: string[];
}

interface FilterState {
  streams: string[];
  modes: string[];
  fees: string[];
  locations: string[];
  educationBoards: string[];
  higherEducationStreams: string[];
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const COURSE_IMG = "https://placehold.co/500x200/1e293b/ffffff?text=Course";

const UPSKILLING_STREAMS = [
  { label: "Technology & IT", count: 32 },
  { label: "Finance & FinTech", count: 14 },
  { label: "Marketing & Sales", count: 14 },
  { label: "Business, Management & Strategy", count: 14 },
  { label: "Design, Media & Creative", count: 14 },
  { label: "Legal, Compliance & Public Policy", count: 14 },
  { label: "Healthcare & Life Sciences", count: 14 },
  { label: "Education & Training", count: 14 },
  { label: "Human Resources & People Ops", count: 14 },
  { label: "Logistics, Supply Chain & Operations", count: 14 },
  { label: "Social Impact & Development Sector", count: 14 },
  { label: "Hospitality, Travel & Tourism", count: 14 },
  { label: "Manufacturing & Engineering", count: 14 },
  { label: "Media, Entertainment & Content", count: 14 },
  { label: "Language & Communication", count: 14 },
  { label: "Others", count: 14 },
];

const LEARNING_MODES = [
  { label: "Onsite", count: 89 },
  { label: "Remote", count: 150 },
  { label: "Hybrid", count: 67 },
];

const FEES_OPTIONS = [
  { label: "Full Payment", count: 32 },
  { label: "In Installment", count: 14 },
  { label: "Open to both", count: 14 },
];

const EDUCATION_BOARD_OPTIONS = [
  { label: "Indian Education Board", count: 32 },
  { label: "International Education Board", count: 14 },
];

const HIGHER_EDUCATION_STREAMS = [
  { label: "STEM (Science, Technology, Engineering & Math)", count: 32 },
  { label: "Commerce, Finance & Business", count: 14 },
  { label: "Arts, Humanities & Social Sciences", count: 14 },
  { label: "Law, Governance & Public Policy", count: 14 },
  { label: "Health, Medicine & Allied Sciences", count: 14 },
  { label: "Design, Media & Creative Arts", count: 14 },
  { label: "Education & Teaching", count: 14 },
  { label: "Vocational, Skill-based & Technical Training", count: 14 },
  { label: "Technology & Digital Skills", count: 14 },
  { label: "Professional Development & Soft Skills", count: 14 },
  { label: "Entrepreneurship & Startup Skills", count: 14 },
  { label: "Test Prep & Competitive Exams", count: 14 },
  { label: "Personal Growth & Wellbeing", count: 14 },
  { label: "Others", count: 14 },
];


const ELIGIBILITY_CRITERIA = [
  "Only for students from Science or Engineering background",
  'Minimum 60% in last qualifying exam" or "CGPA ≥ 6.5',
  "Only for students from Science or Engineering background",
];

const REQUIRED_DOCS = [
  "This opportunity is exclusively for individuals with a background in the fields of Science or Engineering.",
  "Applicants must have achieved at least 60% in their most recent qualifying examination or maintain a CGPA of 6.5 or higher.",
  "This program is tailored specifically for students who have studied Science or Engineering.",
  "Eligibility is limited to those with a background in Science or Engineering disciplines.",
  "This is intended solely for students pursuing degrees in Science or Engineering.",
];

const COURSES: Course[] = [
  {
    id: 1,
    image: COURSE_IMG,
    university: "University of Mumbai, Mumbai",
    title: "Bachelor of Business Administration (BBA) Accountancy",
    academicLevel: "High School (Grade 11 to 12)",
    mode: "Onsite (Bangalore)",
    courseFee: "2 LPA",
    duration: "3 Months",
    applicationDeadline: "16/9/2025",
    eligibilityCriteria: ELIGIBILITY_CRITERIA,
    requiredDocs: REQUIRED_DOCS,
  },
  {
    id: 2,
    image: COURSE_IMG,
    university: "University of Mumbai, Mumbai",
    title: "Bachelor of Business Administration (BBA) Accountancy",
    academicLevel: "High School (Grade 11 to 12)",
    mode: "Onsite (Bangalore)",
    courseFee: "2 LPA",
    duration: "3 Months",
    applicationDeadline: "16/9/2025",
    eligibilityCriteria: ELIGIBILITY_CRITERIA,
    requiredDocs: REQUIRED_DOCS,
  },
  {
    id: 3,
    image: COURSE_IMG,
    university: "University of Mumbai, Mumbai",
    title: "Bachelor of Business Administration (BBA) Accountancy",
    academicLevel: "High School (Grade 11 to 12)",
    mode: "Remote",
    courseFee: "3 LPA",
    duration: "6 Months",
    applicationDeadline: "30/10/2025",
    eligibilityCriteria: ELIGIBILITY_CRITERIA,
    requiredDocs: REQUIRED_DOCS,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterAccordion({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-[#18191c] text-sm font-semibold">{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && <div className="pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-[#f77f00] border-[#f77f00]" : "border-[#d1d5db] group-hover:border-[#f77f00]"
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4l3 3 5-6"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className="text-[#374151] text-xs flex-1 leading-snug">{label}</span>
      <span className="text-[#f77f00] text-xs font-medium bg-[#fff8ee] px-1.5 py-0.5 rounded shrink-0">
        {count}
      </span>
    </label>
  );
}

function CourseCard({
  course,
  saved,
  onToggleSave,
  onGetStarted,
}: {
  course: Course;
  saved: boolean;
  onToggleSave: () => void;
  onGetStarted: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm">
      <img
        src={course.image}
        alt={course.title}
        className="w-full h-[180px] object-cover"
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="#f77f00"
                />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
              <span className="text-[#374151] text-xs">{course.university}</span>
            </div>
            <h3 className="text-[#18191c] font-bold text-base leading-snug">{course.title}</h3>
          </div>
          <button
            onClick={onToggleSave}
            className="shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? "#f77f00" : "none"}>
              <path
                d="M9 5C8.44772 5 8 5.44772 8 6C8 6.55228 8.44772 7 9 7H15C15.5523 7 16 6.55229 16 6C16 5.44772 15.5523 5 15 5H9Z"
                fill={saved ? "#f77f00" : "#6b7280"}
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7 1C5.34315 1 4 2.34315 4 4V20C4 20.3905 4.22734 20.7453 4.58214 20.9085C4.93694 21.0717 5.35428 21.0134 5.65079 20.7593L12 15.3171L18.3492 20.7593C18.6457 21.0134 19.0631 21.0717 19.4179 20.9085C19.7727 20.7453 20 20.3905 20 20V4C20 2.34315 18.6569 1 17 1H7ZM6 4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V17.8258L12.6508 13.2407C12.2763 12.9198 11.7237 12.9198 11.3492 13.2407L6 17.8258V4Z"
                fill={saved ? "#f77f00" : "#6b7280"}
              />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={onGetStarted}
            className="flex-1 bg-[#f77f00] text-white text-sm font-semibold py-2 rounded-full hover:bg-[#e07000] transition-colors"
          >
            Get Started
          </button>
          <button className="flex-1 border border-[#e5e7eb] text-[#374151] text-sm font-medium py-2 rounded-full hover:bg-gray-50 transition-colors">
            Download Brochure
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div>
            <p className="text-[#f77f00] text-xs font-medium">Academic level</p>
            <p className="text-[#18191c] text-sm">{course.academicLevel}</p>
          </div>
          <div>
            <p className="text-[#f77f00] text-xs font-medium">Mode</p>
            <p className="text-[#18191c] text-sm">{course.mode}</p>
          </div>
          <div>
            <p className="text-[#f77f00] text-xs font-medium">Course Fee</p>
            <p className="text-[#18191c] text-sm">{course.courseFee}</p>
          </div>
          <div>
            <p className="text-[#f77f00] text-xs font-medium">Duration</p>
            <p className="text-[#18191c] text-sm">{course.duration}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[#f77f00] text-xs font-medium">Application Deadline</p>
            <p className="text-[#18191c] text-sm">{course.applicationDeadline}</p>
          </div>
        </div>

        <button className="mt-2 text-[#f77f00] text-sm font-medium hover:underline">
          Show more
        </button>
      </div>
    </div>
  );
}

// ─── Application Modals ───────────────────────────────────────────────────────

function ModalOverlay({ children, onClose: _onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-[580px] bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function DetailsModal({
  onClose,
  onNext,
  form,
  onChange,
}: {
  onClose: () => void;
  onNext: () => void;
  form: { name: string; email: string; mobile: string };
  onChange: (field: string, value: string) => void;
}) {
  const canProceed = form.name.trim() && form.email.trim();

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-8">
        <h2 className="text-[#18191c] text-2xl font-bold text-center mb-6">
          Submit your application
        </h2>

        <div className="space-y-4">
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-[#6b7280]">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Enter your name"
              className="w-full border border-[#d1d5db] rounded-lg px-4 py-3 text-sm text-[#18191c] placeholder-[#9ca3af] focus:outline-none focus:border-[#f77f00] transition-colors"
            />
          </div>

          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-[#6b7280]">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-[#d1d5db] rounded-lg px-4 py-3 text-sm text-[#18191c] placeholder-[#9ca3af] focus:outline-none focus:border-[#f77f00] transition-colors"
            />
          </div>

          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-[#6b7280]">
              Mobile Number
            </label>
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => onChange("mobile", e.target.value)}
              placeholder="Enter your Mobile Number"
              className="w-full border border-[#d1d5db] rounded-lg px-4 py-3 text-sm text-[#18191c] placeholder-[#9ca3af] focus:outline-none focus:border-[#f77f00] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-[#f77f00] text-[#f77f00] py-3 rounded-full text-sm font-semibold hover:bg-[#fff8ee] transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 bg-[#f77f00] text-white py-3 rounded-full text-sm font-semibold hover:bg-[#e07000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-4">
          By submitting this form, you agree to our{" "}
          <a href="#" className="text-[#f77f00] hover:underline">
            Terms of Use and consent
          </a>{" "}
          t.
        </p>
      </div>
    </ModalOverlay>
  );
}

function EligibilityModal({
  criteria,
  checked,
  onToggle,
  onBack,
  onNext,
  onClose,
}: {
  criteria: string[];
  checked: boolean[];
  onToggle: (i: number) => void;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const allChecked = checked.every(Boolean);

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <p className="text-[#18191c] text-base font-semibold leading-snug">
            Select the checkboxes below to confirm that you meet the eligibility criteria before
            applying:
          </p>
          <button
            onClick={onClose}
            className="shrink-0 text-[#6b7280] hover:text-[#374151] transition-colors mt-0.5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {criteria.map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                onClick={() => onToggle(i)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  checked[i] ? "bg-[#f77f00] border-[#f77f00]" : "border-[#d1d5db] hover:border-[#f77f00]"
                }`}
              >
                {checked[i] && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4l3 3 5-6"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-[#374151] text-sm leading-relaxed">{text}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 border border-[#f77f00] text-[#f77f00] py-2.5 rounded-full text-sm font-semibold hover:bg-[#fff8ee] transition-colors"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!allChecked}
            className="flex-1 bg-[#f77f00] text-white py-2.5 rounded-full text-sm font-semibold hover:bg-[#e07000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function DocumentsModal({
  docs,
  uploads,
  onUpload,
  message,
  onMessageChange,
  onBack,
  onSubmit,
  onClose,
}: {
  docs: string[];
  uploads: (File | null)[];
  onUpload: (i: number, file: File | null) => void;
  message: string;
  onMessageChange: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <p className="text-[#18191c] text-base font-semibold leading-snug">
            Upload the documents listed below to complete your application. Ensure that all files
            are clear and legible.
          </p>
          <button
            onClick={onClose}
            className="shrink-0 text-[#6b7280] hover:text-[#374151] transition-colors mt-0.5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-5">
          {docs.map((doc, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <p className="text-[#374151] text-sm leading-relaxed flex-1">{doc}</p>
              <div className="shrink-0">
                <input
                  type="file"
                  ref={(el) => { fileRefs.current[i] = el; }}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => onUpload(i, e.target.files?.[0] ?? null)}
                />
                <button
                  onClick={() => fileRefs.current[i]?.click()}
                  className={`p-2 rounded-lg border transition-colors ${
                    uploads[i]
                      ? "border-[#f77f00] bg-[#fff8ee]"
                      : "border-[#e5e7eb] hover:border-[#f77f00] hover:bg-[#fff8ee]"
                  }`}
                  title={uploads[i] ? uploads[i]!.name : "Upload file"}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={uploads[i] ? "text-[#f77f00]" : "text-[#6b7280]"}
                  >
                    <path
                      d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-5">
          <p className="text-[#18191c] font-semibold text-sm mb-2">Message</p>
          <textarea
            value={message}
            onChange={(e) => e.target.value.length <= 500 && onMessageChange(e.target.value)}
            placeholder="Write a short note if you want to share anything before applying"
            rows={4}
            className="w-full border border-[#d1d5db] rounded-xl px-4 py-3 text-sm text-[#18191c] placeholder-[#9ca3af] resize-none focus:outline-none focus:border-[#f77f00] transition-colors"
          />
          <p className="text-right text-xs text-[#9ca3af] mt-1">{message.length}/500 characters</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 border border-[#f77f00] text-[#f77f00] py-2.5 rounded-full text-sm font-semibold hover:bg-[#fff8ee] transition-colors"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-[#f77f00] text-white py-2.5 rounded-full text-sm font-semibold hover:bg-[#e07000] transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function LearningRightSidebar({
  mainTab,
  filters,
  onToggleStream,
  onToggleMode,
  onToggleFee,
  onToggleEducationBoard,
  onToggleHigherEducationStream,
  onApply,
  onReset,
}: {
  mainTab: MainTab;
  filters: FilterState;
  onToggleStream: (s: string) => void;
  onToggleMode: (m: string) => void;
  onToggleFee: (f: string) => void;
  onToggleEducationBoard: (b: string) => void;
  onToggleHigherEducationStream: (s: string) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const [streamOpen, setStreamOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);
  const [educationBoardOpen, setEducationBoardOpen] = useState(false);
  const [higherEdStreamOpen, setHigherEdStreamOpen] = useState(false);
  const [helpDismissed, setHelpDismissed] = useState(false);

  return (
    <aside className="w-[260px] shrink-0 flex flex-col gap-4">
      {/* Filter Card */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[#18191c] font-bold text-base">Filter</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M7 12h10M10 18h4"
              stroke="#6b7280"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="divide-y divide-[#f3f4f6]">
          {/* Professional Upskilling filters */}
          {mainTab === "professional" && (
            <>
              <FilterAccordion
                title="Upskilling Stream"
                isOpen={streamOpen}
                onToggle={() => setStreamOpen((v) => !v)}
              >
                {UPSKILLING_STREAMS.map((s) => (
                  <FilterCheckbox
                    key={s.label}
                    label={s.label}
                    count={s.count}
                    checked={filters.streams.includes(s.label)}
                    onChange={() => onToggleStream(s.label)}
                  />
                ))}
              </FilterAccordion>
              <FilterAccordion
                title="Learning Mode"
                isOpen={modeOpen}
                onToggle={() => setModeOpen((v) => !v)}
              >
                {LEARNING_MODES.map((m) => (
                  <FilterCheckbox
                    key={m.label}
                    label={m.label}
                    count={m.count}
                    checked={filters.modes.includes(m.label)}
                    onChange={() => onToggleMode(m.label)}
                  />
                ))}
              </FilterAccordion>
              <FilterAccordion
                title="Fees"
                isOpen={feesOpen}
                onToggle={() => setFeesOpen((v) => !v)}
              >
                {FEES_OPTIONS.map((f) => (
                  <FilterCheckbox
                    key={f.label}
                    label={f.label}
                    count={f.count}
                    checked={filters.fees.includes(f.label)}
                    onChange={() => onToggleFee(f.label)}
                  />
                ))}
              </FilterAccordion>
            </>
          )}

          {/* School filters */}
          {mainTab === "school" && (
            <>
              <FilterAccordion
                title="Education Board"
                isOpen={educationBoardOpen}
                onToggle={() => setEducationBoardOpen((v) => !v)}
              >
                {EDUCATION_BOARD_OPTIONS.map((b) => (
                  <FilterCheckbox
                    key={b.label}
                    label={b.label}
                    count={b.count}
                    checked={filters.educationBoards.includes(b.label)}
                    onChange={() => onToggleEducationBoard(b.label)}
                  />
                ))}
              </FilterAccordion>
              <FilterAccordion
                title="Learning Mode"
                isOpen={modeOpen}
                onToggle={() => setModeOpen((v) => !v)}
              >
                {LEARNING_MODES.map((m) => (
                  <FilterCheckbox
                    key={m.label}
                    label={m.label}
                    count={m.count}
                    checked={filters.modes.includes(m.label)}
                    onChange={() => onToggleMode(m.label)}
                  />
                ))}
              </FilterAccordion>
              <FilterAccordion
                title="Fees"
                isOpen={feesOpen}
                onToggle={() => setFeesOpen((v) => !v)}
              >
                {FEES_OPTIONS.map((f) => (
                  <FilterCheckbox
                    key={f.label}
                    label={f.label}
                    count={f.count}
                    checked={filters.fees.includes(f.label)}
                    onChange={() => onToggleFee(f.label)}
                  />
                ))}
              </FilterAccordion>
            </>
          )}

          {/* College filters */}
          {mainTab === "college" && (
            <>
              <FilterAccordion
                title="Higher Education Stream"
                isOpen={higherEdStreamOpen}
                onToggle={() => setHigherEdStreamOpen((v) => !v)}
              >
                {HIGHER_EDUCATION_STREAMS.map((s) => (
                  <FilterCheckbox
                    key={s.label}
                    label={s.label}
                    count={s.count}
                    checked={filters.higherEducationStreams.includes(s.label)}
                    onChange={() => onToggleHigherEducationStream(s.label)}
                  />
                ))}
              </FilterAccordion>
              <FilterAccordion
                title="Learning Mode"
                isOpen={modeOpen}
                onToggle={() => setModeOpen((v) => !v)}
              >
                {LEARNING_MODES.map((m) => (
                  <FilterCheckbox
                    key={m.label}
                    label={m.label}
                    count={m.count}
                    checked={filters.modes.includes(m.label)}
                    onChange={() => onToggleMode(m.label)}
                  />
                ))}
              </FilterAccordion>
              <FilterAccordion
                title="Fees"
                isOpen={feesOpen}
                onToggle={() => setFeesOpen((v) => !v)}
              >
                {FEES_OPTIONS.map((f) => (
                  <FilterCheckbox
                    key={f.label}
                    label={f.label}
                    count={f.count}
                    checked={filters.fees.includes(f.label)}
                    onChange={() => onToggleFee(f.label)}
                  />
                ))}
              </FilterAccordion>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onApply}
            className="flex-1 bg-[#f77f00] text-white text-sm font-semibold py-2 rounded-full hover:bg-[#e07000] transition-colors"
          >
            Apply
          </button>
          <button
            onClick={onReset}
            className="flex-1 border border-[#e5e7eb] text-[#374151] text-sm font-medium py-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Help Box */}
      {!helpDismissed && (
        <div className="bg-[#fffcf8] border border-[#ffeacc] rounded-2xl p-4 relative">
          <button
            onClick={() => setHelpDismissed(true)}
            className="absolute top-3 right-3 text-[#9ca3af] hover:text-[#6b7280] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📋</span>
          </div>
          <p className="text-[#f77f00] font-bold text-sm">Help Box</p>
          <p className="text-[#6b7280] text-xs mt-1 leading-relaxed">
            Not able to find what you're looking for? Let us help you.
          </p>
          <button className="mt-3 bg-[#f77f00] text-white text-xs font-semibold px-5 py-2 rounded-full hover:bg-[#e07000] transition-colors">
            Click Here
          </button>
        </div>
      )}

      {/* Promo Card */}
      <div className="bg-[#18191c] text-white rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-gray-400 mb-0.5">Figma Design</p>
          <p className="text-[10px] text-gray-500">Learn & Explore more at impactshala .com</p>
        </div>
        <div className="px-4 pb-4">
          <h4 className="text-white font-semibold text-sm mb-1">UI/UX Certification Course</h4>
          <span className="bg-[#2d2e30] text-[#9ca3af] text-xs px-2 py-0.5 rounded-full">
            Onsite
          </span>
          <p className="text-gray-400 text-xs mt-2 leading-relaxed line-clamp-3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Vivamus ac
            tellus nec velit finibus egestas.
          </p>
          <button className="mt-3 border border-[#f77f00] text-[#f77f00] text-xs font-semibold px-5 py-2 rounded-full hover:bg-[#f77f00] hover:text-white transition-colors">
            Know More
          </button>
        </div>
        <div className="flex justify-center gap-1.5 pb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f77f00]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#4b5563]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#4b5563]" />
        </div>
      </div>
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export default function LearningDirectoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("professional");
  const [levelTab, setLevelTab] = useState<LevelTab>("beginner");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    streams: [],
    modes: [],
    fees: [],
    locations: [],
    educationBoards: [],
    higherEducationStreams: [],
  });

  // Application flow
  const [appStep, setAppStep] = useState<AppStep>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [appForm, setAppForm] = useState({ name: "", email: "", mobile: "" });
  const [eligibilityChecked, setEligibilityChecked] = useState<boolean[]>([]);
  const [docUploads, setDocUploads] = useState<(File | null)[]>([]);
  const [appMessage, setAppMessage] = useState("");

  function openApplication(course: Course) {
    setSelectedCourse(course);
    setEligibilityChecked(new Array(course.eligibilityCriteria.length).fill(false));
    setDocUploads(new Array(course.requiredDocs.length).fill(null));
    setAppMessage("");
    setAppStep("details");
  }

  function closeApplication() {
    setAppStep(null);
    setSelectedCourse(null);
    setAppForm({ name: "", email: "", mobile: "" });
  }

  function handleSubmit() {
    closeApplication();
    // TODO: wire to backend
  }

  function toggleEligibility(i: number) {
    setEligibilityChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  function handleDocUpload(i: number, file: File | null) {
    setDocUploads((prev) => {
      const next = [...prev];
      next[i] = file;
      return next;
    });
  }

  const LEVEL_TABS: { key: LevelTab; label: string }[] = [
    { key: "beginner", label: "Beginner" },
    { key: "intermediate", label: "Intermediate" },
    { key: "advanced", label: "Advanced" },
  ];

  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("pre_school");
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>("high_school");

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="px-4 sm:px-6 py-6">
          {/* Header row: tabs left, button right */}
          <div className="flex items-end justify-between gap-4 mb-0">
            {/* Main tabs */}
            <div className="flex items-center gap-0 border-b border-[#e5e7eb] overflow-x-auto flex-1 min-w-0">
              {(
                [
                  { key: "school", label: "School Admission" },
                  { key: "college", label: "College Admission" },
                  { key: "professional", label: "Professional Upskilling" },
                ] as { key: MainTab; label: string }[]
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setMainTab(t.key)}
                  className={`shrink-0 px-5 py-3 text-sm font-medium border-0 border-b-2 outline-none transition-colors duration-150 whitespace-nowrap ${
                    mainTab === t.key
                      ? "border-b-[#f77f00] text-[#f77f00]"
                      : "border-b-transparent text-[#6b7280] hover:text-[#374151]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button className="shrink-0 bg-[#f77f00] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#e07000] transition-colors mb-1">
              List your course
            </button>
          </div>

          <div className="flex gap-5 items-start mt-5">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Sub-tab pills */}
              {mainTab === "professional" && (
                <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
                  {LEVEL_TABS.map((lt) => (
                    <button
                      key={lt.key}
                      onClick={() => setLevelTab(lt.key)}
                      className={`shrink-0 px-4 py-1 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                        levelTab === lt.key
                          ? "bg-[#f77f00] text-white border-[#f77f00]"
                          : "bg-white text-[#f77f00] border-[#f77f00] hover:bg-[#fff8ee]"
                      }`}
                    >
                      {lt.label}
                    </button>
                  ))}
                </div>
              )}

              {mainTab === "school" && (
                <SubCategoryPills
                  value={gradeLevel}
                  onChange={setGradeLevel}
                  className="mb-5"
                />
              )}

              {mainTab === "college" && (
                <CollegeSubCategoryPills
                  value={academicLevel}
                  onChange={setAcademicLevel}
                  className="mb-5"
                />
              )}

              {/* Course List */}
              <div className="flex flex-col gap-4">
                {COURSES.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    saved={savedIds.includes(course.id)}
                    onToggleSave={() =>
                      setSavedIds((prev) => toggle(prev, course.id))
                    }
                    onGetStarted={() => openApplication(course)}
                  />
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <LearningRightSidebar
              mainTab={mainTab}
              filters={filters}
              onToggleStream={(s) => setFilters((f) => ({ ...f, streams: toggle(f.streams, s) }))}
              onToggleMode={(m) => setFilters((f) => ({ ...f, modes: toggle(f.modes, m) }))}
              onToggleFee={(fee) => setFilters((f) => ({ ...f, fees: toggle(f.fees, fee) }))}
              onToggleHigherEducationStream={(s) => setFilters((f) => ({ ...f, higherEducationStreams: toggle(f.higherEducationStreams, s) }))}
              onToggleEducationBoard={(b) => setFilters((f) => ({ ...f, educationBoards: toggle(f.educationBoards, b) }))}
              onApply={() => {}}
              onReset={() => setFilters({ streams: [], modes: [], fees: [], locations: [], educationBoards: [], higherEducationStreams: [] })}
            />
          </div>
        </div>
      </div>

      {/* Application Flow Modals */}
      {appStep === "details" && (
        <DetailsModal
          onClose={closeApplication}
          onNext={() => setAppStep("eligibility")}
          form={appForm}
          onChange={(field, value) => setAppForm((f) => ({ ...f, [field]: value }))}
        />
      )}

      {appStep === "eligibility" && selectedCourse && (
        <EligibilityModal
          criteria={selectedCourse.eligibilityCriteria}
          checked={eligibilityChecked}
          onToggle={toggleEligibility}
          onBack={() => setAppStep("details")}
          onNext={() => setAppStep("documents")}
          onClose={closeApplication}
        />
      )}

      {appStep === "documents" && selectedCourse && (
        <DocumentsModal
          docs={selectedCourse.requiredDocs}
          uploads={docUploads}
          onUpload={handleDocUpload}
          message={appMessage}
          onMessageChange={setAppMessage}
          onBack={() => setAppStep("eligibility")}
          onSubmit={handleSubmit}
          onClose={closeApplication}
        />
      )}
    </div>
  );
}
