import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const bgPhoto = "https://www.figma.com/api/mcp/asset/8acdcd54-7ca5-4a0d-b693-591cbfdece21";
const whiteLogo = "https://www.figma.com/api/mcp/asset/d6e5d9b3-489f-4758-9655-08263b2209f7";
const primaryLogo = "https://www.figma.com/api/mcp/asset/74afddfa-47ae-4e56-bb54-0ef8d74734aa";

const roles = [
  { id: 'student',      label: 'Student',              desc: 'Currently pursuing a degree or certification.' },
  { id: 'graduate',     label: 'Recent Graduate',       desc: 'Graduated within the last 2 years.' },
  { id: 'professional', label: 'Working Professional',  desc: 'Currently employed and looking to grow.' },
  { id: 'jobseeker',    label: 'Job Seeker',            desc: 'Actively exploring new opportunities.' },
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
    <div className="flex flex-col lg:flex-row min-h-screen">

      {/* ── Mobile / Tablet brand banner (hidden on lg+) ── */}
      <div className="lg:hidden relative overflow-hidden">
        <img src={bgPhoto} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[rgba(255,148,0,0.55)]" />
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
          <img src={whiteLogo} alt="Impactshaala" className="h-9 sm:h-11 w-auto object-contain" />
          <span className="text-white/80 text-xs sm:text-sm font-medium tracking-widest">STEP 02/03</span>
        </div>
        <div className="relative z-10 px-5 sm:px-8 pb-6 sm:pb-8">
          <p className="text-white text-lg sm:text-xl font-semibold leading-snug max-w-xs">
            Inspiring Education, Aspiring Opportunities!
          </p>
        </div>
      </div>

      {/* ── Desktop left panel (hidden below lg) ── */}
      <div className="hidden lg:flex relative lg:w-[45%] xl:w-5/12 shrink-0 overflow-hidden flex-col">
        <img src={bgPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[rgba(255,148,0,0.5)]" />
        <div className="relative z-10 flex flex-col h-full px-10 py-8">
          <img src={whiteLogo} alt="Impactshaala" className="h-11 w-auto object-contain self-start" />
          <div className="flex-1 flex items-center">
            <div>
              <span className="text-white text-8xl font-bold leading-none">"</span>
              <h2 className="text-white text-3xl xl:text-4xl font-semibold leading-[1.5] -mt-4">
                Inspiring Education,<br />Aspiring Opportunities!
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right / Main form panel ── */}
      <div className="flex-1 bg-white flex flex-col">

        {/* Top bar — desktop only */}
        <div className="hidden lg:flex items-center justify-between px-10 py-5">
          <Link
            to="/signup"
            className="flex items-center gap-1 text-[#8692a6] font-semibold text-base hover:text-[#ff9400] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>
          <span className="text-[#bdbdbd] text-sm font-medium tracking-widest">STEP 02/03</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-12 lg:px-14 xl:px-20 py-8 lg:py-10">

          {/* Mobile back link */}
          <Link
            to="/signup"
            className="lg:hidden flex items-center gap-1 text-[#8692a6] font-semibold text-sm hover:text-[#ff9400] transition-colors mb-5 w-fit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>

          <img
            src={primaryLogo}
            alt="Impactshaala"
            className="lg:hidden h-8 w-auto object-contain self-start mb-6"
          />

          <h1 className="text-[#18191c] text-2xl sm:text-3xl font-semibold mb-2">
            Tell Us About Yourself
          </h1>
          <p className="text-[#5e6670] text-sm sm:text-base mb-7 sm:mb-8 max-w-sm leading-relaxed">
            Help us personalise your experience by selecting what best describes you.
          </p>

          {/* Role cards */}
          <div className="flex flex-col gap-3 w-full max-w-[440px]">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-[6px] border transition-all text-left w-full ${
                  selected === role.id
                    ? 'border-[#f77f00] bg-[#fff6ed] shadow-[0px_4px_14px_1px_rgba(0,0,0,0.04)]'
                    : 'border-[#f2f2f3] bg-white hover:border-[#f77f00] hover:bg-[#fffbf5]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    selected === role.id ? 'border-[#f77f00]' : 'border-[#d0d0d0]'
                  }`}
                >
                  {selected === role.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f77f00]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1e1e1e] text-sm sm:text-base">{role.label}</p>
                  <p className="text-[#5e6670] text-xs sm:text-sm mt-0.5 leading-snug">{role.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`mt-7 sm:mt-8 w-full max-w-[440px] h-[48px] sm:h-[52px] rounded-full text-sm sm:text-base font-semibold transition-all ${
              selected
                ? 'bg-[#ff9400] text-white hover:bg-[#e68500] shadow-[0px_4px_12px_rgba(255,148,0,0.35)]'
                : 'bg-[#f2f2f3] text-[#aaa] cursor-not-allowed'
            }`}
          >
            Continue
          </button>

          <p className="mt-6 text-sm sm:text-base">
            <span className="text-[#5e6670]">Already have an account?</span>{' '}
            <Link to="/" className="text-[#f77f00] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
