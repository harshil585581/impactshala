import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/images/logo/logo.png";

type Step = "email" | "code" | "new-password";

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ) : (
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

function SquareCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-6 h-6 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? "border-[#f77f00] bg-[#f77f00]" : "border-[#c7c7c7] bg-white"
      }`}
    >
      {checked && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path
            d="M1 5l3.5 3.5L11 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function OrangePillButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#ffeacc] text-[#f77f00] text-xl font-semibold rounded-full py-4 hover:bg-[#ffdcaa] transition-colors"
    >
      {label}
    </button>
  );
}

function PasswordInput({
  placeholder,
  value,
  onChange,
  show,
  onToggle,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#7d7d7d] rounded-[6px] px-5 py-4 text-base text-[#262626] placeholder-[#9d9d9d] focus:outline-none focus:border-[#f77f00] pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7c8493] hover:text-[#262626] transition-colors"
      >
        <EyeIcon visible={show} />
      </button>
    </div>
  );
}

// ─── Step 1: Email/phone input ──────────────────────────────────────────────

function EmailStep({ onNext, onBack }: { onNext: (email: string) => void; onBack: () => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[#18191c] text-4xl font-semibold">Forgot Password</h1>

      <div>
        <label className="block text-[#575555] text-base mb-2">Email or phone</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border border-[#7d7d7d] rounded-[6px] px-5 py-4 text-base text-[#262626] placeholder-[#9d9d9d] focus:outline-none focus:border-[#f77f00]"
        />
        <p className="mt-3 text-[#575555] text-sm leading-relaxed">
          We'll send a verification code to the email or phone number if it matches on existing Impactshaala account.
        </p>
      </div>

      <OrangePillButton label="Next" onClick={() => onNext(value)} />

      <button
        onClick={onBack}
        className="text-center text-[#575555] text-base font-medium hover:text-[#262626] transition-colors"
      >
        Back
      </button>
    </div>
  );
}

// ─── Step 2: 6-digit code ───────────────────────────────────────────────────

function CodeStep({ email, onSubmit }: { email: string; onSubmit: () => void }) {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[#18191c] text-4xl font-semibold mb-2">Enter the 6-digit code</h1>
        <p className="text-[#575555] text-sm">
          Check {email ? email.replace(/^(.{1})(.*)(@.*)$/, (_m, a, _b, c) => `${a}*****${c}`) : "your email"} for a verification code.
        </p>
      </div>

      <div>
        <label className="block text-[#575555] text-base mb-2">6-digit code</label>
        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full border border-[#7d7d7d] rounded-[6px] px-5 py-4 text-base text-[#262626] placeholder-[#9d9d9d] focus:outline-none focus:border-[#f77f00] tracking-widest"
          placeholder="______"
        />
        <button className="mt-2 text-[#f77f00] text-sm font-semibold hover:text-[#e06500] transition-colors">
          Resend Code
        </button>
      </div>

      <OrangePillButton label="Submit" onClick={onSubmit} />

      <p className="text-[#747373] text-sm leading-relaxed">
        If you don't see the email in your inbox, check your spam folder. If it's not there, the email address may not
        be confirmed, or it may not match an existing Impactshaala account.
      </p>
    </div>
  );
}

// ─── Step 3: Choose a new password ─────────────────────────────────────────

function NewPasswordStep({ onSave }: { onSave: () => void }) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [requireAllDevices, setRequireAllDevices] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[#18191c] text-4xl font-semibold mb-2">Choose a new password</h1>
        <p className="text-[#595959] text-sm">Create a new password that is at least 8 characters long.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[#575555] text-base mb-2">New password</label>
          <PasswordInput
            placeholder=""
            value={newPw}
            onChange={setNewPw}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />
        </div>
        <div>
          <label className="block text-[#575555] text-base mb-2">Retype new password</label>
          <PasswordInput
            placeholder=""
            value={confirmPw}
            onChange={setConfirmPw}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <SquareCheckbox
          checked={requireAllDevices}
          onChange={() => setRequireAllDevices((v) => !v)}
        />
        <span className="text-[#575555] text-sm">Require all devices to sign in with the new password</span>
      </label>

      <OrangePillButton label="Save" onClick={onSave} />
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function SettingsForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  function handleEmailNext(val: string) {
    setEmail(val);
    setStep("code");
  }

  function handleCodeSubmit() {
    setStep("new-password");
  }

  function handleSave() {
    navigate("/settings?section=accounts-privacy");
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b-2 border-[#dcdcdd] shrink-0">
        <div className="max-w-[1440px] mx-auto px-8 h-[89px] flex items-center">
          <img src={logoImg} alt="Impactshaala" className="h-9 w-auto object-contain" />
        </div>
      </header>

      {/* Centered card */}
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="bg-white border border-[#c2c2c2] rounded-[15px] w-full max-w-[860px] px-[72px] py-14">
          {step === "email" && (
            <EmailStep onNext={handleEmailNext} onBack={() => navigate(-1)} />
          )}
          {step === "code" && (
            <CodeStep email={email} onSubmit={handleCodeSubmit} />
          )}
          {step === "new-password" && (
            <NewPasswordStep onSave={handleSave} />
          )}
        </div>
      </main>
    </div>
  );
}
