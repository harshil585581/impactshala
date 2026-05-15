import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const roles = [
  { id: "student", label: "Student", desc: "School or college learners" },
  { id: "professional", label: "Working Professional", desc: "Employed individuals across fields" },
  { id: "entrepreneur", label: "Entrepreneur", desc: "Startup founders or business owners." },
  { id: "educator", label: "Creative Arts and Enrichment Educator", desc: "Educators in arts, wellness, or hobbies." },
];

function RoleIcon({ id }: { id: string }) {
  const cls = "w-10 h-10 shrink-0";
  if (id === "student") return <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (id === "professional") return <svg className={cls} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="#f77f00" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="12" x2="12" y2="16" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round"/><line x1="10" y1="14" x2="14" y2="14" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (id === "entrepreneur") return <svg className={cls} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="4" stroke="#f77f00" strokeWidth="1.5"/><path d="M3 20c0-4 3.6-7 8-7h2c4.4 0 8 3 8 7" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 6V2M15 7l2-2M9 7L7 5" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  return <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export default function SignupStep2Page() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const type = params.get("type") ?? "individual";
  const [selected, setSelected] = useState("");

  function handleContinue() {
    if (selected) navigate(`/signup/form?type=${type}&role=${selected}`);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#ff9400] to-[#003049]">
      {/* White logo — top left */}
      <div className="absolute top-6 left-8 sm:top-8 sm:left-10 z-10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#ff9400"/></svg>
        </div>
        <span className="text-white font-bold text-xl">Impactshaala</span>
      </div>

      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-[0px_8px_40px_rgba(0,0,0,0.14)] w-full max-w-[700px] mx-4 px-8 sm:px-12 py-5 sm:py-6 lg:py-8">
        {/* Close / back */}
        <button
          onClick={() => navigate("/signup")}
          className="absolute top-5 right-5 text-[#9ca3af] hover:text-[#374151] transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-5 lg:mb-6">
          <h2 className="text-[#1f2937] text-xl sm:text-2xl font-semibold leading-snug">
            Select Individual Type
          </h2>
          <p className="text-[#6b7280] text-sm sm:text-base mt-1.5">
            Choose the category that best represents you
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
          {roles.map((role) => {
            const active = selected === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`flex items-center gap-3.5 p-3 rounded-[6px] border text-left transition-all w-full ${
                  active
                    ? "border-[#f77f00] bg-[#fff6ed] shadow-[0px_4px_14px_1px_rgba(0,0,0,0.04)]"
                    : "border-transparent bg-white shadow-[0px_4px_14px_1px_rgba(0,0,0,0.04)] hover:border-[#f77f00] hover:bg-[#fffbf5]"
                }`}
              >
                <RoleIcon id={role.id} />
                <div className="min-w-0">
                  <p className="font-semibold text-[#18191c] text-sm sm:text-base leading-snug">
                    {role.label}
                  </p>
                  <p className="text-[#5e6670] text-xs sm:text-sm mt-0.5 leading-snug">
                    {role.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue */}
        <div className="flex justify-center mt-5 sm:mt-6">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`flex items-center gap-2 px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-semibold transition-all ${
              selected
                ? "bg-[#f77f00] text-white hover:bg-[#e68500] shadow-[0px_4px_12px_rgba(255,148,0,0.35)]"
                : "bg-[#f2f2f3] text-[#aaa] cursor-not-allowed"
            }`}
          >
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm sm:text-base mt-3 sm:mt-4">
          <span className="text-[#6b7280]">Already have an account?</span>{" "}
          <Link to="/" className="text-[#f77f00] font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
