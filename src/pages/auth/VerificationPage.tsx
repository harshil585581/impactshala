import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getRoleRoute(): string {
  const role = localStorage.getItem("pending_signup_role") ?? "";
  const userType = localStorage.getItem("pending_signup_user_type") ?? "";
  if (userType === "individual") {
    if (role === "entrepreneur") return "/account/update/entrepreneur";
    if (role === "professional") return "/account/update/professional";
    if (role === "educator") return "/account/update/educator";
    return "/account/update/student";
  }
  return "/home";
}

export default function VerificationPage() {
  const navigate = useNavigate();
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleResend() {
    const email = localStorage.getItem("pending_verification_email");
    if (!email) return;

    setResendStatus("sending");
    try {
      const res = await fetch(`${API_URL}/api/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setResendStatus("sent");
      setTimeout(() => setResendStatus("idle"), 5000);
    } catch {
      setResendStatus("error");
      setTimeout(() => setResendStatus("idle"), 4000);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-center px-5 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#ff9400] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/></svg>
          </div>
          <span className="text-[#18191c] font-bold text-lg">Impactshaala</span>
        </div>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-4 lg:py-6">
        <div className="flex flex-col items-center gap-4 sm:gap-5 text-center w-full max-w-[420px]">
          {/* Illustration */}
          <div className="bg-[#fff8f0] rounded-full p-5 sm:p-6">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="#ff9400" strokeWidth="1.5"/>
              <path d="M2 7l10 7 10-7" stroke="#ff9400" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <h2 className="text-[#0f172a] text-lg sm:text-xl font-semibold tracking-[0.2px] leading-snug">
              Verification Email Sent
            </h2>
            <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed px-2">
              A verification email has been sent to your registered email
              address. Please verify to complete your registration.
            </p>
          </div>

          {/* Skip Now */}
          <button
            onClick={() => navigate(getRoleRoute())}
            className="w-full h-[42px] sm:h-[46px] bg-[#f77f00] text-white text-sm sm:text-base font-bold rounded-full hover:bg-[#e68500] transition-colors tracking-[0.2px] shadow-[0px_4px_16px_rgba(255,148,0,0.35)]"
          >
            Skip Now
          </button>

          {/* Resend */}
          <p className="text-sm -mt-2">
            <span className="text-[#0f172a]">Don't receive an email?</span>{" "}
            <button
              onClick={handleResend}
              disabled={resendStatus === "sending" || resendStatus === "sent"}
              className="text-[#f77f00] font-bold hover:underline transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resendStatus === "sending"
                ? "Sending…"
                : resendStatus === "sent"
                  ? "Sent!"
                  : "Resend"}
            </button>
          </p>

          {resendStatus === "error" && (
            <p className="text-red-500 text-xs -mt-4">
              Failed to resend. Please try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
