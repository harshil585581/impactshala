import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const primaryLogo =
  "https://www.figma.com/api/mcp/asset/8a750235-40b0-42cf-b263-a81e8356a5bb";
const emailIllustration =
  "https://www.figma.com/api/mcp/asset/c6880028-f78c-41b8-b8bb-c0cbf3b1f908";

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
      <div className="flex justify-center px-5 pt-8 sm:pt-10 pb-4 shrink-0">
        <img
          src={primaryLogo}
          alt="Impactshaala"
          className="h-9 sm:h-10 w-auto object-contain"
        />
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8 sm:py-12">
        <div className="flex flex-col items-center gap-6 sm:gap-8 text-center w-full max-w-[420px]">
          {/* Illustration */}
          <div className="bg-[#fff8f0] rounded-full p-6 sm:p-8">
            <img
              src={emailIllustration}
              alt="Email sent"
              className="w-24 h-auto sm:w-[120px]"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <h2 className="text-[#0f172a] text-xl sm:text-2xl font-semibold tracking-[0.2px] leading-snug">
              Verification Email Sent
            </h2>
            <p className="text-[#64748b] text-sm leading-relaxed px-2">
              A verification email has been sent to your registered email
              address. Please verify to complete your registration.
            </p>
          </div>

          {/* Skip Now */}
          <button
            onClick={() => navigate(getRoleRoute())}
            className="w-full h-[50px] sm:h-[56px] bg-[#f77f00] text-white text-sm sm:text-base font-bold rounded-full hover:bg-[#e68500] transition-colors tracking-[0.2px] shadow-[0px_4px_16px_rgba(255,148,0,0.35)]"
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
