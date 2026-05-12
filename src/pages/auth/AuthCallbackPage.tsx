import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const primaryLogo =
  "https://www.figma.com/api/mcp/asset/8a750235-40b0-42cf-b263-a81e8356a5bb";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as "signup" | "email" | null;

    if (!tokenHash || !type) {
      setStatus("error");
      setErrorMsg("Invalid or expired verification link.");
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setErrorMsg(error.message);
        } else {
          setStatus("success");
          setTimeout(() => navigate("/home"), 2000);
        }
      });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex justify-center px-5 pt-8 pb-4">
        <img
          src={primaryLogo}
          alt="Impactshaala"
          className="h-9 w-auto object-contain"
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="flex flex-col items-center gap-6 text-center max-w-[380px]">
          {status === "verifying" && (
            <>
              <div className="w-14 h-14 border-4 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#64748b] text-sm">Verifying your email…</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="bg-[#fff8f0] rounded-full p-6">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#f77f00" />
                  <path
                    d="M7 12l4 4 6-7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-[#0f172a] text-xl font-semibold">
                Email Verified!
              </h2>
              <p className="text-[#64748b] text-sm">
                Redirecting you to the app…
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="bg-red-50 rounded-full p-6">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#ef4444" />
                  <path
                    d="M8 8l8 8M16 8l-8 8"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h2 className="text-[#0f172a] text-xl font-semibold">
                Verification Failed
              </h2>
              <p className="text-[#64748b] text-sm">{errorMsg}</p>
              <button
                onClick={() => navigate("/signup/verify")}
                className="w-full h-[50px] bg-[#f77f00] text-white text-sm font-bold rounded-full hover:bg-[#e68500] transition-colors"
              >
                Back to Verification
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
