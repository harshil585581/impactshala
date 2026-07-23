import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SubCategoryPills, { type GradeLevel } from "../../features/learning-directory/components/SubCategoryPills";
import CollegeSubCategoryPills, { type AcademicLevel } from "../../features/learning-directory/components/CollegeSubCategoryPills";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import { fetchCourses, applyToCourse, type CourseRecord } from "../../services/learningService";
import { fetchMyProfile } from "../../services/accountService";
import {
  saveLearningCourse,
  unsaveLearningCourse,
  fetchSavedLearningCourseIds,
} from "../../services/savedService";
import HelpBox from "../../components/discover/HelpBox";
import PromoCard from "../../components/discover/PromoCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = "school" | "college" | "professional";
type LevelTab = "" | "beginner" | "intermediate" | "advanced";
type AppStep = "eligibility" | "documents" | "success" | null;

interface Course {
  id: string;
  image: string;
  university: string;
  title: string;
  academicLevel: string;
  mode: string;
  stream: string;
  courseFee: string;
  duration: string;
  applicationDeadline: string;
  eligibilityCriteria: string[];
  requiredDocs: string[];
  // Expanded details
  certification: string;
  otherBenefits: string;
  careerOutcomes: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  onsiteVenue: string;
  onlineAccess: string;
  brochureUrl: string;
  allAdmissionFor: string[];
  allAcademicLevels: string[];
  allCourseLevels: string[];
}

interface FilterState {
  modes: string[];
  streams: string[];
  scholarships: string[];
  fees: string[];
  participantLevels: string[];
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const COURSE_IMG = "https://placehold.co/500x200/1e293b/ffffff?text=Course";

const UPSKILLING_STREAMS = [
  "Technology & IT",
  "Finance & FinTech",
  "Marketing & Sales",
  "Business, Management & Strategy",
  "Design, Media & Creative",
  "Legal, Compliance & Public Policy",
  "Healthcare & Life Sciences",
  "Education & Training",
  "Human Resources & People Ops",
  "Logistics, Supply Chain & Operations",
  "Social Impact & Development Sector",
  "Hospitality, Travel & Tourism",
  "Manufacturing & Engineering",
  "Media, Entertainment & Content",
  "Language & Communication",
  "Others",
];

const LEARNING_MODES = ["Onsite", "Remote", "Hybrid"];

// Matches the real `fee_type` values ('range' | 'fixed') stored on a course
const FEES_OPTIONS = ["Fixed", "Range"];

const SCHOLARSHIP_OPTIONS = ["Yes", "No"];

const SCHOOL_PARTICIPANT_LEVELS = [
  "Pre-School (Pre K - UKG)",
  "Primary School (Grade 1 to 4)",
  "Secondary School (Grade 5 to 7)",
  "Senior Secondary School (Grade 8 to 10)",
  "High School (Grade 11 to 12)",
];

const COLLEGE_PARTICIPANT_LEVELS = [
  "High School (Grade 11 to 12)",
  "Diploma",
  "Under Graduate",
  "Post Graduate",
  "PhD",
];

const PROFESSIONAL_PARTICIPANT_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const EDUCATION_BOARD_OPTIONS = ["Indian Education Board", "International Education Board"];

const HIGHER_EDUCATION_STREAMS = [
  "STEM (Science, Technology, Engineering & Math)",
  "Commerce, Finance & Business",
  "Arts, Humanities & Social Sciences",
  "Law, Governance & Public Policy",
  "Health, Medicine & Allied Sciences",
  "Design, Media & Creative Arts",
  "Education & Teaching",
  "Vocational, Skill-based & Technical Training",
  "Technology & Digital Skills",
  "Professional Development & Soft Skills",
  "Entrepreneurship & Startup Skills",
  "Test Prep & Competitive Exams",
  "Personal Growth & Wellbeing",
  "Others",
];

const GRADE_PILL_LABELS: Record<string, string> = {
  pre_school: "Pre-School (Pre K - UKG)",
  primary: "Primary School (Grade 1 to 4)",
  secondary: "Secondary School (Grade 5 to 7)",
  senior_secondary: "Senior Secondary School (Grade 8 to 10)",
  high_school: "High School (Grade 11 to 12)",
};

const ACADEMIC_PILL_LABELS: Record<string, string> = {
  high_school: "High School (Grade 11 to 12)",
  diploma: "Diploma",
  under_graduate: "Under Graduate",
  post_graduate: "Post Graduate",
  phd: "PhD",
};



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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="font-semibold text-[#18191c]">{label} : </span>
      <span className="text-[#6b7280]">{value}</span>
    </p>
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
  const [expanded, setExpanded] = useState(false);

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
              className="p-2 hover:bg-border-light rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg width="35" height="30" viewBox="0 0 24 24" fill={saved ? "#f77f00" : "none"} className="text-primary">
                <path
                  d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
                  stroke="#f77f00"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
          <button
            onClick={() => course.brochureUrl && window.open(course.brochureUrl, "_blank")}
            disabled={!course.brochureUrl}
            className={`flex-1 border border-[#e5e7eb] text-[#374151] text-sm font-medium py-2 rounded-full transition-colors ${course.brochureUrl ? "hover:bg-gray-50" : "opacity-40 cursor-not-allowed"}`}
          >
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

