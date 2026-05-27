import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const CATEGORIES = [
  "Job Ready Exposure",
  "Education",
  "Social Impact",
  "Startup & Grants",
  "Talent & Sports",
  "Meetups & Competitions",
  "School Admissions",
  "College Admissions",
  "Professional Upskilling",
  "Early Career Jobs (0-3 years)",
  "Senior Career Jobs (5+ years)",
  "Mid Career Jobs (3-5 years)",
];

const URGENCY_OPTIONS = ["Low", "Medium", "High"];

type ContactMethod = "email" | "phone";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GetInTouchModal({ isOpen, onClose }: Props) {
  const [category, setCategory]           = useState("Job Ready Exposure");
  const [urgency, setUrgency]             = useState("");
  const [urgencyOpen, setUrgencyOpen]     = useState(false);
  const [timeline, setTimeline]           = useState("");
  const [requirements, setRequirements]   = useState("");
  const [budget, setBudget]               = useState("");
  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [phone, setPhone]                 = useState("");
  const [bestTime, setBestTime]           = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");

  const editorRef   = useRef<HTMLDivElement>(null);
  const urgencyRef  = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close urgency dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (urgencyRef.current && !urgencyRef.current.contains(e.target as Node)) {
        setUrgencyOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!isOpen) return null;

  function applyFormat(cmd: string) {
    document.execCommand(cmd, false);
    editorRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send to backend
    onClose();
  }

  const modal = (
    /* Backdrop — renders directly in document.body via portal */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/50"
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative bg-white rounded-2xl w-full max-w-[640px] max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f2f3] transition-colors text-[#18191c]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="px-5 sm:px-7 pt-6 pb-8 space-y-6">
          {/* Title */}
          <div className="pr-8">
            <h2 className="text-[#18191c] text-2xl font-bold">Get in Touch</h2>
            <p className="text-[#9199a3] text-sm mt-1 leading-relaxed">
              Tell us about your requirements and we'll get back to you promptly
            </p>
          </div>

          {/* Category */}
          <div>
            <p className="text-[#18191c] text-sm font-bold mb-3">Category</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="flex items-start gap-2 cursor-pointer"
                >
                  <span
                    className={`mt-0.5 w-[18px] h-[18px] shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                      category === cat
                        ? "border-[#f77f00] bg-[#f77f00]"
                        : "border-[#d1d5db] hover:border-[#f77f00]"
                    }`}
                  >
                    {category === cat && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span className="text-[#18191c] text-[13px] leading-snug">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Urgency + Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Urgency custom dropdown */}
            <div>
              <p className="text-[#18191c] text-sm font-bold mb-2">Urgency Level</p>
              <div ref={urgencyRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUrgencyOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:border-[#f77f00] transition-colors bg-white"
                >
                  <span className={urgency ? "text-[#18191c]" : "text-[#9199a3]"}>
                    {urgency || "Urgency type"}
                  </span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    className={`shrink-0 transition-transform duration-200 ${urgencyOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="#9199a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {urgencyOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl border border-[#e5e7eb] shadow-lg z-10 overflow-hidden">
                    {URGENCY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setUrgency(opt); setUrgencyOpen(false); }}
                        className={`w-full text-left px-4 py-3.5 text-sm transition-colors border-b border-[#f2f2f3] last:border-0 flex items-center ${
                          urgency === opt
                            ? "text-[#f77f00] font-medium border-l-[3px] border-l-[#f77f00] pl-[13px]"
                            : "text-[#6b7280] hover:bg-[#fafafa]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-[#18191c] text-sm font-bold mb-2">Timeline</p>
              <input
                type="date"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full px-4 py-3 border border-[#e5e7eb] rounded-xl text-sm text-[#18191c] focus:outline-none focus:border-[#f77f00] transition-colors"
              />
            </div>
          </div>

          {/* Requirement details */}
          <div>
            <p className="text-[#18191c] text-sm font-bold mb-2">Requirement details</p>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Describe your requirements in detail.."
              rows={3}
              className="w-full px-0 py-2 border-0 border-b border-[#e5e7eb] text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#f77f00] resize-none transition-colors"
            />
          </div>

          {/* Budget Range */}
          <div>
            <p className="text-[#18191c] text-sm font-bold mb-2">Budget Range</p>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Enter your budget range"
              className="w-full px-0 py-2 border-0 border-b border-[#e5e7eb] text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#f77f00] transition-colors"
            />
          </div>

          {/* Contact Information */}
          <div>
            <p className="text-[#18191c] text-sm font-bold mb-3">Contact Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[#474d57] text-xs font-medium">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="px-4 py-3 border border-[#e5e7eb] rounded-xl text-sm text-[#18191c] focus:outline-none focus:border-[#f77f00] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#474d57] text-xs font-medium">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="px-4 py-3 border border-[#e5e7eb] rounded-xl text-sm text-[#18191c] focus:outline-none focus:border-[#f77f00] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#474d57] text-xs font-medium">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-4 py-3 border border-[#e5e7eb] rounded-xl text-sm text-[#18191c] focus:outline-none focus:border-[#f77f00] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#474d57] text-xs font-medium">Best time to reach you</label>
                <input
                  type="text"
                  value={bestTime}
                  onChange={(e) => setBestTime(e.target.value)}
                  placeholder="e.g. 10am – 12pm"
                  className="px-4 py-3 border border-[#e5e7eb] rounded-xl text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#f77f00] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Preferred Contact Method */}
          <div>
            <p className="text-[#18191c] text-sm font-bold mb-3">Preferred Contact Method</p>
            <div className="flex items-center gap-8">
              {(["email", "phone"] as ContactMethod[]).map((method) => (
                <label
                  key={method}
                  onClick={() => setContactMethod(method)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span
                    className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${
                      contactMethod === method
                        ? "border-[#f77f00] bg-[#f77f00]"
                        : "border-[#d1d5db] hover:border-[#f77f00]"
                    }`}
                  >
                    {contactMethod === method && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span className="text-[#18191c] text-sm">
                    {method === "email" ? "Email" : "Phone Call"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Rich text editor */}
          <div>
            <p className="text-[#18191c] text-sm font-bold mb-3">
              Add any additional relevant details to complete your post.
            </p>
            <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-[#e5e7eb] bg-[#fafafa]">
                {[
                  { cmd: "bold",               icon: <strong className="text-xs">B</strong> },
                  { cmd: "italic",             icon: <em className="text-xs not-italic font-bold" style={{fontStyle:"italic"}}>I</em> },
                  { cmd: "underline",          icon: <u className="text-xs font-bold">U</u> },
                  { cmd: "insertUnorderedList", icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
                      <circle cx="4" cy="6" r="1.2" fill="currentColor"/><circle cx="4" cy="12" r="1.2" fill="currentColor"/><circle cx="4" cy="18" r="1.2" fill="currentColor"/>
                    </svg>
                  )},
                  { cmd: "insertOrderedList",  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
                      <path d="M4 6h1v4M4 10h2" strokeLinejoin="round"/>
                    </svg>
                  )},
                ].map(({ cmd, icon }) => (
                  <button
                    key={cmd}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyFormat(cmd); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#f2f2f3] text-[#474d57] transition-colors"
                  >
                    {icon}
                  </button>
                ))}
              </div>
              {/* Editable area */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[100px] px-4 py-3 text-sm text-[#474d57] focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#f77f00] hover:bg-[#e68500] text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
          >
            Submit
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
