import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/images/logo/logo.png";

/* ── SVG icons per org type ── */
const EducationalIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <path d="M22 10L8 17l14 7 14-7-14-7z" stroke="#f77f00" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    <path d="M8 17v8" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M13 20v6c0 2.5 4 5 9 5s9-2.5 9-5v-6" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

const ForProfitIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <rect x="10" y="20" width="24" height="14" rx="2" stroke="#f77f00" strokeWidth="1.8" fill="none" />
    <path d="M15 20v-4a7 7 0 0114 0v4" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <circle cx="22" cy="27" r="2.5" stroke="#f77f00" strokeWidth="1.8" fill="none" />
  </svg>
);

const NonProfitIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <path d="M22 32s-10-6.5-10-13a6 6 0 0110-4.5A6 6 0 0132 19c0 6.5-10 13-10 13z" stroke="#f77f00" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
  </svg>
);

const HealthIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <rect x="10" y="14" width="24" height="20" rx="3" stroke="#f77f00" strokeWidth="1.8" fill="none" />
    <path d="M22 19v10M17 24h10" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16 14v-2M28 14v-2" stroke="#f77f00" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const UtilitiesIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <path d="M22 10l-4 8h8l-4 16" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M14 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

const WelfareIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <circle cx="22" cy="17" r="5" stroke="#f77f00" strokeWidth="1.8" fill="none" />
    <path d="M12 34c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M28 22l4 2-2 4" stroke="#f77f00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const FieldTripIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <circle cx="22" cy="19" r="5" stroke="#f77f00" strokeWidth="1.8" fill="none" />
    <path d="M22 24c-6 0-11 4-11 9h22c0-5-5-9-11-9z" stroke="#f77f00" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    <circle cx="22" cy="19" r="2" fill="#f77f00" />
  </svg>
);

const StartupIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <path d="M22 10c-1 4-4 7-8 9 0 6 3 10 8 13 5-3 8-7 8-13-4-2-7-5-8-9z" stroke="#f77f00" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    <circle cx="22" cy="19" r="2.5" fill="#f77f00" />
    <path d="M14 32l2-2" stroke="#f77f00" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const TalentIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <path d="M22 12l2.5 7.5H32l-6.5 4.5 2.5 7.5L22 27l-6 4.5 2.5-7.5L12 19.5h7.5z" stroke="#f77f00" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
  </svg>
);

const SafetyIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <path d="M22 10l-10 4v9c0 5.5 4 10.5 10 13 6-2.5 10-7.5 10-13v-9l-10-4z" stroke="#f77f00" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    <path d="M17 22l3 3 7-7" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InternationalIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <circle cx="22" cy="22" r="10" stroke="#f77f00" strokeWidth="1.8" fill="none" />
    <ellipse cx="22" cy="22" rx="4.5" ry="10" stroke="#f77f00" strokeWidth="1.6" fill="none" />
    <path d="M12 22h20M12 17.5c2.5 1.5 5.5 2.5 10 2.5s7.5-1 10-2.5M12 26.5c2.5-1.5 5.5-2.5 10-2.5s7.5 1 10 2.5" stroke="#f77f00" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const OthersIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#fff6ed" />
    <rect x="10" y="13" width="24" height="18" rx="3" stroke="#f77f00" strokeWidth="1.8" fill="none" />
    <path d="M15 19h14M15 23h10M15 27h7" stroke="#f77f00" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ORG_TYPES = [
  { id: "educational", label: "Educational Institutions", desc: "Schools, colleges, and universities", Icon: EducationalIcon },
  { id: "forprofit",   label: "For Profit Companies",     desc: "Businesses and private enterprises",   Icon: ForProfitIcon },
  { id: "nonprofit",  label: "Non Profit NGOs",           desc: "Charitable and social impact organizations", Icon: NonProfitIcon },
  { id: "health",     label: "Health Services",           desc: "Healthcare and medical facilities",    Icon: HealthIcon },
  { id: "utilities",  label: "Public Utilities",          desc: "Government operated utilities",        Icon: UtilitiesIcon },
  { id: "welfare",    label: "Public Welfare Services",   desc: "Government social support services",   Icon: WelfareIcon },
  { id: "fieldtrip",  label: "Educational Field Trip Venues", desc: "Experiential learning centers",   Icon: FieldTripIcon },
  { id: "startup",    label: "Startup Support Organization", desc: "Incubators, accelerators, and VC firms", Icon: StartupIcon },
  { id: "talent",     label: "Talent Showcase & Learning", desc: "Showcase learning & stage",           Icon: TalentIcon },
  { id: "safety",     label: "Public Safety & Law",       desc: "Police, legal, and emergency services", Icon: SafetyIcon },
  { id: "international", label: "International Organization", desc: "Global institutions and networks", Icon: InternationalIcon },
  { id: "others",     label: "Others",                    desc: "Any organization not listed above",    Icon: OthersIcon },
];

const VISIBLE_DEFAULT = 9;

export default function OrgTypeSelectPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("educational");
  const [showAll, setShowAll] = useState(false);

  const visibleTypes = showAll ? ORG_TYPES : ORG_TYPES.slice(0, VISIBLE_DEFAULT);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ff9400] to-[#e07000] px-4 py-8">
      {/* Logo — top-left */}
      <div className="fixed top-7 left-8 z-20">
        <img src={logoImg} alt="Impactshaala" className="h-8 w-auto object-contain brightness-0 invert" />
      </div>

      {/* Modal */}
      <div className="relative w-full max-w-[1003px] bg-white rounded-[17px] shadow-2xl px-10 py-10">
        {/* Close button */}
        <button
          onClick={() => navigate("/signup")}
          className="absolute top-[22px] right-[22px] text-[#9ca3af] hover:text-[#374151] transition-colors p-1.5"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-[32px] font-semibold text-[#1f2937] leading-tight mb-2">
            Select Organization Type
          </h2>
          <p className="text-[18px] text-[#6b7280]">
            Choose the category that best represents your organization
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-4">
          {visibleTypes.map(({ id, label, desc, Icon }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex flex-col items-center text-center p-5 rounded-[16px] border-2 transition-all h-[152px] ${
                selected === id
                  ? "border-[#ff9400] bg-[#fff6ed]"
                  : "border-transparent bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)] hover:border-[#ff9400] hover:bg-[#fffbf5]"
              }`}
            >
              <div className="mb-3">
                <Icon />
              </div>
              <p className="font-medium text-[16px] text-[#18191c] leading-tight mb-1">{label}</p>
              <p className="text-[14px] text-[#5e6670] leading-snug">{desc}</p>
            </button>
          ))}
        </div>

        {/* Show more */}
        {!showAll && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowAll(true)}
              className="text-[#f77f00] text-[15px] underline underline-offset-2 hover:text-[#e06800] transition-colors"
            >
              Show more
            </button>
          </div>
        )}

        {/* Continue button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate(`/signup/org/form?orgType=${selected}`)}
            disabled={!selected}
            className="flex items-center gap-2.5 px-8 py-4 bg-[#ff9400] text-white text-[15px] font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_16px_rgba(255,148,0,0.35)]"
          >
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
