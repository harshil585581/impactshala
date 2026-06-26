import { useEffect, useRef, useState } from "react";
import { submitApplication } from "../../services/discoverService";
import { fetchMyProfile } from "../../services/accountService";

type Props = {
  postId: string;
  postTitle?: string;
  eligibilityCriteria?: string[];
  documentsRequired?: string[];
  onClose: () => void;
  onSuccess?: (postId: string) => void;
};

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

function PaperclipIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export default function ApplyModal({ postId, eligibilityCriteria, documentsRequired, onClose, onSuccess }: Props) {
  const criteria = eligibilityCriteria?.length ? eligibilityCriteria : [];
  const docLabels = documentsRequired?.length ? documentsRequired : [];

  // Skip the form step — start directly at eligibility
  const [step, setStep] = useState<"eligibility" | "documents" | "success">("eligibility");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [checked, setChecked] = useState<boolean[]>(criteria.map(() => false));
  const [docFiles, setDocFiles] = useState<(File | null)[]>(docLabels.map(() => null));
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-fill name and email from the logged-in user's profile
  useEffect(() => {
    fetchMyProfile()
      .then((profile) => {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
        setName(fullName || "");
        setEmail(profile.email || "");
        // phone is not stored in profile; leave blank
      })
      .catch(() => {
        // fallback: try localStorage
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          if (stored.email) setEmail(stored.email);
        } catch {}
      })
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleFileChange(i: number, file: File | null) {
    setDocFiles((prev) => {
      const next = [...prev];
      next[i] = file;
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const files: File[] = [];
      const labels: string[] = [];
      docFiles.forEach((f, i) => {
        if (f) { files.push(f); labels.push(docLabels[i] ?? f.name); }
      });
      await submitApplication({ postId, name, email, phone, message, documents: files, documentLabels: labels });
      onSuccess?.(postId);
      setStep("success");
    } catch {
      setSubmitError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function goToNextAfterEligibility() {
    if (docLabels.length > 0) {
      setStep("documents");
    } else {
      handleSubmit();
    }
  }

  const allChecked = criteria.length === 0 || checked.every(Boolean);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

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

        {/* ══ STEP 1 (now first): Eligibility checkboxes ══ */}
        {step === "eligibility" && (
          <div className="p-8 flex flex-col gap-8 overflow-y-auto">
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

            {profileLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#79747e]">
                <div className="w-4 h-4 border-2 border-[#ff9400] border-t-transparent rounded-full animate-spin" />
                Loading your profile…
              </div>
            ) : null}

            {criteria.length === 0 ? (
              <p className="text-[#555] text-base">No specific eligibility criteria for this posting.</p>
            ) : (
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
            )}

            {submitError && <p className="text-[#b3261e] text-sm text-center">{submitError}</p>}

            <div className="flex items-center justify-between pt-2">
              {/* Back closes the modal — no form step to return to */}
              <button
                onClick={onClose}
                className="h-10 px-6 rounded-full border text-[#ff9400] font-medium text-sm hover:bg-[#fff4e5] transition-colors"
                style={{ borderColor: "#ff9400" }}
              >
                Back
              </button>
              <button
                onClick={goToNextAfterEligibility}
                disabled={!allChecked || submitting || profileLoading}
                className="h-10 px-6 rounded-full bg-[#ff9400] text-white font-medium text-sm hover:bg-[#e68500] transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Next"}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Document uploads ══ */}
        {step === "documents" && (
          <div className="p-8 flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-semibold text-[#121212] text-xl leading-snug" style={{ fontFamily: "Manrope, sans-serif" }}>
                Upload the documents listed below to complete your application. Ensure that all files are clear and legible.
              </h2>
              <button onClick={onClose} className="shrink-0 w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-[#121212]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {docLabels.map((label, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                  <p className="text-[#555] text-base leading-6 flex-1">
                    {label}
                    {docFiles[i] && (
                      <span className="ml-2 text-xs text-[#ff9400] font-medium">{docFiles[i]!.name}</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileRefs.current[i]?.click()}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <PaperclipIcon />
                  </button>
                  <input
                    ref={(el) => { fileRefs.current[i] = el; }}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(i, e.target.files?.[0] ?? null)}
                  />
                </div>
              ))}
            </div>

            {/* Message field */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[#121212] text-base">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a short note if you want to share anything before applying"
                maxLength={500}
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#18191c] focus:outline-none focus:border-[#ff9400] resize-none"
              />
              <p className="text-right text-xs text-[#79747e]">{message.length}/500 characters</p>
            </div>

            {submitError && <p className="text-[#b3261e] text-sm text-center">{submitError}</p>}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep("eligibility")}
                className="h-10 px-6 rounded-full border text-[#ff9400] font-medium text-sm hover:bg-[#fff4e5] transition-colors"
                style={{ borderColor: "#ff9400" }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="h-10 px-6 rounded-full bg-[#ff9400] text-white font-medium text-sm hover:bg-[#e68500] transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
