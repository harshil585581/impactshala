import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const bgPhoto = "https://www.figma.com/api/mcp/asset/ff7c19f8-999c-4f34-8e4b-6cea4269938c";
const whiteLogo = "https://www.figma.com/api/mcp/asset/d6e5d9b3-489f-4758-9655-08263b2209f7";
const primaryLogo = "https://www.figma.com/api/mcp/asset/74afddfa-47ae-4e56-bb54-0ef8d74734aa";

const inputCls =
  'w-full h-[48px] sm:h-[50px] border border-[#e5e7eb] rounded-full px-4 text-[#1e1e1e] text-sm placeholder-[#adaebc] focus:outline-none focus:border-[#ff9400] focus:ring-1 focus:ring-[#ff9400] transition-colors bg-white';

export default function OrgFormPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orgType = params.get('orgType') ?? '';

  const [form, setForm] = useState({
    orgName: '',
    website: '',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/signup/organization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: form.orgName,
          org_type: orgType,
          website: form.website,
          contact_name: form.contactName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          agreed_terms: form.agreeTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? 'Signup failed');
      localStorage.setItem('pending_signup_user_type', 'organization');
      localStorage.setItem('pending_signup_role', '');
      navigate('/signup/verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">

      {/* ── Main form panel (left on desktop) ── */}
      <div className="flex-1 bg-white flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 lg:px-10 py-4 sm:py-5 shrink-0">
          <img src={primaryLogo} alt="Impactshaala" className="h-8 sm:h-10 w-auto object-contain" />
          <Link
            to="/signup/org/select"
            className="flex items-center gap-1 text-[#8692a6] font-semibold text-sm sm:text-base hover:text-[#ff9400] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 pb-10">
          <div className="w-full max-w-[576px]">

            <div className="bg-white sm:rounded-[23px] sm:shadow-[0px_4px_3px_rgba(0,0,0,0.07),0px_10px_20px_rgba(0,0,0,0.08)] px-0 sm:px-6 md:px-8 py-0 sm:py-8">

              <div className="text-center mb-5 sm:mb-6">
                <h2 className="text-[#003049] text-2xl sm:text-3xl font-semibold leading-snug">
                  Organization Details
                </h2>
                <p className="text-[#4b5563] text-sm sm:text-base mt-1">Tell us about your organization</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Organization Name */}
                <div>
                  <label className="block text-[#374151] text-sm font-medium mb-1.5">Organization Name</label>
                  <input
                    type="text"
                    placeholder="Enter organization name"
                    value={form.orgName}
                    onChange={(e) => update('orgName', e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-[#374151] text-sm font-medium mb-1.5">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://yourorganization.com"
                    value={form.website}
                    onChange={(e) => update('website', e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Contact person + phone — side by side on sm+ */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-[#374151] text-sm font-medium mb-1.5">Contact Person</label>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={form.contactName}
                      onChange={(e) => update('contactName', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[#374151] text-sm font-medium mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[#374151] text-sm font-medium mb-1.5">Official Email</label>
                  <input
                    type="email"
                    placeholder="Enter official email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Password + Confirm — side by side on md+ */}
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-[#374151] text-sm font-medium mb-1.5">Password</label>
                    <input
                      type="password"
                      placeholder="Create password"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[#374151] text-sm font-medium mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start sm:items-center gap-3 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) => update('agreeTerms', e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 border border-gray-400 rounded-sm accent-[#ff9400] cursor-pointer shrink-0"
                  />
                  <span className="text-[#4b5563] text-xs sm:text-sm leading-relaxed">
                    I agree to the{' '}
                    <span className="text-[#ff9400] hover:underline cursor-pointer">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-[#ff9400] hover:underline cursor-pointer">Privacy Policy</span>
                  </span>
                </label>

                {/* Error message */}
                {error && (
                  <p className="text-red-500 text-sm text-center -mb-1">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[48px] sm:h-[52px] bg-[#ff9400] text-white text-sm sm:text-base font-semibold rounded-full hover:bg-[#e68500] transition-colors mt-1 shadow-[0px_4px_12px_rgba(255,148,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account…' : 'Create Account'}
                </button>

                <p className="text-center text-sm sm:text-base text-[#4b5563] mt-1">
                  Already have an account?{' '}
                  <Link to="/" className="text-[#ff9400] font-semibold hover:underline">
                    Login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right orange photo panel (desktop only) ── */}
      <div className="hidden lg:flex relative lg:w-[45%] xl:w-5/12 shrink-0 overflow-hidden flex-col">
        <img src={bgPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[rgba(255,148,0,0.5)]" />
        <div className="relative z-10 flex flex-col h-full px-10 py-8">
          <img src={whiteLogo} alt="Impactshaala" className="h-11 w-auto object-contain self-start" />
          <div className="flex-1 flex items-center">
            <div>
              <span className="text-white text-8xl font-bold leading-none">"</span>
              <h2 className="text-[#e5e7eb] text-3xl xl:text-4xl font-semibold leading-[1.5] -mt-4">
                Inspiring Education,<br />Aspiring Opportunities!
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
