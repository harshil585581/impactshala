import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";

type PostingType = "employment" | "learning" | "event";

type Posting = {
  id: string;
  type: PostingType;
  title: string;
  org: string;
  location: string;
  posted: string;
  applicantCount: number;
  manageLabel: string;
};

type Applicant = {
  id: number;
  name: string;
  initials: string;
  color: string;
  line1: string;
  line2: string;
  appliedAgo: string;
};

const POSTINGS: Record<string, Posting> = {
  "1": {
    id: "1",
    type: "employment",
    title: "Product Manager",
    org: "Accenture",
    location: "Bangalore, Karnataka ( Onsite)",
    posted: "Posted 5 week Ago",
    applicantCount: 26,
    manageLabel: "Manage Job",
  },
  "2": {
    id: "2",
    type: "learning",
    title: "Bachelor of Business Administration (BBA) Accountancy",
    org: "University of Mumbai, Mumbai",
    location: "Bangalore, Karnataka ( Onsite)",
    posted: "Posted 5 week Ago",
    applicantCount: 26,
    manageLabel: "Manage Post",
  },
  "3": {
    id: "3",
    type: "event",
    title: "Evolution Of Space And About Aliens",
    org: "Education • Experiential learning • Guest lecture",
    location: "Bangalore, Karnataka ( Onsite)",
    posted: "Posted 5 week Ago",
    applicantCount: 26,
    manageLabel: "Manage Post",
  },
};

