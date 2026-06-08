import { useEffect, useRef, useState } from "react";
import { submitApplication } from "../../services/discoverService";

type Props = {
  postId: string;
  postTitle?: string;
  eligibilityCriteria?: string[];
  onClose: () => void;
};

/* ── Floating-label outlined input (Material Design 3) ── */
function OutlinedField({
  label, required, type = "text", placeholder, value, onChange, error,
}: {
  label: string; required?: boolean; type?: string;
  placeholder: string; value: string; onChange: (v: string) => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  const borderColor = error ? "#b3261e" : focused ? "#ff9400" : "#79747e";
  return (
    <div className="relative w-full">
      <label
        className="absolute left-3 transition-all duration-150 pointer-events-none z-10 bg-white px-1"
        style={{ top: lifted ? "-8px" : "16px", fontSize: lifted ? "12px" : "16px",
          color: error ? "#b3261e" : focused ? "#ff9400" : "#49454f", lineHeight: "16px" }}
      >
        {label}{required && <span style={{ color: "#b3261e", marginLeft: "1px" }}>*</span>}
      </label>
      <input
        type={type} value={value} placeholder={lifted ? placeholder : ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full h-[56px] px-4 rounded-lg bg-white text-[#18191c] text-base outline-none transition-colors placeholder:text-[#9e9e9e]"
        style={{ border: `1px solid ${borderColor}` }}
      />
      {error && <p className="text-[#b3261e] text-xs mt-1 pl-1">{error}</p>}
    </div>
  );
}

/* ── Orange checkbox ── */
function OrangeCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="w-6 h-6 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors"
      style={{ backgroundColor: checked ? "#ff9400" : "white", borderColor: checked ? "#ff9400" : "#c7c7c7" }}
    >
      {checked && (
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
          <path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

const DEFAULT_CRITERIA = [
  "Only for students from Science or Engineering background",
  'Minimum 60% in last qualifying exam" or "CGPA ≥ 6.5',
  "Applicant must be available full-time for the duration of the program",
];

/* ── Main component ── */
export default function ApplyModal({ postId, eligibilityCriteria, onClose }: Props) {
  const criteria = eligibilityCriteria?.length ? eligibilityCriteria : DEFAULT_CRITERIA;

  const [step, setStep] = useState<"form" | "eligibility" | "success">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(criteria.map(() => false));
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function validateForm() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitApplication({ postId, name, email, phone, documents: [] });
      setStep("success");
    } catch {
      setFormErrors({ submit: "Submission failed. Please try again." });
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  }

  const allChecked = checked.every(Boolean);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl overflow-hidden">

        {/* ══ SUCCESS ══ */}
        {step === "success" && (
          <div className="flex flex-col items-center px-10 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-[#18191c] font-bold text-xl mb-2">Application Submitted!</h3>
            <p className="text-[#49454f] text-sm mb-8 leading-relaxed">
              Your application has been received. We'll be in touch with next steps soon.
            </p>
            <button onClick={onClose} className="bg-[#ff9400] text-white font-semibold px-10 py-3 rounded-full hover:bg-[#e68500] transition-colors">
              Done
            </button>
          </div>
        )}

        {/* ══ STEP 1: Basic info ══ */}
        {step === "form" && (
          <>
            <div className="px-10 py-7 text-center border-b" style={{ background: "#fff4e5", borderColor: "#d78005" }}>
              <h2 className="text-[#49454f] font-normal leading-snug" style={{ fontSize: "30px", lineHeight: "33px" }}>
                Submit your application
              </h2>
            </div>
            <div className="px-10 py-8 flex flex-col gap-8">
              <div className="flex flex-col gap-8">
                <OutlinedField label="Name" required placeholder="Enter your name" value={name} onChange={setName} error={formErrors.name} />
                <OutlinedField label="Email" required type="email" placeholder="Enter your email" value={email} onChange={setEmail} error={formErrors.email} />
                <OutlinedField label="Mobile Number" type="tel" placeholder="Enter your Mobile Number" value={phone} onChange={setPhone} />
              </div>
              {formErrors.submit && <p className="text-[#b3261e] text-sm text-center">{formErrors.submit}</p>}
              <div className="flex gap-8">
                <button type="button" onClick={onClose}
                  className="flex-1 h-14 rounded-[5px] border text-[#ff9400] font-medium text-sm hover:bg-[#fff4e5] transition-colors"
                  style={{ borderColor: "#ff9400" }}>
                  Go Back
                </button>
                <button type="button" onClick={() => { if (validateForm()) setStep("eligibility"); }}
                  className="flex-1 h-14 rounded-[5px] bg-[#ff9400] text-white font-medium text-sm hover:bg-[#e68500] transition-colors">
                  Next
                </button>
              </div>
              <p className="text-[#79747e] text-sm text-center -mt-4">
                By submitting this form, you agree to our{" "}
                <a href="#" className="text-[#0088ff] hover:underline" onClick={(e) => e.preventDefault()}>Terms of Use and consent</a>.
              </p>
            </div>
          </>
        )}

        {/* ══ STEP 2: Eligibility checkboxes ══ */}
        {step === "eligibility" && (
          <div className="p-8 flex flex-col gap-8">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-semibold text-[#121212] text-xl leading-snug" style={{ fontFamily: "Manrope, sans-serif" }}>
                Select the checkboxes below to confirm that you meet the eligibility criteria before applying:
              </h2>
              <button onClick={onClose} className="shrink-0 w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-[#121212]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Criteria list */}
            <div className="flex flex-col gap-6">
              {criteria.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <p className="text-[#555] text-lg leading-6 flex-1">{item}</p>
                  <OrangeCheckbox checked={checked[i]} onChange={() => {
                    const next = [...checked];
                    next[i] = !next[i];
                    setChecked(next);
                  }} />
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep("form")}
                className="h-10 px-6 rounded-full border text-[#ff9400] font-medium text-sm hover:bg-[#fff4e5] transition-colors"
                style={{ borderColor: "#ff9400" }}>
                Back
              </button>
              <button onClick={handleSubmit} disabled={submitting || !allChecked}
                className="h-10 px-6 rounded-full bg-[#ff9400] text-white font-medium text-sm hover:bg-[#e68500] transition-colors disabled:opacity-50">
                {submitting ? "Submitting…" : "Next"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}