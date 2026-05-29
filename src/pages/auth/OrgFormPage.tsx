import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logoImg from "../../assets/images/logo/logo.png";
import signupBg from "../../assets/images/loginsignup/l1.png";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const inputCls =
  "w-full h-[50px] border border-[#e5e7eb] rounded-full px-4 text-[#1e1e1e] text-[16px] placeholder-[#adaebc] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors bg-white";

const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="17" rx="2" stroke="#adaebc" strokeWidth="1.5" fill="none" />
    <path d="M3 9h18" stroke="#adaebc" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 2v4M16 2v4" stroke="#adaebc" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#adaebc" />
    <rect x="11" y="13" width="3" height="3" rx="0.5" fill="#adaebc" />
    <rect x="7" y="17" width="3" height="2" rx="0.5" fill="#adaebc" />
  </svg>
);

export default function OrgFormPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orgType = params.get("orgType") ?? "";

  const [form, setForm] = useState({
    orgName: "",
    yearOfFounding: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!form.agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/signup/organization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: form.orgName,
          org_type: orgType,
          year_of_founding: form.yearOfFounding,
          email: form.email,
          password: form.password,
          agreed_terms: form.agreeTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Signup failed");
      localStorage.setItem("pending_signup_user_type", "organization");
      localStorage.setItem("pending_signup_role", "");
      navigate("/signup/verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ── Left panel ── */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        {/* Logo */}
        <div className="px-8 sm:px-10 py-6 shrink-0">
          <img src={logoImg} alt="Impactshaala" className="h-9 w-auto object-contain" />
        </div>

        {/* Form centred in remaining space */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-8">
          <div className="w-full max-w-[576px]">
            {/* Card */}
            <div className="bg-white rounded-[23px] shadow-[0px_4px_3px_rgba(0,0,0,0.07),0px_10px_20px_rgba(0,0,0,0.10)] px-8 sm:px-[36px] py-8 sm:py-[32px]">

              {/* Header */}
              <div className="text-center mb-[32px]">
                <h2 className="text-[#003049] text-[30px] font-semibold leading-[1.25] mb-1">
                  Create Account
                </h2>
                <p className="text-[#4b5563] text-[16px]">Join our community today</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-[15px]">

                {/* Organisation Name */}
                <div>
                  <label className="block text-[#374151] text-[14px] mb-[8px]">
                    Organisation Name
                  </label>
                  <input
                    type="text"
                    placeholder="Organisation name"
                    value={form.orgName}
                    onChange={(e) => update("orgName", e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>

                {/* Year of Founding */}
                <div>
                  <label className="block text-[#374151] text-[14px] mb-[8px]">
                    Year of Founding
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Enter the year"
                      value={form.yearOfFounding}
                      onChange={(e) => update("yearOfFounding", e.target.value)}
                      min={1800}
                      max={new Date().getFullYear()}
                      className={`${inputCls} pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <CalendarIcon />
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[#374151] text-[14px] mb-[8px]">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[#374151] text-[14px] mb-[8px]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      required
                      className={`${inputCls} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adaebc] hover:text-[#6b7280] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[#374151] text-[14px] mb-[8px]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      required
                      className={`${inputCls} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adaebc] hover:text-[#6b7280] transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms checkbox */}
                <label className="flex items-center gap-3 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) => update("agreeTerms", e.target.checked)}
                    className="w-[16px] h-[16px] border border-black rounded-[1px] accent-[#f77f00] cursor-pointer shrink-0"
                  />
                  <span className="text-[#4b5563] text-[14px]">
                    I agree to the{" "}
                    <span className="text-[#f77f00] hover:underline cursor-pointer">Terms of Service</span>
                    {" "}and{" "}
                    <span className="text-[#f77f00] hover:underline cursor-pointer">Privacy Policy</span>
                  </span>
                </label>

                {/* Error */}
                {error && (
                  <p className="text-red-500 text-sm text-center -mb-1">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[48px] bg-[#ff9400] text-white text-[16px] font-semibold rounded-full hover:bg-[#e68500] transition-colors mt-[17px] shadow-[0px_4px_12px_rgba(255,148,0,0.30)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account…" : "Create Account"}
                </button>

                {/* Login link */}
                <p className="text-center text-[16px] text-[#4b5563] mt-1">
                  Already have an account?{" "}
                  <Link to="/" className="text-[#ff9400] hover:underline">
                    Login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — photo + orange overlay + quote ── */}
      <div className="hidden lg:flex relative lg:w-[45%] xl:w-[46%] shrink-0 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${signupBg})` }}>
        {/* Orange overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(255, 148, 0, 0.50)' }} />
        {/* Quote */}
        <div className="relative z-10 flex items-center justify-center w-full px-16">
          <div>
            <span className="text-white text-[96px] font-bold leading-none block -mb-6">"</span>
            <p className="text-[#e5e7eb] text-[48px] font-semibold leading-[1.5]">
              Inspiring Education,{" "}
              <span className="text-white">Aspiring Opportunities!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