const EMP_APPLICANTS: Applicant[] = [
  {
    id: 1,
    name: "Dianne Russell",
    initials: "DR",
    color: "#6b7280",
    line1: "Accenture",
    line2: "Bangalore, Karnataka ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 2,
    name: "Kathryn Murphy",
    initials: "KM",
    color: "#8b5cf6",
    line1: "Accenture",
    line2: "Bangalore, Karnataka ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 3,
    name: "Jacob Jones",
    initials: "JJ",
    color: "#f59e0b",
    line1: "Accenture",
    line2: "Bangalore, Karnataka ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 4,
    name: "Guy Hawkins",
    initials: "GH",
    color: "#10b981",
    line1: "Accenture",
    line2: "Bangalore, Karnataka ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 5,
    name: "Ralph Edwards",
    initials: "RE",
    color: "#3b82f6",
    line1: "Accenture",
    line2: "Bangalore, Karnataka ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
];

const LEARN_APPLICANTS: Applicant[] = [
  {
    id: 1,
    name: "Dianne Russell",
    initials: "DR",
    color: "#6b7280",
    line1: "University of Mumbai, Mumbai",
    line2: "Mumbai, Maharashtra ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 2,
    name: "Kathryn Murphy",
    initials: "KM",
    color: "#8b5cf6",
    line1: "University of Delhi, Delhi",
    line2: "Delhi ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 3,
    name: "Jacob Jones",
    initials: "JJ",
    color: "#f59e0b",
    line1: "University of Mumbai, Mumbai",
    line2: "Mumbai ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 4,
    name: "Guy Hawkins",
    initials: "GH",
    color: "#10b981",
    line1: "University of Mumbai, Mumbai",
    line2: "Mumbai ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 5,
    name: "Ralph Edwards",
    initials: "RE",
    color: "#3b82f6",
    line1: "University of Mumbai, Mumbai",
    line2: "Mumbai ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
];

const EVENT_APPLICANTS: Applicant[] = [
  {
    id: 1,
    name: "Dianne Russell",
    initials: "DR",
    color: "#6b7280",
    line1: "Education • Experiential learning • Guest lecture",
    line2: "Mumbai, Maharashtra ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 2,
    name: "Kathryn Murphy",
    initials: "KM",
    color: "#8b5cf6",
    line1: "Education • Experiential learning • Guest lecture",
    line2: "Delhi ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 3,
    name: "Jacob Jones",
    initials: "JJ",
    color: "#f59e0b",
    line1: "Education • Experiential learning • Guest lecture",
    line2: "Mumbai ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 4,
    name: "Guy Hawkins",
    initials: "GH",
    color: "#10b981",
    line1: "Education • Experiential learning • Guest lecture",
    line2: "Mumbai ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
  {
    id: 5,
    name: "Ralph Edwards",
    initials: "RE",
    color: "#3b82f6",
    line1: "Education • Experiential learning • Guest lecture",
    line2: "Mumbai ( Onsite)",
    appliedAgo: "Applied 5 week Ago",
  },
];

const APPLICANTS_MAP: Record<string, Applicant[]> = {
  "1": EMP_APPLICANTS,
  "2": LEARN_APPLICANTS,
  "3": EVENT_APPLICANTS,
};

const PROFILE_BIO =
  "Bangalore, Karnataka ( Onsite)Bangalore, Karnataka ( Onsite)Bangalore, Karnataka ( Onsite)Bangalore, Karnataka ( Onsite)Bangalore, Karnataka ( Onsite) Bangalore,";

const PROFILE_EXPERIENCE = [
  {
    title: "Senior UX Designer at Fintech Solutions",
    period: "2022 - Present",
  },
  { title: "UX Designer at Health Tech Innovation", period: "2019 - 2022" },
];

const PROFILE_EDUCATION = [
  {
    uni: "Harvard University",
    degree: "Postgraduate degree, Applied Psychology",
    period: "2010 - 2012",
  },
  {
    uni: "University of Toronto",
    degree: "Bachelor of Arts, Visual Communication",
    period: "2005 - 2009",
  },
];

const DOCUMENTS = [
  "12th Marksheet",
  "10th Marksheet",
  "Degree semester Marksheet",
  "Pan Card",
  "Aadhar Card",
];

const TOTAL_PAGES = 90;
const VISIBLE_PAGES = [1, 2, 3];

function LetterAvatar({
  initials,
  color,
  size = "md",
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "w-14 h-14 text-lg" : "w-11 h-11 text-sm";
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

function ThreeDotsMenu({
  isOpen,
  onToggle,
  children,
}: {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      <button
        onClick={onToggle}
        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="More options"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="5" cy="12" r="1.5" fill="#6b7280" />
          <circle cx="12" cy="12" r="1.5" fill="#6b7280" />
          <circle cx="19" cy="12" r="1.5" fill="#6b7280" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-30 overflow-hidden min-w-[170px]">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  label,
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${danger ? "text-red-500" : "text-[#374151]"}`}
    >
      {label}
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="#6b7280"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ApplicantsDetailPage() {
  const { postingId = "1" } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    function closeMenu() {
      setOpenMenuId(null);
    }
    if (openMenuId !== null) document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [openMenuId]);

  function toggleMenu(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  }

  const posting = POSTINGS[postingId] ?? POSTINGS["1"];
  const applicants = APPLICANTS_MAP[postingId] ?? EMP_APPLICANTS;
  const selected = applicants.find((a) => a.id === selectedId) ?? applicants[0];

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="px-4 sm:px-6 py-6">
          {/* Posting header */}
          <div className="flex items-start justify-between mb-6 gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 rounded-full bg-[#18191c] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xl">
                  {posting.title.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[#18191c] text-2xl sm:text-[28px] font-bold leading-tight">
                  {posting.title}
                </h1>
                <p className="text-[#18191c] text-[15px] mt-0.5">
                  {posting.org}
                </p>
                <p className="text-[#6b7280] text-sm mt-0.5">
                  {posting.location}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#16a34a] font-semibold text-sm">
                    Active
                  </span>
                  <span className="text-[#6b7280] text-sm">•</span>
                  <span className="text-[#6b7280] text-sm">
                    {posting.posted}
                  </span>
                </div>
              </div>
            </div>
            <button className="shrink-0 px-5 py-2 border border-[#f77f00] text-[#f77f00] rounded-full text-sm font-semibold hover:bg-[#fff8ee] transition-colors whitespace-nowrap">
              {posting.manageLabel}
            </button>
          </div>

          {/* Applicants heading */}
          <h2 className="text-[#18191c] text-xl font-bold mb-4">
            Applicants ({posting.applicantCount})
          </h2>

          {/* Split panel */}
          <div className="flex gap-4 items-start">
            {/* Left: applicant list + pagination */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {applicants.map((applicant) => {
                const isSelected = applicant.id === selectedId;
                return (
                  <div
                    key={applicant.id}
                    onClick={() => setSelectedId(applicant.id)}
                    className={`rounded-2xl p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-white border border-[#e5e7eb] shadow-sm"
                        : "bg-[#fff8f0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <LetterAvatar
                          initials={applicant.initials}
                          color={applicant.color}
                        />
                        <div className="min-w-0">
                          <p className="text-[#18191c] font-bold text-base leading-tight">
                            {applicant.name}
                          </p>
                          <p className="text-[#18191c] text-sm mt-0.5 leading-snug">
                            {applicant.line1}
                          </p>
                          <p className="text-[#6b7280] text-sm mt-0.5">
                            {applicant.line2}
                          </p>
                          <p className="text-[#6b7280] text-sm mt-1">
                            {applicant.appliedAgo}
                          </p>
                        </div>
                      </div>
                      <ThreeDotsMenu
                        isOpen={openMenuId === applicant.id}
                        onToggle={(e) => toggleMenu(e, applicant.id)}
                      >
                        <MenuItem label="Copy Link" />
                        <MenuItem label="Remove" danger />
                      </ThreeDotsMenu>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 mt-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18l-6-6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Previous
                </button>
                {VISIBLE_PAGES.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-[#18191c] text-white"
                        : "text-[#374151] hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <span className="text-[#9ca3af] text-sm px-1">...</span>
                <button
                  onClick={() => setCurrentPage(TOTAL_PAGES)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                    currentPage === TOTAL_PAGES
                      ? "bg-[#18191c] text-white"
                      : "text-[#374151] hover:bg-gray-100"
                  }`}
                >
                  {TOTAL_PAGES}
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1))
                  }
                  disabled={currentPage === TOTAL_PAGES}
                  className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#f77f00] disabled:opacity-40 transition-colors"
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right: sticky profile panel */}
            <div className="w-[480px] shrink-0 sticky top-[90px]">
              <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                {/* Profile header */}
                <div className="flex items-start justify-between gap-2 p-4 border-b border-[#f3f4f6]">
                  <div className="flex items-start gap-3 min-w-0">
                    <LetterAvatar
                      initials={selected.initials}
                      color={selected.color}
                    />
                    <div className="min-w-0">
                      <p className="text-[#18191c] font-semibold text-[15px] leading-tight">
                        {selected.name}
                      </p>
                      <p className="text-[#6b7280] text-xs mt-0.5 leading-snug">
                        {selected.line1}
                      </p>
                      <p className="text-[#6b7280] text-xs">{selected.line2}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                    <button className="px-2.5 py-1 border border-[#f77f00] text-[#f77f00] rounded-full text-[11px] font-medium hover:bg-[#fff8ee] transition-colors whitespace-nowrap">
                      Not a fit
                    </button>
                    <button className="px-2.5 py-1 border border-[#f77f00] text-[#f77f00] rounded-full text-[11px] font-medium hover:bg-[#fff8ee] transition-colors">
                      Maybe
                    </button>
                    <button className="px-2.5 py-1 bg-[#f77f00] text-white rounded-full text-[11px] font-medium hover:bg-[#e68500] transition-colors">
                      Goodfit
                    </button>
                  </div>
                </div>

                {/* Scrollable profile body */}
                <div className="p-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                  <h3 className="text-[#18191c] font-bold text-base">
                    Profile Overview
                  </h3>

                  {/* Bio */}
                  <div>
                    <p className="text-[#9ca3af] text-xs font-semibold mb-1">
                      Bio
                    </p>
                    <p className="text-[#374151] text-sm leading-relaxed">
                      {PROFILE_BIO}
                    </p>
                  </div>

                  {/* Experience (employment/learning) or Mode (event) */}
                  {posting.type !== "event" ? (
                    <div>
                      <p className="text-[#9ca3af] text-xs font-semibold mb-2">
                        Experience
                      </p>
                      <div className="space-y-2">
                        {PROFILE_EXPERIENCE.map((exp, i) => (
                          <div key={i}>
                            <p className="text-[#18191c] text-sm font-medium">
                              {exp.title}
                            </p>
                            <p className="text-[#9ca3af] text-xs">
                              {exp.period}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[#9ca3af] text-xs font-semibold mb-1">
                        Mode
                      </p>
                      <p className="text-[#374151] text-sm">Onsite</p>
                    </div>
                  )}

                  {/* Education */}
                  <div>
                    <p className="text-[#9ca3af] text-xs font-semibold mb-2">
                      Education
                    </p>
                    <div className="space-y-3">
                      {PROFILE_EDUCATION.map((edu, i) => (
                        <div key={i}>
                          <p className="text-[#18191c] text-sm font-semibold">
                            {edu.uni}
                          </p>
                          <p className="text-[#374151] text-xs">{edu.degree}</p>
                          <p className="text-[#9ca3af] text-xs">{edu.period}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View Profile */}
                  <div className="flex justify-center pt-1">
                    <button className="px-6 py-2 border border-[#f77f00] text-[#f77f00] rounded-full text-sm font-semibold hover:bg-[#fff8ee] transition-colors">
                      View Profile
                    </button>
                  </div>

                  {/* Resume accordion */}
                  <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setResumeOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#18191c] font-semibold text-sm">
                        Resume
                      </span>
                      <Chevron open={resumeOpen} />
                    </button>
                    {resumeOpen && (
                      <div className="px-4 py-3 border-t border-[#e5e7eb] text-sm text-[#6b7280]">
                        No resume uploaded.
                      </div>
                    )}
                  </div>

                  {/* Eligibility accordion */}
                  <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setEligibilityOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#18191c] font-semibold text-sm">
                        Eligibility
                      </span>
                      <Chevron open={eligibilityOpen} />
                    </button>
                    {eligibilityOpen && (
                      <div className="px-4 py-3 border-t border-[#e5e7eb] text-sm text-[#6b7280]">
                        No eligibility info available.
                      </div>
                    )}
                  </div>

                  {/* Documents accordion */}
                  <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setDocumentsOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#18191c] font-semibold text-sm">
                        Documents
                      </span>
                      <Chevron open={documentsOpen} />
                    </button>
                    {documentsOpen && (
                      <div className="border-t border-[#e5e7eb]">
                        {DOCUMENTS.map((doc, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-4 py-3 ${
                              i < DOCUMENTS.length - 1
                                ? "border-b border-[#f3f4f6]"
                                : ""
                            }`}
                          >
                            <span className="text-[#374151] text-sm">
                              {doc}
                            </span>
                            <button className="px-3 py-1 border border-[#f77f00] text-[#f77f00] rounded-full text-xs font-medium hover:bg-[#fff8ee] transition-colors">
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
