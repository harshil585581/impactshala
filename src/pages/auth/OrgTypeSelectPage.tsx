import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/images/logo/logo.png";
import signupBg from "../../assets/images/loginsignup/l2.jpg";
import eduIcon from "../../assets/images/signup/edu.svg";
import fprofitIcon from "../../assets/images/signup/fprofit.svg";
import nprofitIcon from "../../assets/images/signup/nprofit.svg";
import hsIcon from "../../assets/images/signup/hs.svg";
import puIcon from "../../assets/images/signup/pu.svg";
import pwIcon from "../../assets/images/signup/pw.svg";
import startupIcon from "../../assets/images/signup/startup.svg";
import talentIcon from "../../assets/images/signup/talent.svg";

/* ── Filled/solid icons matching Figma ── */
const EducationalIcon = () => (
  <img src={eduIcon} alt="Educational Institutions" width="36" height="36" />
);

const ForProfitIcon = () => (
  <img src={fprofitIcon} alt="For Profit Companies" width="36" height="36" />
);

const NonProfitIcon = () => (
  <img src={nprofitIcon} alt="Non Profit NGOs" width="36" height="36" />
);

const HealthIcon = () => (
  <img src={hsIcon} alt="Health Services" width="36" height="36" />
);

const UtilitiesIcon = () => (
  <img src={puIcon} alt="Public Utilities" width="36" height="36" />
);

const WelfareIcon = () => (
  <img src={pwIcon} alt="Public Welfare Services" width="36" height="36" />
);

const FieldTripIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <path d="M22 8C17 8 13 12 13 17c0 7 9 18 9 18s9-11 9-18c0-5-4-9-9-9z" fill="#f77f00" />
    <circle cx="22" cy="17" r="4" fill="white" />
  </svg>
);

const StartupIcon = () => (
  <img src={startupIcon} alt="Startup Support Organization" width="36" height="36" />
);

const TalentIcon = () => (
  <img src={talentIcon} alt="Talent Showcase & Learning" width="36" height="36" />
);

const SafetyIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <path d="M22 8l-13 5v11c0 7.5 5.5 14 13 17 7.5-3 13-9.5 13-17V13L22 8z" fill="#f77f00" />
    <path d="M16 22l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InternationalIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <circle cx="22" cy="22" r="13" fill="#f77f00" />
    <ellipse cx="22" cy="22" rx="5.5" ry="13" stroke="white" strokeWidth="1.5" fill="none" />
    <path d="M9 22h26M9 16.5c3.5 2 7 3 13 3s9.5-1 13-3M9 27.5c3.5-2 7-3 13-3s9.5 1 13 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const OthersIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="8" y="10" width="28" height="24" rx="4" fill="#f77f00" />
    <path d="M14 18h16M14 23h12M14 28h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ORG_TYPES = [
  { id: "educational",   label: "Educational Institutions",      desc: "Schools, colleges, and universities",        Icon: EducationalIcon },
  { id: "forprofit",     label: "For Profit Companies",          desc: "Businesses and private enterprises",         Icon: ForProfitIcon },
  { id: "nonprofit",    label: "Non Profit NGOs",               desc: "Charitable and social impact organizations", Icon: NonProfitIcon },
  { id: "health",       label: "Health Services",               desc: "Healthcare and medical facilities",          Icon: HealthIcon },
  { id: "utilities",    label: "Public Utilities",              desc: "Government operated utilities",              Icon: UtilitiesIcon },
  { id: "welfare",      label: "Public Welfare Services",       desc: "Government social support services",         Icon: WelfareIcon },
  { id: "fieldtrip",    label: "Educational Field Trip Venues", desc: "Experiential learning centers",              Icon: FieldTripIcon },
  { id: "startup",      label: "Startup Support Organization",  desc: "Incubators, accelerators, and VC firms",     Icon: StartupIcon },
  { id: "talent",       label: "Talent Showcase & Learning",    desc: "Showcase learning & stage",                  Icon: TalentIcon },
  { id: "safety",       label: "Public Safety & Law",           desc: "Police, legal, and emergency services",      Icon: SafetyIcon },
  { id: "international",label: "International Organization",    desc: "Global institutions and networks",           Icon: InternationalIcon },
  { id: "others",       label: "Others",                        desc: "Any organization not listed above",          Icon: OthersIcon },
];

const VISIBLE_DEFAULT = 9;

export default function OrgTypeSelectPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [showAll, setShowAll] = useState(false);

  const visibleTypes = showAll ? ORG_TYPES : ORG_TYPES.slice(0, VISIBLE_DEFAULT);

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Split background */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 relative bg-cover bg-center" style={{ backgroundImage: `url(${signupBg})` }}>
          <div className="absolute inset-0" style={{ background: 'rgba(255, 148, 0, 0.50)' }} />
        </div>
        <div className="w-1/2" style={{ background: 'rgba(255, 148, 0, 0.50)' }} />
      </div>

      {/* Logo */}
      <div className="relative z-10 px-6 sm:px-10 py-6">
        <img src={logoImg} alt="Impactshaala" className="h-8 w-auto object-contain" />
      </div>

      {/* Centered modal */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-[860px] bg-white rounded-[17px] shadow-2xl px-8 py-8">

          {/* Close */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => navigate("/signup")}
              className="text-[#9ca3af] hover:text-[#374151] transition-colors p-1"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-[#1f2937] text-[26px] font-semibold leading-tight mb-1">
              Select Organization Type
            </h2>
            <p className="text-[#6b7280] text-[15px]">
              Choose the category that best represents your organization
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-3">
            {visibleTypes.map(({ id, label, desc, Icon }) => (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`flex flex-col items-center text-center p-4 rounded-[14px] border-2 transition-all h-[130px] ${
                  selected === id
                    ? "border-[#ff9400] bg-[#fff6ed] shadow-[0px_2px_12px_rgba(0,0,0,0.10)]"
                    : "border-transparent bg-white shadow-[0px_2px_12px_rgba(0,0,0,0.08)] hover:border-[#ff9400] hover:bg-[#fffbf5]"
                }`}
              >
                <div className="mb-2 [&>svg]:w-[36px] [&>svg]:h-[36px]">
                  <Icon />
                </div>
                <p className="font-semibold text-[13px] text-[#18191c] leading-tight mb-0.5">{label}</p>
                <p className="text-[12px] text-[#5e6670] leading-snug">{desc}</p>
              </button>
            ))}
          </div>

          {/* Show more */}
          {!showAll && (
            <div className="text-center mt-3">
              <button
                onClick={() => setShowAll(true)}
                className="text-[#f77f00] text-[13px] underline underline-offset-2 hover:text-[#e06800] transition-colors"
              >
                Show more
              </button>
            </div>
          )}

          {/* Continue */}
          <div className="flex justify-center mt-5">
            <button
              onClick={() => navigate(`/signup/org/form?orgType=${selected}`)}
              disabled={!selected}
              className="flex items-center gap-2 px-7 py-3 bg-[#ff9400] text-white text-[15px] font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_16px_rgba(255,148,0,0.35)] disabled:opacity-60"
            >
              Continue
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
