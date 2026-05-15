import { useState } from "react";
import { useNavigate } from "react-router-dom";

const primaryLogo =
  "https://www.figma.com/api/mcp/asset/e0e7b988-96c4-4b52-b3fa-190c7cd06977";

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="1"
        y1="1"
        x2="23"
        y2="23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const inputCls =
  "w-full h-[40px] sm:h-[44px] border border-[#e4e5e8] rounded-full px-4 pr-12 text-[#1e1e1e] text-sm sm:text-base placeholder-[#767f8c] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors bg-white";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  function toggleShow(field: "newPassword" | "confirmPassword") {
    setShow((s) => ({ ...s, [field]: !s[field] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-center px-5 pt-4 pb-2 shrink-0">
        <img
          src={primaryLogo}
          alt="Impactshaala"
          className="h-9 sm:h-10 w-auto object-contain"
        />
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-4 lg:py-6">
        <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-[536px]">
          {/* Heading */}
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h1 className="text-[#18191c] text-xl sm:text-2xl font-semibold leading-tight">
              Reset Password
            </h1>
            <p className="text-[#64748b] text-sm leading-relaxed">
              Enter the email address associated with your account and we will
              send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* New Password */}
            <div className="relative">
              <input
                type={show.newPassword ? "text" : "password"}
                placeholder="New Password"
                value={form.newPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, newPassword: e.target.value }))
                }
                className={inputCls}
                required
              />
              <button
                type="button"
                onClick={() => toggleShow("newPassword")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#767f8c] hover:text-[#5e6670] transition-colors"
                aria-label={
                  show.newPassword ? "Hide password" : "Show password"
                }
              >
                {show.newPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={show.confirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                className={inputCls}
                required
              />
              <button
                type="button"
                onClick={() => toggleShow("confirmPassword")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#767f8c] hover:text-[#5e6670] transition-colors"
                aria-label={
                  show.confirmPassword ? "Hide password" : "Show password"
                }
              >
                {show.confirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="flex items-center justify-center gap-3 w-full h-[46px] bg-[#f77f00] text-white text-sm sm:text-base font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.35)] mt-0.5"
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
          </form>
        </div>
      </div>
    </div>
  );
}
