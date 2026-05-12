import { useState } from "react";
import { useNavigate } from "react-router-dom";

const bgPhoto =
  "https://www.figma.com/api/mcp/asset/c784576f-a49e-4bcb-a273-86e794818310";
const whiteLogo =
  "https://www.figma.com/api/mcp/asset/ec38bac6-44ca-4b11-9177-8580a10af1eb";

// icons — first 9 (457:780)
const iconEdu =
  "https://www.figma.com/api/mcp/asset/021842c7-8c85-4a72-86c6-f10fffe27ad1";
const iconProfit =
  "https://www.figma.com/api/mcp/asset/da16aa3b-5602-4f1b-bccb-0594494fb72b";
const iconNGO =
  "https://www.figma.com/api/mcp/asset/8588121f-0429-406d-a882-d26649ca6b19";
const iconHealth =
  "https://www.figma.com/api/mcp/asset/5a2be5ea-e1a4-4572-973f-97adf073b066";
const iconUtil =
  "https://www.figma.com/api/mcp/asset/512f1e59-07ef-4cc0-9c08-3ec97bc151e1";
const iconWelfare =
  "https://www.figma.com/api/mcp/asset/a4714e1a-7aed-4cab-8961-4f1eefd82e68";
const iconFieldTrip =
  "https://www.figma.com/api/mcp/asset/23713d1e-49d9-4ae6-a51b-b1faa577ff67";
const iconStartup =
  "https://www.figma.com/api/mcp/asset/ca2039b4-9592-4947-8c93-c48532de6bc7";
const iconTalent =
  "https://www.figma.com/api/mcp/asset/7c855475-a34d-493d-913b-036455b82e5c";
// icons — "show more" set (1164:61846)
const iconSafety =
  "https://www.figma.com/api/mcp/asset/792a133a-653f-446d-be1c-1e8f324b1ab1";
const iconIntl =
  "https://www.figma.com/api/mcp/asset/12e2f97e-04e2-4e5d-abdf-47dfdc5fe132";
const iconOthers =
  "https://www.figma.com/api/mcp/asset/b83fdf8d-0e73-4162-b41d-dc080ba64a01";

const INITIAL_TYPES = [
  {
    id: "educational",
    label: "Educational Institutions",
    desc: "Schools, colleges, and universities",
    icon: iconEdu,
  },
  {
    id: "forprofit",
    label: "For Profit Companies",
    desc: "Businesses and private enterprises",
    icon: iconProfit,
  },
  {
    id: "nonprofit",
    label: "Non Profit NGOs",
    desc: "Charitable and social impact organizations",
    icon: iconNGO,
  },
  {
    id: "health",
    label: "Health Services",
    desc: "Healthcare and medical facilities",
    icon: iconHealth,
  },
  {
    id: "utilities",
    label: "Public Utilities",
    desc: "Government operated utilities",
    icon: iconUtil,
  },
  {
    id: "welfare",
    label: "Public Welfare Services",
    desc: "Government social support services",
    icon: iconWelfare,
  },
  {
    id: "fieldtrip",
    label: "Educational Field Trip Venues",
    desc: "Experiential learning centers",
    icon: iconFieldTrip,
  },
  {
    id: "startup",
    label: "Startup Support Organization",
    desc: "Incubators, accelerators, and VC firms",
    icon: iconStartup,
  },
  {
    id: "talent",
    label: "Talent Showcase & Learning",
    desc: "Showcase learning & stage",
    icon: iconTalent,
  },
];

const MORE_TYPES = [
  {
    id: "safety",
    label: "Public Safety & Law",
    desc: "Police, legal, and emergency services",
    icon: iconSafety,
  },
  {
    id: "international",
    label: "International Organization",
    desc: "Global institutions and networks",
    icon: iconIntl,
  },
  {
    id: "others",
    label: "Others",
    desc: "Any organization not listed above",
    icon: iconOthers,
  },
];

export default function OrgTypeSelectPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("educational");
  const [showMore, setShowMore] = useState(false);

  const visibleTypes = showMore
    ? [...INITIAL_TYPES, ...MORE_TYPES]
    : INITIAL_TYPES;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Background layer (desktop) ── */}
      <div className="fixed inset-0 lg:block hidden -z-10">
        <img
          src={bgPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(255,148,0,0.5)]" />
      </div>

      {/* ── Mobile/Tablet top banner ── */}
      <div className="lg:hidden relative overflow-hidden shrink-0">
        <img
          src={bgPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(255,148,0,0.55)]" />
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
          <img
            src={whiteLogo}
            alt="Impactshaala"
            className="h-9 sm:h-11 w-auto object-contain"
          />
          <button
            onClick={() => navigate("/signup")}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="relative z-10 px-5 sm:px-8 pb-5">
          <p className="text-white text-base sm:text-lg font-semibold leading-snug">
            Select Organization Type
          </p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-3 sm:px-4 lg:px-6 py-4 lg:py-8">
        <div className="w-full max-w-[1020px] bg-white lg:rounded-[17px] lg:shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="hidden lg:flex items-center justify-between px-8 pt-8 pb-0">
            <div /> {/* spacer */}
            <button
              onClick={() => navigate("/signup")}
              className="text-[#6b7280] hover:text-[#374151] transition-colors p-1"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="px-5 sm:px-8 lg:px-12 py-6 lg:py-8">
            <h2 className="hidden lg:block text-[#1f2937] text-2xl sm:text-3xl font-semibold text-center mb-2">
              Select Organization Type
            </h2>
            <p className="hidden lg:block text-[#6b7280] text-base sm:text-lg text-center mb-6 sm:mb-8">
              Choose the category that best represents your organization
            </p>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
              {visibleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelected(type.id)}
                  className={`flex flex-col items-center text-center p-4 sm:p-5 lg:p-6 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${
                    selected === type.id
                      ? "border-[#f77f00] bg-[#fff6ed] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                      : "border-transparent bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)] hover:border-[#f77f00] hover:bg-[#fffbf5]"
                  }`}
                >
                  <img
                    src={type.icon}
                    alt=""
                    className="w-10 h-10 sm:w-11 sm:h-11 object-contain mb-3"
                  />
                  <p className="font-semibold text-[#18191c] text-sm sm:text-base leading-snug mb-1">
                    {type.label}
                  </p>
                  <p className="text-[#5e6670] text-xs sm:text-sm leading-relaxed">
                    {type.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Show more / less */}
            <div className="text-center mt-4 sm:mt-5">
              <button
                onClick={() => setShowMore((v) => !v)}
                className="text-[#f77f00] text-sm sm:text-base font-medium underline underline-offset-2 hover:text-[#e07000] transition-colors"
              >
                {showMore ? "Show less" : "Show more"}
              </button>
            </div>

            {/* Continue */}
            <div className="flex justify-center mt-6 sm:mt-8">
              <button
                onClick={() => navigate(`/signup/org/form?orgType=${selected}`)}
                disabled={!selected}
                className="flex items-center gap-2 px-8 sm:px-10 py-3 sm:py-3.5 bg-[#f77f00] text-white text-sm sm:text-base font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.35)] w-full sm:w-auto justify-center"
              >
                Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
