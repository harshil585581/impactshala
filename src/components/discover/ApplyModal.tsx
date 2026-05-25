import { useState, useRef } from "react";
import { submitApplication } from "../../services/discoverService";

type Props = {
  postId: string;
  onClose: () => void;
};

const REQUIRED_DOCS = [
  "Resume / CV",
  "Portfolio (if applicable)",
  "Cover Letter",
  "ID Proof",
];

export default function ApplyModal({ postId, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Step 2 confirmations
  const [confirmed, setConfirmed] = useState<boolean[]>(
    REQUIRED_DOCS.map(() => false)
  );

  // Step 3/4 files
  const [files, setFiles] = useState<(File | null)[]>(
    REQUIRED_DOCS.map(() => null)
  );
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await submitApplication({
        postId,
        name,
        email,
        phone,
        documents: files.filter(Boolean) as File[],
      });
      setStep(5); // success
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={step < 5 ? onClose : undefined}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
        {/* Close */}
        {step !== 5 && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-border-light rounded-full min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <div className="p-6">
          {/* Step indicator */}
          {step < 5 && (
            <div className="flex gap-1 mb-5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    s <= step ? "bg-primary" : "bg-border-default"
                  }`}
                />
              ))}
            </div>
          )}

          {/* STEP 1: Basic info */}
          {step === 1 && (
            <>
              <h2 className="font-bold text-text-dark text-lg mb-1">
                Submit your application
              </h2>
              <p className="text-text-muted text-sm mb-5">
                Fill in your details to apply for this opportunity.
              </p>
              <div className="flex flex-col gap-3">
                <Field label="Enter your name" value={name} onChange={setName} required />
                <Field label="Enter your email" type="email" value={email} onChange={setEmail} required />
                <Field label="Enter your contact number" type="tel" value={phone} onChange={setPhone} required />
              </div>
              <label className="flex items-start gap-2 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-xs text-text-medium leading-relaxed">
                  Before you apply, please make sure that you must diligently review and adhere to applying.{" "}
                  <a href="#" className="text-primary underline">
                    Terms & Conditions
                  </a>
                </span>
              </label>
              <button
                onClick={() => {
                  if (!name || !email || !phone || !agreed) return;
                  setStep(2);
                }}
                disabled={!name || !email || !phone || !agreed}
                className="mt-5 w-full bg-primary text-white font-semibold py-2.5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                Submit
              </button>
            </>
          )}

          {/* STEP 2: Documents checklist */}
          {step === 2 && (
            <>
              <h2 className="font-bold text-text-dark text-lg mb-1">
                Required Documents
              </h2>
              <p className="text-text-muted text-sm mb-5">
                Please confirm you have the following documents ready.
              </p>
              <div className="flex flex-col gap-3">
                {REQUIRED_DOCS.map((doc, i) => (
                  <label key={doc} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed[i]}
                      onChange={(e) => {
                        const next = [...confirmed];
                        next[i] = e.target.checked;
                        setConfirmed(next);
                      }}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-text-medium">{doc}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={!confirmed.every(Boolean)}
                className="mt-5 w-full bg-primary text-white font-semibold py-2.5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                Continue
              </button>
            </>
          )}

          {/* STEP 3: Upload documents */}
          {step === 3 && (
            <>
              <h2 className="font-bold text-text-dark text-lg mb-1">
                Upload Documents
              </h2>
              <p className="text-text-muted text-sm mb-5">
                Upload each required document below.
              </p>
              <div className="flex flex-col gap-4">
                {REQUIRED_DOCS.map((doc, i) => (
                  <div key={doc}>
                    <p className="text-sm font-medium text-text-medium mb-1">{doc}</p>
                    <div
                      onClick={() => fileRefs.current[i]?.click()}
                      className="border-2 border-dashed border-border-default rounded-xl p-3 cursor-pointer hover:border-primary transition-colors text-center"
                    >
                      {files[i] ? (
                        <span className="text-sm text-text-dark">{files[i]!.name}</span>
                      ) : (
                        <span className="text-sm text-text-muted">Click to upload</span>
                      )}
                    </div>
                    <input
                      ref={(el) => { fileRefs.current[i] = el; }}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const next = [...files];
                        next[i] = e.target.files?.[0] ?? null;
                        setFiles(next);
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(4)}
                className="mt-5 w-full bg-primary text-white font-semibold py-2.5 rounded-full hover:bg-orange-600 transition-colors min-h-[44px]"
              >
                Review & Submit
              </button>
            </>
          )}

          {/* STEP 4: Confirm & submit */}
          {step === 4 && (
            <>
              <h2 className="font-bold text-text-dark text-lg mb-1">
                Confirm Application
              </h2>
              <p className="text-text-muted text-sm mb-5">
                Review your details before submitting.
              </p>
              <div className="bg-border-light rounded-xl p-4 text-sm text-text-medium space-y-2">
                <p><span className="font-semibold">Name:</span> {name}</p>
                <p><span className="font-semibold">Email:</span> {email}</p>
                <p><span className="font-semibold">Phone:</span> {phone}</p>
                <p>
                  <span className="font-semibold">Documents:</span>{" "}
                  {files.filter(Boolean).length} / {REQUIRED_DOCS.length} uploaded
                </p>
              </div>
              {error && (
                <p className="mt-3 text-red-500 text-sm">{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-5 w-full bg-primary text-white font-semibold py-2.5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            </>
          )}

          {/* STEP 5: Success */}
          {step === 5 && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="font-bold text-text-dark text-xl mb-2">
                Application Submitted!
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Your application has been successfully submitted. We'll notify you of the next steps.
              </p>
              <button
                onClick={onClose}
                className="bg-primary text-white font-semibold px-8 py-2.5 rounded-full hover:bg-orange-600 transition-colors min-h-[44px]"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={label}
        className="w-full border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-dark placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}
