import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

type Tab = "providers" | "seekers";

const CATEGORY_CHIPS = [
  "Job Ready Exposures",
  "Education",
  "Social impact",
  "Startup & growth",
  "Community",
];
const FILTER_SECTIONS = [
  "Sub Category",
  "Delivery Mode",
  "Payment",
  "Level of participant",
];

const postImg = "https://placehold.co/400x300/f5f5f5/cccccc";
const avatarImg = "https://placehold.co/80x80/ff9400/ffffff";

const POSTS = [
  {
    id: 1,
    avatar: avatarImg,
    name: "Alex Johnson",
    subtitle: "UI/UX Designer • Accenture",
    time: "12h",
    postTitle: "Evolution Of Space And About Aliens",
    tags: ["Opportunity"],
    subTags: "Education • Experiential learning • Guest lecture",
    mode: "Onsite",
    payment: "5,000 / No fee",
    targetAudience: "Students",
    lastDate: "12/12/2024",
    image: postImg,
    reactions: 1507,
    comments: 14,
  },
  {
    id: 2,
    avatar: avatarImg,
    name: "Alex Johnson",
    subtitle: "UI/UX Designer • Accenture",
    time: "12h",
    postTitle: "Evolution Of Space And About Aliens",
    tags: ["Opportunity"],
    subTags: "Education • Experiential learning • Guest lecture",
    mode: "Onsite",
    payment: "5,000 / No fee",
    targetAudience: "Students",
    lastDate: "12/12/2024",
    image: postImg,
    reactions: 1507,
    comments: 14,
  },
];

function BookmarkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="26"
      viewBox="0 0 24 32"
      fill="none"
    >
      <path d="M24 32H0V0H24V32Z" stroke="#E5E7EB" />
      <path
        d="M1 4.71872C1 3.21776 2.21776 2 3.71872 2V4.71872V27.0009L11.0876 21.7391C11.5577 21.3992 12.1977 21.3992 12.6679 21.7391L20.0311 27.0009V4.71872H3.71872V2H20.0311C21.532 2 22.7498 3.21776 22.7498 4.71872V29.6403C22.7498 30.1501 22.4666 30.6146 22.0135 30.8468C21.5603 31.079 21.0166 31.0394 20.6031 30.7448L11.8749 24.5144L3.14666 30.7448C2.73319 31.0394 2.18944 31.079 1.73632 30.8468C1.2832 30.6146 1 30.1501 1 29.6403V4.71872Z"
        fill="#F77F00"
      />
    </svg>
  );
}