        {expanded && (
          <div className="mt-3 pt-3 border-t border-[#f3f4f6] space-y-4">
            <div className="space-y-2">
              <p className="text-[#18191c] font-bold text-sm">More Details</p>
              <DetailRow label="Certification / Accreditation" value={course.certification} />
              <DetailRow label="Other Benefits / Exposure" value={course.otherBenefits} />
              <DetailRow label="Career Outcomes / Benefits" value={course.careerOutcomes} />
            </div>

            <div className="space-y-2">
              <p className="text-[#18191c] font-bold text-sm">Engagement Details</p>
              <DetailRow label="Duration" value={course.duration} />
              <DetailRow label="Application deadline" value={course.applicationDeadline} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <DetailRow label="Start Date" value={course.startDate} />
                <DetailRow label="Time" value={course.startTime} />
                <DetailRow label="End Date" value={course.endDate} />
                <DetailRow label="Time" value={course.endTime} />
              </div>
              <DetailRow label="Fee" value={course.courseFee} />
            </div>

            <div className="space-y-2">
              <p className="text-[#18191c] font-bold text-sm">Access Details</p>
              <DetailRow label="Onsite Venue" value={course.onsiteVenue} />
              <DetailRow label="Online Access" value={course.onlineAccess} />
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[#f77f00] text-sm font-medium hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
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
  submitting,
  applyError,
}: {
  docs: string[];
  uploads: (File | null)[];
  onUpload: (i: number, file: File | null) => void;
  message: string;
  onMessageChange: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
  applyError: string | null;
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

        {applyError && (
          <p className="text-red-500 text-xs text-center mb-3">{applyError}</p>
        )}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            disabled={submitting}
            className="flex-1 border border-[#f77f00] text-[#f77f00] py-2.5 rounded-full text-sm font-semibold hover:bg-[#fff8ee] transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className={`flex-1 text-white py-2.5 rounded-full text-sm font-semibold transition-colors ${submitting ? "bg-[#f7a050] cursor-not-allowed" : "bg-[#f77f00] hover:bg-[#e07000]"}`}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function LearningRightSidebar({
  mainTab,
  courses,
  filters,
  onToggleStream,
  onToggleMode,
  onToggleFee,
  onToggleScholarship,
  onToggleParticipantLevel,
  onApply,
  onReset,
}: {
  mainTab: MainTab;
  courses: Course[];
  filters: FilterState;
  onToggleStream: (s: string) => void;
  onToggleMode: (m: string) => void;
  onToggleFee: (f: string) => void;
  onToggleScholarship: (s: string) => void;
  onToggleParticipantLevel: (l: string) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const [modeOpen, setModeOpen] = useState(true);
  const [streamOpen, setStreamOpen] = useState(false);
  const [scholarshipOpen, setScholarshipOpen] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);
  const [participantLevelOpen, setParticipantLevelOpen] = useState(false);
  const [helpDismissed, setHelpDismissed] = useState(false);

  const streamOptions =
    mainTab === "school"
      ? EDUCATION_BOARD_OPTIONS
      : mainTab === "college"
      ? HIGHER_EDUCATION_STREAMS
      : UPSKILLING_STREAMS;

  const streamTitle =
    mainTab === "school"
      ? "Education Board"
      : mainTab === "college"
      ? "Higher Education Stream"
      : "Upskilling Stream";

  const participantLevels =
    mainTab === "school"
      ? SCHOOL_PARTICIPANT_LEVELS
      : mainTab === "college"
      ? COLLEGE_PARTICIPANT_LEVELS
      : PROFESSIONAL_PARTICIPANT_LEVELS;

  return (
    <aside className="w-full shrink-0 flex flex-col gap-4">
      {/* Filter Card */}
      <div className="bg-white border border-[#f2f2f3] rounded-2xl p-4">
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
          <FilterAccordion
            title="Learning Mode"
            isOpen={modeOpen}
            onToggle={() => setModeOpen((v) => !v)}
          >
            {LEARNING_MODES.map((label) => (
              <FilterCheckbox
                key={label}
                label={label}
                count={courses.filter((c) => c.mode.toLowerCase().includes(label.toLowerCase())).length}
                checked={filters.modes.includes(label)}
                onChange={() => onToggleMode(label)}
              />
            ))}
          </FilterAccordion>

          <FilterAccordion
            title={streamTitle}
            isOpen={streamOpen}
            onToggle={() => setStreamOpen((v) => !v)}
          >
            {streamOptions.map((label) => (
              <FilterCheckbox
                key={label}
                label={label}
                count={courses.filter((c) => c.stream === label).length}
                checked={filters.streams.includes(label)}
                onChange={() => onToggleStream(label)}
              />
            ))}
          </FilterAccordion>

          <FilterAccordion
            title="Online Available"
            isOpen={scholarshipOpen}
            onToggle={() => setScholarshipOpen((v) => !v)}
          >
            {SCHOLARSHIP_OPTIONS.map((label) => (
              <FilterCheckbox
                key={label}
                label={label}
                count={courses.filter((c) => (isOnlineCourse(c) ? "Yes" : "No") === label).length}
                checked={filters.scholarships.includes(label)}
                onChange={() => onToggleScholarship(label)}
              />
            ))}
          </FilterAccordion>

          <FilterAccordion
            title="Fees"
            isOpen={feesOpen}
            onToggle={() => setFeesOpen((v) => !v)}
          >
            {FEES_OPTIONS.map((label) => (
              <FilterCheckbox
                key={label}
                label={label}
                count={courses.filter((c) => c.courseFee.toLowerCase() === label.toLowerCase()).length}
                checked={filters.fees.includes(label)}
                onChange={() => onToggleFee(label)}
              />
            ))}
          </FilterAccordion>

          <FilterAccordion
            title="Participant Level"
            isOpen={participantLevelOpen}
            onToggle={() => setParticipantLevelOpen((v) => !v)}
          >
            {participantLevels.map((label) => (
              <FilterCheckbox
                key={label}
                label={label}
                count={courses.filter((c) => c.academicLevel.toLowerCase().includes(label.toLowerCase())).length}
                checked={filters.participantLevels.includes(label)}
                onChange={() => onToggleParticipantLevel(label)}
              />
            ))}
          </FilterAccordion>
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

      {/* Promo Card */}
      <PromoCard />

      {/* Help Box */}
      {!helpDismissed && <HelpBox onDismiss={() => setHelpDismissed(true)} />}
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function isOnlineCourse(c: Course): boolean {
  return (
    c.mode.toLowerCase().includes("remote") ||
    c.mode.toLowerCase().includes("hybrid") ||
    !!c.onlineAccess
  );
}

function boardLabel(board: string | null): string {
  if (board === "indian") return "Indian Education Board";
  if (board === "international") return "International Education Board";
  return "";
}

function mapApiCourse(record: CourseRecord): Course {
  const levelLabel =
    record.academic_levels[0] ||
    record.course_levels[0] ||
    record.admission_for[0] ||
    "";
  const modeLabel =
    record.course_mode.charAt(0).toUpperCase() + record.course_mode.slice(1);
  const displayMode = record.venue ? `${modeLabel} (${record.venue})` : modeLabel;
  const displayOrg =
    record.user?.org_name ||
    [record.user?.first_name, record.user?.last_name].filter(Boolean).join(" ") ||
    "Unknown";
  const stream =
    record.program_level === "school"
      ? boardLabel(record.education_board)
      : record.program_level === "college"
      ? record.college_stream || ""
      : record.pro_stream || "";

  return {
    id: record.id,
    image: record.thumbnail_url || COURSE_IMG,
    university: displayOrg,
    title: record.title,
    academicLevel: levelLabel,
    mode: displayMode,
    stream,
    courseFee: record.fee_type
      ? record.fee_type.charAt(0).toUpperCase() + record.fee_type.slice(1)
      : "Contact for details",
    duration: record.duration || "",
    applicationDeadline: record.last_date_to_apply || "",
    eligibilityCriteria: record.eligibility_criteria,
    requiredDocs: record.required_documents,
    certification: record.certification || "",
    otherBenefits: record.other_benefits || "",
    careerOutcomes: record.career_outcomes || "",
    startDate: record.start_date || "",
    startTime: record.start_time || "",
    endDate: record.end_date || "",
    endTime: record.end_time || "",
    onsiteVenue: record.venue || "",
    onlineAccess: record.online_access || "",
    brochureUrl: record.brochure_url || "",
    allAdmissionFor: record.admission_for,
    allAcademicLevels: record.academic_levels,
    allCourseLevels: record.course_levels,
  };
}

export default function LearningDirectoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOrg = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') ?? '{}')?.user_type === 'organization';
    } catch {
      return false;
    }
  })();
  const [mainTab, setMainTab] = useState<MainTab>("professional");
  const [levelTab, setLevelTab] = useState<LevelTab>("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSavedLearningCourseIds().then(setSavedIds).catch(() => {});
  }, []);
  const [filters, setFilters] = useState<FilterState>({
    streams: [],
    modes: [],
    scholarships: [],
    fees: [],
    participantLevels: [],
  });

