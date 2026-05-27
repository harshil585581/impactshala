import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomSelect from "../../components/ui/CustomSelect";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import DiscoverSidePanel from "../../components/discover/DiscoverSidePanel";
import type { SeekerFormStep1 } from "./CreateSeekerPage";

const PROFESSIONAL_LEVELS = [
  "Student",
  "Recent Graduate",
  "Early Career (0-2 yrs)",
  "Mid Career (3-7 yrs)",
  "Senior (8+ yrs)",
  "Executive",
];

export default function CreateSeekerDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const step1 = (location.state as { step1?: SeekerFormStep1 })?.step1;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [professionalLevel, setProfessionalLevel] = useState("");
  const [address, setAddress] = useState("");
  const [canPay, setCanPay] = useState<boolean | null>(null);
  const [budget, setBudget] = useState("");
  const [preferences, setPreferences] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [visibleTo, setVisibleTo] = useState("Public");

  function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCoverPreview(URL.createObjectURL(file));
  }

  function handleNext() {
    navigate("/discover/create/seeker/preview", {
      state: {
        step1,
        step2: {
          title,
          professionalLevel,
          address,
          canPay,
          budget,
          preferences,
          preferredDate,
          coverPreview,
          description,
          visibleTo,
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">

          {/* ── Form ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-border-default p-6">
            <p className="text-primary font-bold text-sm mb-5">Post details</p>

            {/* Post title */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-medium mb-1">
                Post title — I am looking for…
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. I am looking for ACMs Course"
                className="w-full border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
              />
            </div>

            {/* Professional level + Address */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-text-medium mb-1">
                  Choose professional level
                </label>
                <CustomSelect
                  value={professionalLevel}
                  onChange={setProfessionalLevel}
                  options={PROFESSIONAL_LEVELS.map((l) => ({ label: l, value: l }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-medium mb-1">
                  Address (if applicable)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Bangalore"
                  className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Can pay? */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-text-medium mb-2">
                Are you able to pay for the opportunity/service?
              </p>
              <div className="flex gap-3">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => setCanPay(v)}
                    className={`px-6 py-2 rounded-full border text-sm font-semibold transition-colors min-h-[44px] ${
                      canPay === v
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-text-medium border-border-default hover:border-primary"
                    }`}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            {canPay && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-medium mb-1">
                  Enter your budget
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. ₹5,000"
                  className="w-full border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Provider preferences */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-medium mb-1">
                Do you have any specific preferences for the provider of this opportunity/service?
              </label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Describe preferences..."
                rows={3}
                className="w-full border border-border-default rounded-xl px-4 py-2 text-sm text-text-dark focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Document upload */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-medium mb-1">
                Document to be shared by applicant
              </label>
              <div className="flex items-center gap-3">
                <div
                  onClick={() => docInputRef.current?.click()}
                  className="flex-1 border border-dashed border-border-default rounded-xl p-3 cursor-pointer hover:border-primary transition-colors text-center"
                >
                  <span className="text-sm text-text-muted">
                    {docFile ? docFile.name : "Click to upload"}
                  </span>
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                />
                <button
                  onClick={() => docInputRef.current?.click()}
                  className="px-4 py-2 border border-primary text-primary text-sm font-medium rounded-full hover:bg-primary-light transition-colors min-h-[44px]"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Preferred contact date */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-medium mb-1">
                Is there a preferred date you would like to be contacted at?
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
              />
            </div>

            {/* Cover image */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-medium mb-1">
                Upload thumbnail/cover image
              </label>
              <div
                onClick={() => coverInputRef.current?.click()}
                className="border-2 border-dashed border-border-default rounded-xl p-6 cursor-pointer hover:border-primary transition-colors text-center"
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover"
                    className="w-full h-[150px] object-cover rounded-lg"
                  />
                ) : (
                  <p className="text-sm text-text-muted">Browse and select a file to upload</p>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCover}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-medium mb-1">
                Add any additional relevant details to complete your post
              </label>
              <div className="border border-border-default rounded-xl overflow-hidden">
                <div className="flex gap-2 px-3 py-2 border-b border-border-light text-text-muted text-sm">
                  <button className="font-bold hover:text-text-dark">B</button>
                  <button className="italic hover:text-text-dark">I</button>
                  <button className="underline hover:text-text-dark">U</button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write detailed description here..."
                  rows={5}
                  className="w-full px-4 py-3 text-sm text-text-dark focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 border border-border-default rounded-full text-sm font-semibold text-text-medium hover:border-primary transition-colors min-h-[44px]"
              >
                Save
              </button>
              <div className="flex items-center gap-3">
                <CustomSelect
                  compact
                  value={visibleTo}
                  onChange={setVisibleTo}
                  options={[{ label: "Public", value: "Public" }, { label: "Community", value: "Community" }]}
                />
                <button
                  onClick={handleNext}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full hover:bg-orange-600 transition-colors min-h-[44px]"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="hidden lg:block shrink-0 sticky top-[84px] self-start">
            <DiscoverSidePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