function DiscoverPostCard({ post }: { post: (typeof POSTS)[0] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
      <div className="px-5 pt-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={post.avatar}
              alt=""
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <div>
              <p className="font-semibold text-[#18191c] text-base leading-tight">
                {post.name}
              </p>
              <p className="text-[#9ca3af] text-sm">{post.subtitle}</p>
              <div className="flex items-center gap-1 text-[#9ca3af] text-xs mt-0.5">
                <span>{post.time}</span>
                <span>•</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <button className="bg-[#f77f00] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#e88500] transition-colors whitespace-nowrap">
              Get Started
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <BookmarkIcon />
            </button>
          </div>
        </div>

        {/* Post title */}
        <h3 className="text-[#18191c] font-bold text-lg mb-2">
          {post.postTitle}
        </h3>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 border border-[#e5e7eb] rounded-full text-xs text-[#374151] font-medium"
            >
              {tag}
            </span>
          ))}
          <span className="text-xs text-[#374151]">{post.subTags}</span>
        </div>

        {/* Meta info grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
          <p className="text-[#374151] text-sm">
            <span className="font-semibold">Mode :</span>{" "}
            <span className="font-normal">{post.mode}</span>
          </p>
          <p className="text-[#374151] text-sm">
            <span className="font-semibold">Payment :</span>{" "}
            <span className="font-normal">{post.payment}</span>
          </p>
          <p className="text-[#374151] text-sm">
            <span className="font-semibold">Target audience :</span>{" "}
            <span className="font-normal text-[#f77f00]">
              {post.targetAudience}
            </span>
          </p>
          <p className="text-[#374151] text-sm">
            <span className="font-semibold">Last date to apply :</span>{" "}
            <span className="font-normal">{post.lastDate}</span>
          </p>
        </div>
      </div>

      {/* Post image */}
      <img src={post.image} alt="" className="w-full h-[220px] object-cover" />

      <div className="px-5 py-4">
        {/* Show more */}
        <button className="text-[#f77f00] text-sm font-medium hover:underline mb-3 block">
          Show more
        </button>

        {/* Reactions row */}
        <div className="flex items-center justify-between text-sm text-[#9ca3af] mb-3">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              <span className="text-base">👍</span>
              <span className="text-base">❤️</span>
              <span className="text-base">🌟</span>
            </div>
            <span>{post.reactions.toLocaleString()}</span>
          </div>
          <span>{post.comments} comments</span>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-around border-t border-[#f3f4f6] pt-3">
          <button className="flex items-center gap-1.5 text-[#6b7280] text-sm hover:text-[#f77f00] transition-colors py-1 px-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Like
          </button>
          <button className="flex items-center gap-1.5 text-[#6b7280] text-sm hover:text-[#f77f00] transition-colors py-1 px-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Comment
          </button>
          <button className="flex items-center gap-1.5 text-[#6b7280] text-sm hover:text-[#f77f00] transition-colors py-1 px-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle
                cx="18"
                cy="5"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle
                cx="6"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle
                cx="18"
                cy="19"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            Share
          </button>
          <button className="flex items-center gap-1.5 text-[#6b7280] text-sm hover:text-[#f77f00] transition-colors py-1 px-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("providers");
  const [activeChip, setActiveChip] = useState("Job Ready Exposures");
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [helpBoxVisible, setHelpBoxVisible] = useState(true);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const createPostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (
        createPostRef.current &&
        !createPostRef.current.contains(e.target as Node)
      ) {
        setCreatePostOpen(false);
      }
    }
    if (createPostOpen) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [createPostOpen]);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">
          {/* Center feed */}
          <div className="flex-1 min-w-0">
            {/* Providers / Seekers tabs */}
            <div className="bg-white rounded-t-2xl border border-[#e5e7eb] flex mb-0 border-b-0">
              {(["providers", "seekers"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors relative ${
                    activeTab === tab
                      ? "text-[#f77f00]"
                      : "text-[#9ca3af] hover:text-[#374151]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f77f00] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Category chips */}
            <div className="bg-white border border-[#e5e7eb] border-t-0 rounded-b-2xl px-4 py-3 mb-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                {CATEGORY_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setActiveChip(chip)}
                    className={`px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                      activeChip === chip
                        ? "bg-[#f77f00] text-white border-[#f77f00]"
                        : "bg-white text-[#ff9400] border-[#ff9400] hover:bg-[#fff8ee]"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Post cards */}
            <div className="flex flex-col gap-4">
              {POSTS.map((post) => (
                <DiscoverPostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="hidden lg:block w-[280px] xl:w-[300px] shrink-0">
            <div className="flex flex-col gap-4 sticky top-[90px]">
              {/* Create post dropdown */}
              <div className="relative" ref={createPostRef}>
                <button
                  onClick={() => setCreatePostOpen((v) => !v)}
                  className="w-full bg-[#f77f00] text-white font-semibold py-3 rounded-full hover:bg-[#e88500] transition-colors text-base"
                >
                  Create post
                </button>
                {createPostOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-30 overflow-hidden">
                    <button className="w-full text-left px-4 py-3 text-sm text-[#374151] hover:bg-[#fff8ee] transition-colors">
                      Post as a provider
                    </button>
                    <button className="w-full text-left px-4 py-3 text-sm text-[#374151] hover:bg-[#fff8ee] transition-colors">
                      Post as a seeker
                    </button>
                  </div>
                )}
              </div>

              {/* Filter panel */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#18191c] font-semibold text-base">
                    Filter
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6h16M7 12h10M10 18h4"
                      stroke="#374151"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {FILTER_SECTIONS.map((section) => (
                  <div key={section} className="border-t border-[#f3f4f6] py-3">
                    <button
                      onClick={() =>
                        setExpandedFilter((prev) =>
                          prev === section ? null : section,
                        )
                      }
                      className="w-full flex items-center justify-between text-[#374151] text-sm font-medium"
                    >
                      {section}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={`transition-transform duration-200 ${expandedFilter === section ? "rotate-180" : ""}`}
                      >
                        <path
                          d="M6 9l6 6 6-6"
                          stroke="#374151"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {expandedFilter === section && (
                      <p className="mt-2 text-[#9ca3af] text-xs pl-1">
                        No options available.
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 mt-2 pt-3 border-t border-[#f3f4f6]">
                  <button className="flex-1 bg-[#FF9400] text-white font-semibold py-2.5 rounded-full text-sm hover:bg-[#e88500] transition-colors">
                    Apply
                  </button>
                  <button className="flex-1 border border-[#f77f00] text-[#f77f00] font-semibold py-2.5 rounded-full text-sm hover:bg-[#fff8ee] transition-colors">
                    Reset
                  </button>
                </div>
              </div>

              {/* Help Box */}
              {helpBoxVisible && (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 relative">
                  <button
                    onClick={() => setHelpBoxVisible(false)}
                    className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="#374151"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <div className="flex items-start gap-2 pr-6">
                    <div className="w-9 h-9 rounded-full bg-[#fff8ee] flex items-center justify-center shrink-0">
                      <span className="text-lg">📝</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#f77f00] text-sm">
                        Help Box
                      </p>
                      <p className="text-[#374151] text-xs mt-0.5 leading-relaxed">
                        Not able to find what you're looking for? Let us help
                        you.
                      </p>
                    </div>
                  </div>
                  <button className="mt-3 bg-[#FF9400] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#e88500] transition-colors">
                    Click Here
                  </button>
                </div>
              )}

              {/* Course promo card */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                <div className="bg-[#1f2937] px-4 py-4 text-center">
                  <p className="text-white font-bold text-base">Figma Design</p>
                  <p className="text-[#9ca3af] text-xs mt-0.5">
                    Learn & Explore more at impactshaala.com
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-[#18191c] font-semibold text-sm">
                    UI/UX Certification Course
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-[#fff8ee] text-[#f77f00] text-xs font-medium rounded-full">
                    Onsite
                  </span>
                  <p className="text-[#6b7280] text-xs mt-2 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Nulla facilisi. Vivamus ac tellus nec velit finibus egestas.
                  </p>
                  <button className="mt-3 w-full border border-[#FF9400] text-[#FF9400] text-sm font-semibold py-2.5 rounded-full hover:bg-[#fff8ee] transition-colors">
                    Know More
                  </button>
                  <div className="flex justify-center gap-1.5 mt-3">
                    <span className="w-2 h-2 rounded-full bg-[#f77f00]" />
                    <span className="w-2 h-2 rounded-full bg-[#e5e7eb]" />
                    <span className="w-2 h-2 rounded-full bg-[#e5e7eb]" />
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
