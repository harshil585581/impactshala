import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SignupTypePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"individual" | "organisation">(
    "individual",
  );

  function handleSelect(type: "individual" | "organisation") {
    setSelected(type);
    if (type === "organisation") {
      navigate("/signup/org/select");
    } else {
      navigate(`/signup/step2?type=${type}`);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* ── Mobile / Tablet brand banner (hidden on lg+) ── */}
      <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-[#ff9400] to-[#003049]">
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#ff9400"/></svg>
            </div>
            <span className="text-white font-bold text-xl">Impactshaala</span>
          </div>
          <span className="text-white/80 text-xs sm:text-sm font-medium tracking-widest">
            STEP 01/03
          </span>
        </div>
        <div className="relative z-10 px-5 sm:px-8 pb-6 sm:pb-8">
          <p className="text-white text-lg sm:text-xl font-semibold leading-snug max-w-xs">
            Inspiring Education, Aspiring Opportunities!
          </p>
        </div>
      </div>

      {/* ── Desktop left panel (hidden below lg) ── */}
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
              <h2 className="text-white text-3xl xl:text-4xl font-semibold leading-[1.5] -mt-4">
                Inspiring Education,
                <br />
                Aspiring Opportunities!
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right / Main form panel ── */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Top bar — desktop only (mobile has banner above) */}
        <div className="hidden lg:flex items-center justify-between px-10 py-5">
          <Link
            to="/"
            className="flex items-center gap-1 text-[#8692a6] font-semibold text-base hover:text-[#f77f00] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
          <span className="text-[#bdbdbd] text-sm font-medium tracking-widest">
            STEP 01/03
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-12 lg:px-14 xl:px-20 py-4 lg:py-6">
          {/* Mobile back link */}
          <Link
            to="/"
            className="lg:hidden flex items-center gap-1 text-[#8692a6] font-semibold text-sm hover:text-[#f77f00] transition-colors mb-5 w-fit"
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

          {/* Mobile logo (inside content for tablets without a banner tall enough) */}
          <div className="lg:hidden flex items-center gap-2 self-start mb-6">
            <div className="w-7 h-7 rounded-full bg-[#ff9400] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/></svg>
            </div>
            <span className="text-[#18191c] font-bold text-lg">Impactshaala</span>
          </div>

          <h1 className="text-[#18191c] text-2xl sm:text-3xl font-semibold mb-2">
            Create Your Account
          </h1>
          <p className="text-[#5e6670] text-sm sm:text-base mb-7 sm:mb-8 max-w-sm leading-relaxed">
            To begin this journey, tell us what type of account you'd be
            opening.
          </p>

          {/* Account type cards */}
          <div className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-[440px]">
            {/* Individual */}
            <button
              onClick={() => handleSelect("individual")}
              className={`flex items-center gap-4 p-3 rounded-[12px] border transition-all text-left w-full group ${
                selected === "individual"
                  ? "border-[#f77f00] bg-[#fff6ed] shadow-[0px_4px_20px_rgba(0,0,0,0.05)]"
                  : "border-transparent bg-white shadow-[0px_2px_14px_1px_rgba(0,0,0,0.06)] hover:border-[#f77f00] hover:bg-[#fffbf5]"
              }`}
            >
              <div className="relative w-[52px] h-[52px] shrink-0 flex items-center justify-center">
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f77f00"
                  strokeWidth="1.2"
                >
                  <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" />
                </svg>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f77f00"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1e1e1e] text-sm sm:text-base">
                  Individual
                </p>
                <p className="text-[#5e6670] text-xs sm:text-sm mt-0.5 leading-snug">
                  Personal account to manage all your activities.
                </p>
              </div>
            </button>

            {/* Organisation */}
            <button
              onClick={() => handleSelect("organisation")}
              className={`flex items-center gap-4 p-3 rounded-[12px] border transition-all text-left w-full group ${
                selected === "organisation"
                  ? "border-[#f77f00] bg-[#fff6ed] shadow-[0px_4px_20px_rgba(0,0,0,0.05)]"
                  : "border-transparent bg-white shadow-[0px_2px_14px_1px_rgba(0,0,0,0.06)] hover:border-[#f77f00] hover:bg-[#fffbf5]"
              }`}
            >
              <div className="relative w-[52px] h-[52px] shrink-0 flex items-center justify-center">
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f77f00"
                  strokeWidth="1.2"
                >
                  <path d="M12 2.5L21.5 9.5L18 20.5H6L2.5 9.5L12 2.5Z" />
                </svg>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f77f00"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="7" width="18" height="13" rx="1.5" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  <line x1="8" y1="7" x2="8" y2="20" />
                  <line x1="16" y1="7" x2="16" y2="20" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1e1e1e] text-sm sm:text-base">
                  Organisation
                </p>
                <p className="text-[#5e6670] text-xs sm:text-sm mt-0.5 leading-snug">
                  Own or belong to a company, this is for you.
                </p>
              </div>
            </button>
          </div>


          <p className="mt-5 sm:mt-6 text-sm sm:text-base">
            <span className="text-[#5e6670]">Already have an account?</span>{" "}
            <Link
              to="/"
              className="text-[#f77f00] font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
