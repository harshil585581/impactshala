import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { createProviderPost } from "../../services/discoverService";
import DiscoverSidePanel from "../../components/discover/DiscoverSidePanel";

async function uploadCoverImage(file: File): Promise<string> {
  const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
  const token: string | undefined = stored?.access_token;
  const userId: string = stored?.id ?? "anon";
  const client = createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined,
  );
  const ext = file.name.split(".").pop() ?? "jpg";
  // Path must start with userId so the storage policy check passes:
  // policy: auth.uid() = storage.foldername(name)[1]  (first folder = userId)
  const path = `${userId}/discover_${Date.now()}.${ext}`;
  const { error } = await client.storage.from("post-media").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  return client.storage.from("post-media").getPublicUrl(path).data.publicUrl;
}

export default function CreateProviderPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as Record<string, unknown> | null;
  const step1 = (state?.step1 ?? {}) as Record<string, string>;
  const step2 = (state?.step2 ?? {}) as Record<string, string>;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [visiblePopup, setVisiblePopup] = useState(false);

  const domain = step1.domain ?? "Education";
  const natureRaw = step1.nature ?? "";
  const [groupLabel, optionLabel] = natureRaw.includes(":")
    ? natureRaw.split(":")
    : [natureRaw, ""];

  async function handlePublish() {
    setSubmitting(true);
    setError("");
    try {
      // Upload cover image to Supabase storage and get a permanent URL
      let coverImageUrl: string | undefined;
      const rawStep2 = (state?.step2 ?? {}) as Record<string, unknown>;
      if (rawStep2.coverFile instanceof File) {
        coverImageUrl = await uploadCoverImage(rawStep2.coverFile);
      } else if (typeof step2.coverPreview === "string" && step2.coverPreview.startsWith("http")) {
        coverImageUrl = step2.coverPreview;
      }

      await createProviderPost({
        type: (step1.postingType as "opportunity" | "service") ?? "opportunity",
        domain,
        nature: optionLabel || groupLabel,
        keyword: step1.keyword,
        targetAudience: step1.targetAudience ?? "",
        educationalLevel: step1.educationalLevel,
        eventOccurrence:
          (step1.eventOccurrence as "one_day" | "weekly" | "custom_multi_day") ??
          "one_day",
        title: step2.title ?? "",
        eventDate: step2.eventDate,
        startTime: step2.startTime,
        endTime: step2.endTime,
        deliveryMode: step2.deliveryMode,
        address: step2.address,
        communicationLanguage: step2.language,
        levelOfParticipant: step2.level,
        eligibilityCriteria: step2.eligibility,
        lastDateToApply: step2.lastDate,
        fee: step2.fee,
        onsiteVenue: step2.onsiteVenue,
        onlineAccess: step2.onlineAccess,
        description: step2.description,
        coverImageUrl,
        visibleTo: (step2.visibleTo?.toLowerCase() as "public" | "community") ?? "public",
      });
      navigate("/discover");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post. Please try again.");
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

          {/* ── Preview card ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-border-default overflow-hidden">
            <div className="p-6">
              <h1 className="text-primary font-bold text-xl mb-4">
                Preview your application
              </h1>

              {/* Cover image */}
              {step2.coverPreview ? (
                <img
                  src={step2.coverPreview}
                  alt="Cover"
                  className="w-full h-[220px] object-cover rounded-xl mb-4"
                />
              ) : (
                <div className="w-full h-[220px] bg-border-light rounded-xl mb-4 flex items-center justify-center text-text-muted text-sm">
                  No cover image
                </div>
              )}

              {/* Title */}
              <h2 className="font-bold text-text-dark text-xl mb-2">
                {step2.title || "Untitled Post"}
              </h2>

              {/* Author row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-border-default" />
                <div>
                  <p className="font-semibold text-text-dark text-sm">Rohan Sharma</p>
                  <p className="text-text-muted text-xs">Design • Organization</p>
                </div>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 mb-5">
                {step2.deliveryMode && (
                  <Chip>{step2.deliveryMode}</Chip>
                )}
                {step2.eventDate && (
                  <Chip>{new Date(step2.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</Chip>
                )}
                {step1.educationalLevel && (
                  <Chip>{step1.educationalLevel}</Chip>
                )}
              </div>

              <div className="border-t border-border-light pt-5 space-y-5">
                {/* More Details */}
                <section>
                  <h3 className="font-bold text-text-dark text-base mb-3">More Details</h3>
                  <div className="space-y-1.5 text-sm text-text-medium">
                    <Row label="Posting type">
                      {step1.postingType === "opportunity" ? "Offering an Opportunity" : "Offering a Service"}
                    </Row>
                    <Row label="Opportunity Domain">{domain}</Row>
                    <Row label="Opportunity Nature">{optionLabel || groupLabel}</Row>
                    {step1.keyword && <Row label="Keyword">{step1.keyword}</Row>}
                    {step1.targetAudience && (
                      <Row label="Target audience">{step1.targetAudience}</Row>
                    )}
                  </div>
                </section>

                {/* Engagement Details */}
                <section>
                  <h3 className="font-bold text-text-dark text-base mb-3">Engagement Details</h3>
                  <div className="space-y-1.5 text-sm text-text-medium">
                    {step2.lastDate && (
                      <Row label="Last Date to Apply">{step2.lastDate}</Row>
                    )}
                    {step2.eventDate && (
                      <div className="flex items-center justify-between">
                        <span>
                          <span className="font-semibold">Start Date: </span>
                          {step2.eventDate}
                        </span>
                        {step2.startTime && (
                          <span><span className="font-semibold">Time: </span>{step2.startTime}</span>
                        )}
                      </div>
                    )}
                    {step2.endTime && (
                      <div className="flex items-center justify-between">
                        <span>
                          <span className="font-semibold">End Date: </span>
                          {step2.eventDate}
                        </span>
                        <span><span className="font-semibold">Time: </span>{step2.endTime}</span>
                      </div>
                    )}
                    {step2.fee && <Row label="Fee">₹ {step2.fee}</Row>}
                  </div>
                </section>

                {/* Access Details */}
                {(step2.onsiteVenue || step2.onlineAccess) && (
                  <section>
                    <h3 className="font-bold text-text-dark text-base mb-3">Access Details</h3>
                    <div className="space-y-1.5 text-sm text-text-medium">
                      {step2.onsiteVenue && (
                        <Row label="Onsite Venue">{step2.onsiteVenue}</Row>
                      )}
                      {step2.onlineAccess && (
                        <Row label="Online Access">{step2.onlineAccess}</Row>
                      )}
                    </div>
                  </section>
                )}

                {/* Description */}
                {step2.description && (
                  <section>
                    <h3 className="font-bold text-text-dark text-base mb-3">Description</h3>
                    <p className="text-sm text-text-medium leading-relaxed whitespace-pre-wrap">
                      {step2.description}
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
                    Visible to: {step2.visibleTo ?? "Public"} ▾
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
