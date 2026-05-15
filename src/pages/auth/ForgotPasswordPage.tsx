import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate("/reset-password");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* ── Mobile / Tablet brand banner (hidden on lg+) ── */}
      <div className="lg:hidden relative overflow-hidden shrink-0 bg-gradient-to-br from-[#ff9400] to-[#003049]">
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#ff9400"/></svg>
            </div>
            <span className="text-white font-bold text-xl">Impactshaala</span>
          </div>
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
        <div className="hidden lg:flex items-center gap-2 px-8 xl:px-10 py-5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#ff9400] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/></svg>
          </div>
          <span className="text-[#18191c] font-bold text-xl">Impactshaala</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-12 lg:px-14 xl:px-20 py-6 lg:py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 self-start mb-5">
            <div className="w-7 h-7 rounded-full bg-[#ff9400] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/></svg>
            </div>
            <span className="text-[#18191c] font-bold text-lg">Impactshaala</span>
          </div>

          {/* Back link (mobile) */}
          <Link
            to="/"
            className="lg:hidden flex items-center gap-1 text-[#8692a6] font-semibold text-sm hover:text-[#f77f00] transition-colors mb-4 w-fit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>

          <h1 className="text-[#18191c] text-xl sm:text-2xl font-semibold leading-tight mb-5 lg:mb-6">
            Forgot Password
          </h1>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 sm:gap-5 w-full max-w-[536px]"
          >
            {/* Email input */}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[40px] sm:h-[44px] border border-[#e4e5e8] rounded-full px-4 text-[#1e1e1e] text-sm sm:text-base placeholder-[#767f8c] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors bg-white"
            />

            {/* Reset button */}
            <button
              type="submit"
              className="flex items-center justify-center gap-3 w-full h-[46px] bg-[#f77f00] text-white text-sm sm:text-base font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.35)]"
            >
              Reset Password
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

            {/* Links */}
            <div className="flex flex-col gap-1.5 text-sm sm:text-base">
              <p>
                <span className="text-[#5e6670]">Go back to </span>
                <Link
                  to="/"
                  className="text-[#f77f00] font-medium hover:underline"
                >
                  Sign In
                </Link>
              </p>
              <p>
                <span className="text-[#5e6670]">Don't have account </span>
                <Link
                  to="/signup"
                  className="text-[#f77f00] font-medium hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* ── Right orange photo panel (desktop only) ── */}
      <div className="hidden lg:flex relative lg:w-[45%] xl:w-5/12 shrink-0 overflow-hidden flex-col bg-gradient-to-br from-[#ff9400] to-[#003049]">
        <div className="relative z-10 flex flex-col h-full px-10 py-8">
          <div className="flex items-center gap-2 self-start">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#ff9400"/></svg>
            </div>
            <span className="text-white font-bold text-xl">Impactshaala</span>
          </div>
          <div className="flex-1 flex items-center">
            <div>
              <span className="text-white text-8xl font-bold leading-none">
                "
              </span>
              <h2 className="text-[#e5e7eb] text-3xl xl:text-4xl font-semibold leading-[1.5] -mt-4">
                Inspiring Education,
                <br />
                Aspiring Opportunities!
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
