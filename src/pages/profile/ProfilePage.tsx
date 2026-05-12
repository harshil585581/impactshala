import { useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ToastContainer from "../../components/ui/Toast";
import { useProfile } from "../../hooks/useProfile";

// ─── Mock data ──────────────────────────────────────────────────────────────
const postImg1 =
  "https://www.figma.com/api/mcp/asset/d208c4d3-690e-45f8-8437-d98e914f6319";
const avatarMe =
  "https://www.figma.com/api/mcp/asset/3705c617-5e62-4578-acf8-8f5a2af9ff8f";

const MOCK_EXPERIENCES = [
  {
    id: "1",
    role: "Product Designer",
    company: "Canker",
    type: "Full Time",
    period: "2021 – Present · 0 yrs",
    skills: ["UX Research", "Wireframing", "Prototyping", "Figma"],
    description: "",
  },
  {
    id: "2",
    role: "Growth Marketing Designer",
    company: "LinkedIn",
    type: "Full Time",
    period: "Nov 2020 – Jan 2021 · 3 mos",
    skills: [],
    description:
      "Developed digital marketing strategies, collaborations, ecosystems, customer proposition for short timelines.",
  },
];

const MOCK_REVIEWS = [
  {
    id: "1",
    name: "Sarah Johnson",
    rating: 4,
    text: "Excellent work and very professional. Highly recommended for UI/UX projects.",
  },
  {
    id: "2",
    name: "David Chen",
    rating: 4,
    text: "Great collaboration and communication. Will definitely work together again.",
  },
];

const MOCK_PERSONAL_ACHIEVEMENTS = [
  { id: "1", title: "UI/UX Certificate By Impactshaala", img: postImg1 },
  { id: "2", title: "UI/UX Certificate By Impactshaala", img: postImg1 },
  { id: "3", title: "UI/UX Certificate By Impactshaala", img: postImg1 },
  { id: "4", title: "UI/UX Certificate By Impactshaala", img: postImg1 },
];

const MOCK_COLLAB_ACHIEVEMENTS = [
  {
    id: "1",
    title: "Product Design Community Group Sprint",
    org: "Sarah Anderson and 3 others",
    period: "March 2024 - September 2024",
  },
  {
    id: "2",
    title: "Launched Community by Abusoph for",
    org: "David Chen · 2 Projects",
    period: "Started: June 2023",
  },
];

const MOCK_EDUCATIONS = [
  {
    id: "1",
    school: "Harvard University",
    degree: "Bachelors in Arts, Human Psychology",
    period: "2010 – 2014",
    description:
      "Also Founded the Tech Club and Helped in Delta 20 Projects and took part in various business opportunities during the internship, delivering impact to the students.",
  },
  {
    id: "2",
    school: "University of Toronto",
    degree: "Masters in Computer Science",
    period: "2015 – 2016",
  },
];

const MOCK_POSTS = [
  { id: "1", img: postImg1, title: "Redesigning the Stock Fusion Dashboard" },
  { id: "2", img: postImg1, title: "Mobile App Web Learning" },
  { id: "3", img: postImg1, title: "User Testing Insights" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={s <= rating ? "#f77f00" : "#e4e5e8"}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[#18191c] text-base font-semibold">{title}</h3>
      {action}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#f2f2f3] my-5" />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { userId = "me" } = useParams<{ userId?: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showAllExp, setShowAllExp] = useState(false);
  const [showAllEdu, setShowAllEdu] = useState(false);

  const { profile, loading, saving, toasts, removeToast, saveProfile, follow } =
    useProfile(userId);

  const storedUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const isOwn = userId === "me" || userId === storedUser.id;

  const displayedExp = showAllExp
    ? MOCK_EXPERIENCES
    : MOCK_EXPERIENCES.slice(0, 1);
  const displayedEdu = showAllEdu
    ? MOCK_EDUCATIONS
    : MOCK_EDUCATIONS.slice(0, 1);

  const reachForTags = [
    "UI/UX Design",
    "Flutter System",
    "Product Strategy",
    "Accessibility",
    "Marketing/Go-to-Market",
  ];
  const interests = ["UI Design", "3D Design", "User Research"];

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
          {loading ? (
            <div className="bg-white rounded-[14px] border border-[#f2f2f3] p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-[#f1f2f4]" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-5 w-40 bg-[#f1f2f4] rounded" />
                  <div className="h-4 w-28 bg-[#f1f2f4] rounded" />
                  <div className="h-4 w-56 bg-[#f1f2f4] rounded" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[14px] border border-[#f2f2f3] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* ── Header ── */}
              <div className="px-6 pt-6 pb-0">
                <div className="flex items-start justify-between gap-4">
                  {/* Avatar + Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={profile?.avatarUrl ?? avatarMe}
                        alt="avatar"
                        className="w-[72px] h-[72px] rounded-full object-cover border-2 border-white shadow"
                      />
                      {/* Online dot */}
                      <span className="absolute bottom-1 right-1 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-white" />
                    </div>

                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h1 className="text-[#18191c] text-xl font-bold leading-tight">
                        {profile
                          ? `${profile.firstName} ${profile.lastName}`
                          : "Michael Anderson"}
                      </h1>
                      <p className="text-[#5e6670] text-sm">
                        Product Designer · Delhi Public School
                      </p>
                      <p className="text-[#9199a3] text-xs mt-0.5">
                        Passionate designer working in top-tier UX/UI and
                        medical healthcare across, focusing on accessibility and
                        inclusion.
                      </p>
                    </div>
                  </div>

                  {/* Social icons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {/* Email */}
                    <a
                      href="#"
                      className="text-[#9199a3] hover:text-[#f77f00] transition-colors"
                      aria-label="Email"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <polyline
                          points="22,6 12,13 2,6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </a>
                    {/* LinkedIn */}
                    <a
                      href="#"
                      className="text-[#9199a3] hover:text-[#0077b5] transition-colors"
                      aria-label="LinkedIn"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </a>
                    {/* GitHub */}
                    <a
                      href="#"
                      className="text-[#9199a3] hover:text-[#18191c] transition-colors"
                      aria-label="GitHub"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                      </svg>
                    </a>
                    {/* Instagram */}
                    <a
                      href="#"
                      className="text-[#9199a3] hover:text-[#e1306c] transition-colors"
                      aria-label="Instagram"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="2"
                          y="2"
                          width="20"
                          height="20"
                          rx="5"
                          ry="5"
                        />
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                    {/* Twitter/X */}
                    <a
                      href="#"
                      className="text-[#9199a3] hover:text-[#18191c] transition-colors"
                      aria-label="Twitter"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    {/* Behance */}
                    <a
                      href="#"
                      className="text-[#9199a3] hover:text-[#1769ff] transition-colors"
                      aria-label="Behance"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.7zM19.34 13c-.104-1.336-1.02-1.893-1.97-1.893-1.04 0-1.856.63-2.01 1.893h3.98zM0 5h6.599c3.098 0 4.199 1.787 4.199 3.541 0 1.657-.895 2.652-2.099 3.151 1.441.35 2.739 1.426 2.739 3.338 0 2.531-1.978 3.97-5.098 3.97H0V5zm4.339 5.816c1.12 0 1.661-.465 1.661-1.278 0-.791-.51-1.197-1.575-1.197H3.35v2.475h.989zm.242 5.107c1.185 0 1.838-.526 1.838-1.489 0-.883-.577-1.408-1.855-1.408H3.35v2.897h1.231z" />
                      </svg>
                    </a>
                    {/* YouTube */}
                    <a
                      href="#"
                      className="text-[#9199a3] hover:text-[#ff0000] transition-colors"
                      aria-label="YouTube"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {isOwn ? (
                    <button
                      onClick={() => setEditOpen(true)}
                      className="flex items-center gap-1.5 h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#f77f00] hover:text-[#f77f00] transition-colors"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button className="flex items-center gap-1.5 h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#f77f00] hover:text-[#f77f00] transition-colors">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="9"
                            cy="7"
                            r="4"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        Add to Community
                      </button>
                      <button className="flex items-center gap-1.5 h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#f77f00] hover:text-[#f77f00] transition-colors">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Message
                      </button>
                      <button
                        onClick={follow}
                        className="h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#f77f00] hover:text-[#f77f00] transition-colors"
                      >
                        {profile?.isFollowing ? "Following" : "+ Follow"}
                      </button>
                      <button className="w-[34px] h-[34px] border border-[#e4e5e8] rounded-full flex items-center justify-center text-[#9199a3] hover:border-[#f77f00] hover:text-[#f77f00] transition-colors">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="19" cy="12" r="1.5" />
                          <circle cx="5" cy="12" r="1.5" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-5 pb-5 border-b border-[#f2f2f3] flex-wrap">
                  {[
                    { label: "Recommendations", value: "143" },
                    { label: "Reviews", value: "64" },
                    { label: "Achievements", value: "48" },
                    { label: "Community Members", value: "1.2k" },
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-[#f77f00] text-base font-bold">
                        {s.value}
                      </span>
                      <span className="text-[#18191c] text-[11px] font-medium text-center">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Body sections ── */}
              <div className="px-6 py-5 flex flex-col gap-0">
                {/* Reach out */}
                <div>
                  <p className="text-[#18191c] text-sm font-semibold mb-3">
                    Reach out to me for:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {reachForTags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#fff6ed] text-[#f77f00] text-xs font-medium px-3 py-1.5 rounded-full border border-[#ffeacc]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Interests + Additional Details + Portfolio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Interests */}
                  <div>
                    <p className="text-[#18191c] text-sm font-semibold mb-3">
                      Interest
                    </p>
                    <div className="flex flex-col gap-2">
                      {interests.map((item) => (
                        <span key={item} className="text-[#5e6670] text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <p className="text-[#18191c] text-sm font-semibold mb-3">
                      Additional Details
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-[#5e6670] text-sm">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <line
                            x1="2"
                            y1="12"
                            x2="22"
                            y2="12"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </svg>
                        Languages
                      </div>
                      <div className="flex items-center gap-2 text-[#5e6670] text-sm">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                        Profile URL
                      </div>
                    </div>
                  </div>

                  {/* Portfolio/Resume */}
                  <div>
                    <p className="text-[#18191c] text-sm font-semibold mb-3">
                      Portfolio/Resume
                    </p>
                    <div className="w-[80px] h-[100px] bg-[#f3f5f7] rounded-[6px] border border-[#e4e5e8] flex items-center justify-center overflow-hidden">
                      <img
                        src={postImg1}
                        alt="Portfolio"
                        className="w-full h-full object-cover opacity-60"
                      />
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Experience */}
                <div>
                  <SectionHeader title="Experience" />
                  <div className="flex flex-col gap-5">
                    {displayedExp.map((exp) => (
                      <div key={exp.id} className="flex gap-3">
                        {/* Company logo placeholder */}
                        <div className="w-10 h-10 rounded-lg bg-[#f3f5f7] border border-[#e4e5e8] shrink-0 flex items-center justify-center">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <rect
                              x="2"
                              y="7"
                              width="20"
                              height="14"
                              rx="2"
                              stroke="#9199a3"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
                              stroke="#9199a3"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[#18191c] text-sm font-semibold">
                                {exp.role}
                              </p>
                              <p className="text-[#5e6670] text-xs mt-0.5">
                                {exp.company} · {exp.type} · {exp.period}
                              </p>
                            </div>
                          </div>
                          {exp.description && (
                            <p className="text-[#5e6670] text-xs mt-2 leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                          {exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {exp.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="bg-[#f3f5f7] text-[#5e6670] text-[11px] px-2 py-0.5 rounded-full border border-[#e4e5e8]"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {MOCK_EXPERIENCES.length > 1 && (
                    <button
                      onClick={() => setShowAllExp((v) => !v)}
                      className="mt-4 text-[#f77f00] text-sm font-medium hover:underline"
                    >
                      {showAllExp
                        ? "Show less"
                        : `Show ${MOCK_EXPERIENCES.length - 1} more experiences`}
                    </button>
                  )}
                </div>

                <Divider />

                {/* Reviews */}
                <div>
                  <SectionHeader
                    title="Reviews"
                    action={
                      <button className="h-[34px] px-5 bg-[#f77f00] text-white text-xs font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)]">
                        Write a Review
                      </button>
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MOCK_REVIEWS.map((review) => (
                      <div
                        key={review.id}
                        className="border border-[#f2f2f3] rounded-[10px] p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[#18191c] text-sm font-semibold">
                            {review.name}
                          </p>
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="text-[#5e6670] text-xs leading-relaxed">
                          {review.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Personal Achievements */}
                <div>
                  <SectionHeader
                    title="Personal Achievements"
                    action={
                      <button className="text-[#f77f00] text-xs font-medium hover:underline">
                        View All
                      </button>
                    }
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MOCK_PERSONAL_ACHIEVEMENTS.map((a) => (
                      <div
                        key={a.id}
                        className="border border-[#f2f2f3] rounded-[10px] overflow-hidden"
                      >
                        <img
                          src={a.img}
                          alt={a.title}
                          className="w-full h-[80px] object-cover"
                        />
                        <div className="p-2">
                          <p className="text-[#18191c] text-[11px] font-medium leading-tight">
                            {a.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Collaborative Achievements */}
                <div>
                  <SectionHeader
                    title="Collaborative Achievements"
                    action={
                      <button className="text-[#f77f00] text-xs font-medium hover:underline">
                        View All
                      </button>
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MOCK_COLLAB_ACHIEVEMENTS.map((a) => (
                      <div
                        key={a.id}
                        className="border border-[#f2f2f3] rounded-[10px] p-4"
                      >
                        <p className="text-[#18191c] text-sm font-semibold leading-snug">
                          {a.title}
                        </p>
                        <p className="text-[#9199a3] text-xs mt-1">{a.org}</p>
                        <p className="text-[#9199a3] text-xs">{a.period}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Educations */}
                <div>
                  <SectionHeader title="Educations" />
                  <div className="flex flex-col gap-5">
                    {displayedEdu.map((edu) => (
                      <div key={edu.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#f3f5f7] border border-[#e4e5e8] shrink-0 flex items-center justify-center">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                              stroke="#9199a3"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#18191c] text-sm font-semibold">
                            {edu.school}
                          </p>
                          <p className="text-[#5e6670] text-xs mt-0.5">
                            {edu.degree}
                          </p>
                          <p className="text-[#9199a3] text-xs mt-0.5">
                            {edu.period}
                          </p>
                          {edu.description && (
                            <p className="text-[#5e6670] text-xs mt-2 leading-relaxed">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {MOCK_EDUCATIONS.length > 1 && (
                    <button
                      onClick={() => setShowAllEdu((v) => !v)}
                      className="mt-4 text-[#f77f00] text-sm font-medium hover:underline"
                    >
                      {showAllEdu
                        ? "Show less"
                        : `Show ${MOCK_EDUCATIONS.length - 1} more educations`}
                    </button>
                  )}
                </div>

                <Divider />

                {/* Recent Posts */}
                <div>
                  <SectionHeader
                    title="Recent Posts"
                    action={
                      <button className="text-[#f77f00] text-xs font-medium hover:underline">
                        View All
                      </button>
                    }
                  />
                  <div className="grid grid-cols-3 gap-3">
                    {MOCK_POSTS.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-[10px] overflow-hidden border border-[#f2f2f3]"
                      >
                        <img
                          src={post.img}
                          alt={post.title}
                          className="w-full h-[90px] object-cover"
                        />
                        <div className="p-2">
                          <p className="text-[#18191c] text-[11px] font-medium leading-tight line-clamp-2">
                            {post.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* end body */}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          saving={saving}
          onSave={async (data) => {
            await saveProfile(data);
            setEditOpen(false);
          }}
          onClose={() => setEditOpen(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
