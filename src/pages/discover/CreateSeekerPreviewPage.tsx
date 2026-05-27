import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { createSeekerPost } from "../../services/discoverService";
import DiscoverSidePanel from "../../components/discover/DiscoverSidePanel";

export default function CreateSeekerPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as Record<string, unknown> | null;
  const step1 = (state?.step1 ?? {}) as Record<string, string>;
  const step2 = (state?.step2 ?? {}) as Record<string, unknown>;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [visiblePopup, setVisiblePopup] = useState(false);

  const domain = step1.domain ?? "";
  const natureRaw = step1.nature ?? "";
  const [, optionLabel] = natureRaw.includes(":")
    ? natureRaw.split(":")
    : [natureRaw, ""];

  async function handlePublish() {
    setSubmitting(true);
    setError("");
    try {
      await createSeekerPost({
        title: String(step2.title ?? ""),
        professionalLevel: String(step2.professionalLevel ?? ""),
        address: String(step2.address ?? ""),
        canPay: Boolean(step2.canPay),
        budget: String(step2.budget ?? ""),
        providerPreferences: String(step2.preferences ?? ""),
        preferredDate: String(step2.preferredDate ?? ""),
        description: String(step2.description ?? ""),
        coverImageUrl: String(step2.coverPreview ?? ""),
        visibleTo:
          (String(step2.visibleTo ?? "public").toLowerCase() as "public" | "community"),
      });
      navigate("/discover");
    } catch {
      setError("Failed to publish post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">

          {/* ── Preview ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-border-default overflow-hidden">
            <div className="p-6">
              <h1 className="text-primary font-bold text-xl mb-4">
                Preview your application
              </h1>

              {/* Cover image */}
              {step2.coverPreview ? (
                <img
                  src={String(step2.coverPreview)}
                  alt="Cover"
                  className="w-full h-[220px] object-cover rounded-xl mb-4"
                />
              ) : (
                <div className="w-full h-[220px] bg-border-light rounded-xl mb-4 flex items-center justify-center text-text-muted text-sm">
                  No cover image
                </div>
              )}

              <h2 className="font-bold text-text-dark text-xl mb-2">
                {String(step2.title || "Untitled Post")}
              </h2>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-border-default" />
                <div>
                  <p className="font-semibold text-text-dark text-sm">Your Name</p>
                  <p className="text-text-muted text-xs">
                    {String(step2.visibleTo ?? "Public")}
                  </p>
                </div>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 mb-5">
                {!!step2.preferredDate && (
                  <Chip>{String(step2.preferredDate)}</Chip>
                )}
                {!!step2.professionalLevel && (
                  <Chip>{String(step2.professionalLevel)}</Chip>
                )}
                {!!step2.address && <Chip>{String(step2.address)}</Chip>}
              </div>

              <div className="border-t border-border-light pt-5 space-y-5">
                <section>
                  <h3 className="font-bold text-text-dark text-base mb-3">Seeking Details</h3>
                  <div className="space-y-1.5 text-sm text-text-medium">
                    <Row label="Domain">{domain}</Row>
                    {optionLabel && <Row label="Looking for">{optionLabel}</Row>}
                    {step1.keyword && <Row label="Keyword">{step1.keyword}</Row>}
                    {step1.targetAudience && (
                      <Row label="I am a">{step1.targetAudience}</Row>
                    )}
                    {step1.educationalLevel && (
                      <Row label="Level">{step1.educationalLevel}</Row>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-text-dark text-base mb-3">Budget & Preferences</h3>
                  <div className="space-y-1.5 text-sm text-text-medium">
                    <Row label="Able to pay">{step2.canPay ? "Yes" : "No"}</Row>
                    {!!step2.budget && <Row label="Budget">₹ {String(step2.budget)}</Row>}
                    {!!step2.preferences && (
                      <Row label="Provider preferences">{String(step2.preferences)}</Row>
                    )}
                  </div>
                </section>

                {!!step2.description && (
                  <section>
                    <h3 className="font-bold text-text-dark text-base mb-3">Description</h3>
                    <p className="text-sm text-text-medium leading-relaxed whitespace-pre-wrap">
                      {String(step2.description)}
                    </p>
                  </section>
                )}
              </div>

              {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

              {/* Footer */}
              <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 border border-border-default rounded-full text-sm font-semibold text-text-medium hover:border-primary transition-colors min-h-[44px]"
                >
                  Save
                </button>
                <div className="flex items-center gap-3 relative">
                  <button
                    onClick={() => setVisiblePopup((v) => !v)}
                    className="text-sm text-text-medium border border-border-default px-4 py-2 rounded-full hover:border-primary transition-colors min-h-[44px]"
                  >
                    Visible to: {String(step2.visibleTo ?? "Public")} ▾
                  </button>
                  {visiblePopup && (
                    <div className="absolute bottom-full mb-2 right-28 bg-white border border-border-default rounded-xl shadow-lg overflow-hidden z-10 min-w-[140px]">
                      {["Public", "Community"].map((v) => (
                        <button
                          key={v}
                          className="w-full text-left px-4 py-2.5 text-sm text-text-medium hover:bg-primary-light transition-colors flex items-center gap-2"
                          onClick={() => setVisiblePopup(false)}
                        >
                          {v === "Public" ? "🌐" : "👥"} {v}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handlePublish}
                    disabled={submitting}
                    className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {submitting ? "Publishing…" : "Manage post"}
                  </button>
                </div>
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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
      {children}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p>
      <span className="font-semibold">{label}: </span>
      {children}
    </p>
  );
}
