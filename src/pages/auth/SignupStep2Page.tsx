import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const bgPhoto    = "https://www.figma.com/api/mcp/asset/51f58c05-824a-41b1-9997-1d8792234420";
const whiteLogo  = "https://www.figma.com/api/mcp/asset/6f950d39-decc-4cd7-bdc2-5bdb6459cf3f";
const iconStudent     = "https://www.figma.com/api/mcp/asset/c1fdc34e-d873-4f90-8bdc-26893630c9ff";
const iconProfessional = "https://www.figma.com/api/mcp/asset/445ad34a-fcb9-456e-b4ce-c579343b4c86";
const iconEntrepreneur = "https://www.figma.com/api/mcp/asset/be8f216d-f01d-4a40-b5f0-9713bcd3636b";
const iconCreative    = "https://www.figma.com/api/mcp/asset/5b13bea0-558d-49a9-bb05-efc476221cc2";

const roles = [
  { id: 'student',      label: 'Student',                            desc: 'School or college learners',           icon: iconStudent },
  { id: 'professional', label: 'Working Professional',               desc: 'Employed individuals across fields',   icon: iconProfessional },
  { id: 'entrepreneur', label: 'Entrepreneur',                       desc: 'Startup founders or business owners.', icon: iconEntrepreneur },
  { id: 'educator',     label: 'Creative Arts and Enrichment Educator', desc: 'Educators in arts, wellness, or hobbies.', icon: iconCreative },
];

export default function SignupStep2Page() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const type = params.get('type') ?? 'individual';
  const [selected, setSelected] = useState('');

  function handleContinue() {
    if (selected) navigate(`/signup/form?type=${type}&role=${selected}`);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Full-screen background */}
      <img src={bgPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[rgba(255,148,0,0.5)]" />

      {/* White logo — top left */}
      <div className="absolute top-6 left-8 sm:top-8 sm:left-10 z-10">
        <img src={whiteLogo} alt="Impactshaala" className="h-9 sm:h-11 w-auto object-contain" />
      </div>

      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-[0px_8px_40px_rgba(0,0,0,0.14)] w-full max-w-[700px] mx-4 px-8 sm:px-12 py-10">

        {/* Close / back */}
        <button
          onClick={() => navigate('/signup')}
          className="absolute top-5 right-5 text-[#9ca3af] hover:text-[#374151] transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-7">
          <h2 className="text-[#1f2937] text-2xl sm:text-[32px] font-semibold leading-snug">
            Select Individual Type
          </h2>
          <p className="text-[#6b7280] text-sm sm:text-[18px] mt-2">
            Choose the category that best represents you
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {roles.map((role) => {
            const active = selected === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`flex items-center gap-4 p-4 rounded-[6px] border text-left transition-all w-full ${
                  active
                    ? 'border-[#f77f00] bg-[#fff6ed] shadow-[0px_4px_14px_1px_rgba(0,0,0,0.04)]'
                    : 'border-transparent bg-white shadow-[0px_4px_14px_1px_rgba(0,0,0,0.04)] hover:border-[#f77f00] hover:bg-[#fffbf5]'
                }`}
              >
                <img src={role.icon} alt="" className="w-10 h-10 object-contain shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-[#18191c] text-sm sm:text-base leading-snug">{role.label}</p>
                  <p className="text-[#5e6670] text-xs sm:text-sm mt-0.5 leading-snug">{role.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-full text-sm sm:text-base font-semibold transition-all ${
              selected
                ? 'bg-[#ff9400] text-white hover:bg-[#e68500] shadow-[0px_4px_12px_rgba(255,148,0,0.35)]'
                : 'bg-[#f2f2f3] text-[#aaa] cursor-not-allowed'
            }`}
          >
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm sm:text-base mt-5">
          <span className="text-[#6b7280]">Already have an account?</span>{' '}
          <Link to="/" className="text-[#f77f00] font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
