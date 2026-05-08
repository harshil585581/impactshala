import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const bgPhoto    = "https://www.figma.com/api/mcp/asset/6e36ccb9-2f0d-417b-94fe-f82f224c652f";
const whiteLogo  = "https://www.figma.com/api/mcp/asset/d6e5d9b3-489f-4758-9655-08263b2209f7";
const primaryLogo = "https://www.figma.com/api/mcp/asset/ddd2c871-24a1-460d-83c1-50b77614f1c0";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate('/reset-password');
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">

      {/* ── Mobile / Tablet brand banner (hidden on lg+) ── */}
      <div className="lg:hidden relative overflow-hidden shrink-0">
        <img src={bgPhoto} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[rgba(255,148,0,0.55)]" />
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
          <img src={whiteLogo} alt="Impactshaala" className="h-9 sm:h-11 w-auto object-contain" />
        </div>
        <div className="relative z-10 px-5 sm:px-8 pb-6 sm:pb-8">
          <p className="text-white text-lg sm:text-xl font-semibold leading-snug max-w-xs">
            Inspiring Education, Aspiring Opportunities!
          </p>
        </div>
      </div>

      {/* ── Desktop left panel ── */}
      <div className="flex-1 bg-white flex flex-col">

        {/* Desktop logo */}
        <div className="hidden lg:flex items-center px-8 xl:px-10 py-5 shrink-0">
          <img src={primaryLogo} alt="Impactshaala" className="h-9 xl:h-10 w-auto object-contain" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-12 lg:px-14 xl:px-20 py-10 lg:py-8">

          {/* Mobile logo */}
          <img
            src={primaryLogo}
            alt="Impactshaala"
            className="lg:hidden h-8 w-auto object-contain self-start mb-8"
          />

          {/* Back link (mobile) */}
          <Link
            to="/"
            className="lg:hidden flex items-center gap-1 text-[#8692a6] font-semibold text-sm hover:text-[#ff9400] transition-colors mb-6 w-fit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>

          <h1 className="text-[#18191c] text-2xl sm:text-[32px] font-semibold leading-tight mb-8">
            Forgot Password
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-[536px]">

            {/* Email input */}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[48px] border border-[#e4e5e8] rounded-full px-4 text-[#1e1e1e] text-sm sm:text-base placeholder-[#767f8c] focus:outline-none focus:border-[#ff9400] focus:ring-1 focus:ring-[#ff9400] transition-colors bg-white"
            />

            {/* Reset button */}
            <button
              type="submit"
              className="flex items-center justify-center gap-3 w-full h-[56px] bg-[#ff9400] text-white text-sm sm:text-base font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.35)]"
            >
              Reset Password
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Links */}
            <div className="flex flex-col gap-2 text-sm sm:text-base">
              <p>
                <span className="text-[#5e6670]">Go back to </span>
                <Link to="/" className="text-[#ff9400] font-medium hover:underline">
                  Sign In
                </Link>
              </p>
              <p>
                <span className="text-[#5e6670]">Don't have account </span>
                <Link to="/signup" className="text-[#ff9400] font-medium hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* ── Right orange photo panel (desktop only) ── */}
      <div className="hidden lg:flex relative lg:w-[45%] xl:w-5/12 shrink-0 overflow-hidden flex-col">
        <img src={bgPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[rgba(255,148,0,0.5)]" />
        <div className="relative z-10 flex flex-col h-full px-10 py-8">
          <img src={whiteLogo} alt="Impactshaala" className="h-11 w-auto object-contain self-start" />
          <div className="flex-1 flex items-center">
            <div>
              <span className="text-white text-8xl font-bold leading-none">"</span>
              <h2 className="text-[#e5e7eb] text-3xl xl:text-4xl font-semibold leading-[1.5] -mt-4">
                Inspiring Education,<br />Aspiring Opportunities!
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
