import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const bgPhoto =
  "https://www.figma.com/api/mcp/asset/8acdcd54-7ca5-4a0d-b693-591cbfdece21";
const whiteLogo =
  "https://www.figma.com/api/mcp/asset/d6e5d9b3-489f-4758-9655-08263b2209f7";
const primaryLogo =
  "https://www.figma.com/api/mcp/asset/74afddfa-47ae-4e56-bb54-0ef8d74734aa";
const iconIndividual =
  "https://www.figma.com/api/mcp/asset/a99eae6a-0252-4b53-92e3-118c2295ea10";
const iconOrganisation =
  "https://www.figma.com/api/mcp/asset/c1e0ba63-c48b-4f4f-9b35-2ad4e5b6f3e4";

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
      <div className="lg:hidden relative overflow-hidden">
        <img
          src={bgPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[rgba(255,148,0,0.55)]" />
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
          <img
            src={whiteLogo}
            alt="Impactshaala"
            className="h-9 sm:h-11 w-auto object-contain"
          />
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
      <div className="hidden lg:flex relative lg:w-[45%] xl:w-5/12 shrink-0 overflow-hidden flex-col">
        <img
          src={bgPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(255,148,0,0.5)]" />
        <div className="relative z-10 flex flex-col h-full px-10 py-8">
          <img
            src={whiteLogo}
            alt="Impactshaala"
            className="h-11 w-auto object-contain self-start"
          />
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
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-12 lg:px-14 xl:px-20 py-8 lg:py-10">
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
          <img
            src={primaryLogo}
            alt="Impactshaala"
            className="lg:hidden h-8 w-auto object-contain self-start mb-6"
          />

          <h1 className="text-[#18191c] text-2xl sm:text-3xl font-semibold mb-2">
            Create Your Account
          </h1>
          <p className="text-[#5e6670] text-sm sm:text-base mb-7 sm:mb-8 max-w-sm leading-relaxed">
            To begin this journey, tell us what type of account you'd be
            opening.
          </p>

          {/* Account type cards */}
          <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-[440px]">
            {/* Individual */}
            <button
              onClick={() => handleSelect("individual")}
              className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-[6px] border transition-all text-left w-full group ${
                selected === "individual"
                  ? "border-[#f77f00] bg-[#fff6ed] shadow-[0px_4px_14px_1px_rgba(0,0,0,0.04)]"
                  : "border-transparent bg-white shadow-[0px_2px_14px_1px_rgba(0,0,0,0.06)] hover:border-[#f77f00] hover:bg-[#fffbf5]"
              }`}
            >
              <div className="relative w-11 h-11 sm:w-[52px] sm:h-[52px] shrink-0">
                <img
                  src={iconIndividual}
                  alt=""
                  className="absolute inset-0 w-full h-full"
                />
                <svg
                  className="absolute inset-0 m-auto"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2" />
                  <path
                    d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
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
              <div className="shrink-0 w-7 h-7 rounded-full bg-[#fff0de] flex items-center justify-center group-hover:bg-[#f77f00] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="#f77f00"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-white"
                  />
                </svg>
              </div>
            </button>

            {/* Organisation */}
            <button
              onClick={() => handleSelect("organisation")}
              className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-[6px] border transition-all text-left w-full group ${
                selected === "organisation"
                  ? "border-[#f77f00] bg-[#fff6ed] shadow-[0px_4px_14px_1px_rgba(0,0,0,0.04)]"
                  : "border-transparent bg-white shadow-[0px_2px_14px_1px_rgba(0,0,0,0.06)] hover:border-[#f77f00] hover:bg-[#fffbf5]"
              }`}
            >
              <div className="relative w-11 h-11 sm:w-[52px] sm:h-[52px] shrink-0">
                <img
                  src={iconOrganisation}
                  alt=""
                  className="absolute inset-0 w-full h-full"
                />
                <svg
                  className="absolute inset-0 m-auto"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <rect
                    x="2"
                    y="7"
                    width="20"
                    height="14"
                    rx="2"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
                    stroke="white"
                    strokeWidth="2"
                  />
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
              <div className="shrink-0 w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center group-hover:bg-[#f77f00] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="#aaa"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-white"
                  />
                </svg>
              </div>
            </button>
          </div>

          <p className="mt-7 sm:mt-8 text-sm sm:text-base">
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