  // API data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Application flow
  const [appStep, setAppStep] = useState<AppStep>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [appForm, setAppForm] = useState({ name: "", email: "", mobile: "" });
  const [eligibilityChecked, setEligibilityChecked] = useState<boolean[]>([]);
  const [docUploads, setDocUploads] = useState<(File | null)[]>([]);
  const [appMessage, setAppMessage] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("");
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>("");

  // Fetch courses whenever the main tab changes
  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    fetchCourses({ programLevel: mainTab })
      .then((records) => setCourses(records.map(mapApiCourse)))
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, [mainTab]);

  // Auto-open application modal when navigated with ?apply=<courseId>
  useEffect(() => {
    const applyId = searchParams.get("apply");
    if (!applyId) return;
    fetchCourses()
      .then(records => {
        const record = records.find(r => r.id === applyId);
        if (!record) return;
        const lvl = record.program_level as MainTab;
        if (lvl === "school" || lvl === "college" || lvl === "professional") {
          setMainTab(lvl);
        }
        openApplication(mapApiCourse(record));
        setSearchParams(prev => { prev.delete("apply"); return prev; }, { replace: true });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Client-side filter on top of the fetched list
  // Scoped to the current tab / sub-tab, before the sidebar checkbox filters —
  // used both as the base for those filters and to compute their facet counts.
  const tabScopedCourses = useMemo(() => {
    let result = courses;
    if (mainTab === "school" && gradeLevel) {
      const label = GRADE_PILL_LABELS[gradeLevel];
      result = result.filter((c) => c.allAdmissionFor.includes(label));
    } else if (mainTab === "college" && academicLevel) {
      const label = ACADEMIC_PILL_LABELS[academicLevel];
      result = result.filter((c) => c.allAcademicLevels.includes(label));
    } else if (mainTab === "professional" && levelTab) {
      const label = levelTab.charAt(0).toUpperCase() + levelTab.slice(1);
      result = result.filter((c) => c.allCourseLevels.includes(label));
    }
    return result;
  }, [courses, mainTab, gradeLevel, academicLevel, levelTab]);

  const displayedCourses = useMemo(() => {
    let result = tabScopedCourses;
    if (filters.modes.length > 0) {
      result = result.filter((c) =>
        filters.modes.some((m) => c.mode.toLowerCase().includes(m.toLowerCase())),
      );
    }
    if (filters.streams.length > 0) {
      result = result.filter((c) => filters.streams.includes(c.stream));
    }
    if (filters.scholarships.length > 0) {
      result = result.filter((c) =>
        filters.scholarships.includes(isOnlineCourse(c) ? "Yes" : "No"),
      );
    }
    if (filters.fees.length > 0) {
      result = result.filter((c) =>
        filters.fees.some((f) => c.courseFee.toLowerCase() === f.toLowerCase()),
      );
    }
    if (filters.participantLevels.length > 0) {
      result = result.filter((c) =>
        filters.participantLevels.some((l) =>
          c.academicLevel.toLowerCase().includes(l.toLowerCase()),
        ),
      );
    }
    return result;
  }, [tabScopedCourses, filters]);

  async function openApplication(course: Course) {
    setApplyError(null);
    setSelectedCourse(course);
    setEligibilityChecked(new Array(course.eligibilityCriteria.length).fill(false));
    setDocUploads(new Array(course.requiredDocs.length).fill(null));
    setAppMessage("");
    // Auto-populate form from profile, skip the details step
    try {
      const profile = await fetchMyProfile();
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
      setAppForm({ name: fullName || profile.email || '', email: profile.email || '', mobile: '' });
    } catch {
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const fullName = [stored.first_name, stored.last_name].filter(Boolean).join(' ').trim();
        setAppForm({ name: fullName, email: stored.email || '', mobile: '' });
      } catch {}
    }
    setAppStep("eligibility");
  }

  function closeApplication() {
    setAppStep(null);
    setSelectedCourse(null);
    setAppForm({ name: "", email: "", mobile: "" });
    setApplyError(null);
  }

  async function handleSubmit() {
    if (!selectedCourse) return;
    setSubmitting(true);
    setApplyError(null);
    try {
      await applyToCourse(
        selectedCourse.id,
        { name: appForm.name, email: appForm.email, mobile: appForm.mobile, message: appMessage },
        docUploads,
      );
      setAppStep("success");
    } catch (e: unknown) {
      setApplyError(e instanceof Error ? e.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">

          {/* Center Content */}
          <div className="flex-1 min-w-0">
            {/* Main tabs */}
            <div className="flex items-center gap-0 border-b border-[#e5e7eb] overflow-x-auto">
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

            <div className="mt-5">
              {/* Sub-tab pills */}
              {mainTab === "professional" && (
                <div className="flex gap-2 mb-5 flex-wrap">
                  {LEVEL_TABS.map((lt) => (
                    <button
                      key={lt.key}
                      onClick={() => setLevelTab((v) => (v === lt.key ? "" : lt.key))}
                      className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${
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
                {loading && (
                  <p className="text-center text-[#6b7280] py-10 text-sm">Loading courses…</p>
                )}
                {!loading && fetchError && (
                  <p className="text-center text-red-500 py-10 text-sm">{fetchError}</p>
                )}
                {!loading && !fetchError && displayedCourses.length === 0 && (
                  <p className="text-center text-[#6b7280] py-10 text-sm">
                    No courses found. Be the first to{" "}
                    <button
                      onClick={() => navigate('/learning-directory/list-course', { state: { programLevel: mainTab } })}
                      className="text-[#f77f00] hover:underline font-medium"
                    >
                      list a course
                    </button>
                    .
                  </p>
                )}
                {!loading && displayedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    saved={savedIds.has(course.id)}
                    onToggleSave={() => {
                      const wasSaved = savedIds.has(course.id);
                      setSavedIds(prev => {
                        const next = new Set(prev);
                        if (wasSaved) next.delete(course.id); else next.add(course.id);
                        return next;
                      });
                      if (wasSaved) {
                        unsaveLearningCourse(course.id).catch(() => {});
                      } else {
                        saveLearningCourse({
                          id: course.id,
                          image: course.image,
                          university: course.university,
                          title: course.title,
                          level: course.academicLevel,
                          mode: course.mode,
                          fee: course.courseFee,
                          duration: course.duration,
                          deadline: course.applicationDeadline,
                          brochureUrl: course.brochureUrl,
                        }).catch(() => {});
                      }
                    }}
                    onGetStarted={() => openApplication(course)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:flex lg:flex-col gap-4 w-[354px] shrink-0 self-start sticky top-[84px]">
            {isOrg && (
              <button
                onClick={() => navigate('/learning-directory/list-course', { state: { programLevel: mainTab } })}
                className="w-full bg-[#f77f00] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#e07000] transition-colors"
              >
                List your course
              </button>
            )}
            <LearningRightSidebar
              mainTab={mainTab}
              courses={tabScopedCourses}
              filters={filters}
              onToggleStream={(s) => setFilters((f) => ({ ...f, streams: toggle(f.streams, s) }))}
              onToggleMode={(m) => setFilters((f) => ({ ...f, modes: toggle(f.modes, m) }))}
              onToggleFee={(fee) => setFilters((f) => ({ ...f, fees: toggle(f.fees, fee) }))}
              onToggleScholarship={(s) => setFilters((f) => ({ ...f, scholarships: toggle(f.scholarships, s) }))}
              onToggleParticipantLevel={(l) => setFilters((f) => ({ ...f, participantLevels: toggle(f.participantLevels, l) }))}
              onApply={() => {}}
              onReset={() => setFilters({ streams: [], modes: [], scholarships: [], fees: [], participantLevels: [] })}
            />
          </div>
        </div>
      </div>

      {/* Application Flow Modals */}
      {appStep === "eligibility" && selectedCourse && (
        <EligibilityModal
          criteria={selectedCourse.eligibilityCriteria}
          checked={eligibilityChecked}
          onToggle={toggleEligibility}
          onBack={closeApplication}
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
          submitting={submitting}
          applyError={applyError}
        />
      )}

      {appStep === "success" && (
        <ModalOverlay onClose={closeApplication}>
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-[#18191c] text-2xl font-bold">Application Submitted!</h2>
            <p className="text-[#6b7280] text-sm max-w-xs">
              Your application has been received. The course provider will reach out to you shortly.
            </p>
            <button
              onClick={closeApplication}
              className="mt-2 bg-[#f77f00] text-white text-sm font-semibold px-8 py-3 rounded-full hover:bg-[#e07000] transition-colors"
            >
              Done
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
