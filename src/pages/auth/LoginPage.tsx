import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";


const inputCls =
  "w-full h-[40px] sm:h-[44px] border border-[#e5e7eb] rounded-full px-4 text-[#1e1e1e] text-sm placeholder-[#7e8793] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors bg-white";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
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

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Login failed");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...data.user,
          access_token: data.access_token,
        }),
      );
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* ── Left / main panel ── */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Mobile / Tablet top banner */}
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

        {/* Desktop logo */}
        <div className="hidden lg:flex items-center gap-2 px-8 xl:px-10 py-5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#ff9400] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/></svg>
          </div>
          <span className="text-[#18191c] font-bold text-xl">Impactshaala</span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 lg:py-2">
          <div className="w-full max-w-[576px]">
            <div className="bg-white rounded-[12px] shadow-[0px_4px_3px_rgba(0,0,0,0.07),0px_10px_20px_rgba(0,0,0,0.1)] px-6 sm:px-8 py-5 sm:py-6">
              {/* Card heading */}
              <div className="text-center mb-4 sm:mb-5">
                <h2 className="text-[#18191c] text-xl sm:text-2xl font-semibold leading-tight">
                  Welcome Back!
                </h2>
                <p className="text-[#5e6670] text-xs sm:text-sm mt-0.5">
                  Please login to your account
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-2.5 sm:gap-3.5"
              >
                {/* Email */}
                <div>
                  <label className="block text-[#1e1e1e] text-xs font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[#1e1e1e] text-xs font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      className={`${inputCls} pr-12`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adaebc] hover:text-[#5e6670] transition-colors"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </div>

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={(e) => update("remember", e.target.checked)}
                      className="w-4 h-4 border border-gray-400 rounded-sm accent-[#f77f00] cursor-pointer shrink-0"
                    />
                    <span className="text-[#1e1e1e] text-sm">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[#f77f00] text-sm hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-red-500 text-sm text-center -mb-1">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[40px] sm:h-[44px] bg-[#f77f00] text-white text-sm sm:text-base font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.35)] mt-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in…" : "Login"}
                </button>

                <p className="text-center text-sm sm:text-base text-[#1e1e1e]">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-[#f77f00] font-semibold hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>
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
