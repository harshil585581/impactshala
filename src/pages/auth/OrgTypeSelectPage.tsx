import { useState } from "react";
import { useNavigate } from "react-router-dom";

const INITIAL_TYPES = [
  { id: "educational", label: "Educational Institutions", desc: "Schools, colleges, and universities", emoji: "🎓" },
  { id: "forprofit", label: "For Profit Companies", desc: "Businesses and private enterprises", emoji: "💼" },
  { id: "nonprofit", label: "Non Profit NGOs", desc: "Charitable and social impact organizations", emoji: "🤝" },
  { id: "health", label: "Health Services", desc: "Healthcare and medical facilities", emoji: "🏥" },
  { id: "utilities", label: "Public Utilities", desc: "Government operated utilities", emoji: "⚡" },
  { id: "welfare", label: "Public Welfare Services", desc: "Government social support services", emoji: "🌱" },
  { id: "fieldtrip", label: "Educational Field Trip Venues", desc: "Experiential learning centers", emoji: "🗺️" },
  { id: "startup", label: "Startup Support Organization", desc: "Incubators, accelerators, and VC firms", emoji: "🚀" },
  { id: "talent", label: "Talent Showcase & Learning", desc: "Showcase learning & stage", emoji: "🎭" },
];

const MORE_TYPES = [
  { id: "safety", label: "Public Safety & Law", desc: "Police, legal, and emergency services", emoji: "🛡️" },
  { id: "international", label: "International Organization", desc: "Global institutions and networks", emoji: "🌐" },
  { id: "others", label: "Others", desc: "Any organization not listed above", emoji: "📋" },
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
      <div className="fixed inset-0 lg:flex hidden -z-10">
        {/* Left: gradient with logo */}
        <div className="relative w-1/2 h-full overflow-hidden bg-gradient-to-br from-[#ff9400] to-[#003049]">
          <div className="relative z-10 px-10 py-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#ff9400"/></svg>
            </div>
            <span className="text-white font-bold text-xl">Impactshaala</span>
          </div>
        </div>
        {/* Right: Solid light orange */}
        <div className="w-1/2 h-full bg-[#fedbb3]" />
      </div>

      {/* ── Mobile/Tablet top banner ── */}
      <div className="lg:hidden relative overflow-hidden shrink-0 bg-gradient-to-br from-[#ff9400] to-[#003049]">
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#ff9400"/></svg>
            </div>
            <span className="text-white font-bold text-xl">Impactshaala</span>
          </div>
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
      <div className="flex-1 flex items-start lg:items-center justify-center px-3 sm:px-4 lg:px-6 py-2 lg:py-4">
        <div className="w-full max-w-[1020px] bg-white lg:rounded-[17px] lg:shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-0">
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

          <div className="px-5 sm:px-8 lg:px-12 py-4 lg:py-6">
            <h2 className="hidden lg:block text-[#1f2937] text-xl sm:text-2xl font-semibold text-center mb-1">
              Select Organization Type
            </h2>
            <p className="hidden lg:block text-[#6b7280] text-sm sm:text-base text-center mb-4 sm:mb-5">
              Choose the category that best represents your organization
            </p>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
              {visibleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelected(type.id)}
                  className={`flex flex-col items-center text-center p-3 sm:p-4 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
                    selected === type.id
                      ? "border-[#f77f00] bg-[#fff6ed] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                      : "border-transparent bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)] hover:border-[#f77f00] hover:bg-[#fffbf5]"
                  }`}
                >
                  <span className="text-2xl sm:text-3xl mb-2" role="img">{type.emoji}</span>
                  <p className="font-semibold text-[#18191c] text-xs sm:text-sm leading-tight mb-0.5">
                    {type.label}
                  </p>
                  <p className="text-[#5e6670] text-[10px] sm:text-xs leading-snug">
                    {type.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Show more / less */}
            <div className="text-center mt-3 sm:mt-4">
              <button
                onClick={() => setShowMore((v) => !v)}
                className="text-[#f77f00] text-xs sm:text-sm font-medium underline underline-offset-2 hover:text-[#e07000] transition-colors"
              >
                {showMore ? "Show less" : "Show more"}
              </button>
            </div>

            {/* Continue */}
            <div className="flex justify-center mt-4 sm:mt-6">
              <button
                onClick={() => navigate(`/signup/org/form?orgType=${selected}`)}
                disabled={!selected}
                className="flex items-center gap-2 px-8 sm:px-10 py-2.5 sm:py-3 bg-[#f77f00] text-white text-xs sm:text-sm font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.35)] w-full sm:w-auto justify-center"
              >
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
