import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { createProviderPost } from "../../services/discoverService";
import DiscoverSidePanel from "../../components/discover/DiscoverSidePanel";
import { supabase, getAuthenticatedSession } from "../../lib/supabase";

async function uploadCoverImage(file: File): Promise<string> {
  const session = await getAuthenticatedSession();
  const userId: string = session?.user?.id ?? JSON.parse(localStorage.getItem("user") ?? "{}").id ?? "anon";
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/discover_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("post-media").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
}

export default function CreateProviderPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as Record<string, unknown> | null;
  const step1 = (state?.step1 ?? {}) as Record<string, string>;
  const step2 = (state?.step2 ?? {}) as Record<string, unknown>;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [visiblePopup, setVisiblePopup] = useState(false);

  // Typed step2 accessors
  const s2 = {
    title: (step2.title as string) ?? "",
    coverPreview: step2.coverPreview as string | undefined,
    deliveryMode: step2.deliveryMode as string | undefined,
    eventDate: step2.eventDate as string | undefined,
    startTime: step2.startTime as string | undefined,
    endTime: step2.endTime as string | undefined,
    lastDate: step2.lastDate as string | undefined,
    fee: step2.fee as string | undefined,
    onsiteVenue: step2.onsiteVenue as string | undefined,
    onlineAccess: step2.onlineAccess as string | undefined,
    description: step2.description as string | undefined,
    visibleTo: (step2.visibleTo as string) ?? "Public",
    eligibilities: (step2.eligibilities as string[]) ?? [],
    docTexts: (step2.docTexts as string[]) ?? [],
  };

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
      if (step2.coverFile instanceof File) {
        coverImageUrl = await uploadCoverImage(step2.coverFile);
      } else if (typeof step2.coverPreview === "string" && step2.coverPreview.startsWith("http")) {
        coverImageUrl = step2.coverPreview as string;
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
        title: (step2.title as string) ?? "",
        eventDate: step2.eventDate as string | undefined,
        startTime: step2.startTime as string | undefined,
        endTime: step2.endTime as string | undefined,
        deliveryMode: step2.deliveryMode as string | undefined,
        address: step2.address as string | undefined,
        communicationLanguage: step2.language as string | undefined,
        levelOfParticipant: step2.level as string | undefined,
        eligibilityCriteria: (step2.eligibilities as string[] | undefined) ?? [],
        documentsRequired: (step2.docTexts as string[] | undefined) ?? [],
        lastDateToApply: step2.lastDate as string | undefined,
        fee: step2.fee as string | undefined,
        onsiteVenue: step2.onsiteVenue as string | undefined,
        onlineAccess: step2.onlineAccess as string | undefined,
        description: step2.description as string | undefined,
        coverImageUrl,
        visibleTo: ((step2.visibleTo as string)?.toLowerCase() as "public" | "community") ?? "public",
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
              {s2.coverPreview ? (
                <img
                  src={s2.coverPreview}
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
                {s2.title || "Untitled Post"}
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
                {s2.deliveryMode && (
                  <Chip>{s2.deliveryMode}</Chip>
                )}
                {s2.eventDate && (
                  <Chip>{new Date(s2.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</Chip>
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
                    {s2.lastDate && (
                      <Row label="Last Date to Apply">{s2.lastDate}</Row>
                    )}
                    {s2.eventDate && (
                      <div className="flex items-center justify-between">
                        <span>
                          <span className="font-semibold">Start Date: </span>
                          {s2.eventDate}
                        </span>
                        {s2.startTime && (
                          <span><span className="font-semibold">Time: </span>{s2.startTime}</span>
                        )}
                      </div>
                    )}
                    {s2.endTime && (
                      <div className="flex items-center justify-between">
                        <span>
                          <span className="font-semibold">End Date: </span>
                          {s2.eventDate}
                        </span>
                        <span><span className="font-semibold">Time: </span>{s2.endTime}</span>
                      </div>
                    )}
                    {s2.fee && <Row label="Fee">₹ {s2.fee}</Row>}
                  </div>
                </section>

                {/* Eligibility & Documents */}
                {(s2.eligibilities.length > 0 || s2.docTexts.length > 0) && (
                  <section>
                    <h3 className="font-bold text-text-dark text-base mb-3">Requirements</h3>
                    <div className="space-y-1.5 text-sm text-text-medium">
                      {s2.eligibilities.length > 0 && (
                        <div>
                          <span className="font-semibold">Eligibility Criteria: </span>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {s2.eligibilities.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}
                      {s2.docTexts.length > 0 && (
                        <div>
                          <span className="font-semibold">Documents Required: </span>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {s2.docTexts.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Access Details */}
                {(s2.onsiteVenue || s2.onlineAccess) && (
                  <section>
                    <h3 className="font-bold text-text-dark text-base mb-3">Access Details</h3>
                    <div className="space-y-1.5 text-sm text-text-medium">
                      {s2.onsiteVenue && (
                        <Row label="Onsite Venue">{s2.onsiteVenue}</Row>
                      )}
                      {s2.onlineAccess && (
                        <Row label="Online Access">{s2.onlineAccess}</Row>
                      )}
                    </div>
                  </section>
                )}

                {/* Description */}
                {s2.description && (
                  <section>
                    <h3 className="font-bold text-text-dark text-base mb-3">Description</h3>
                    <p className="text-sm text-text-medium leading-relaxed whitespace-pre-wrap">
                      {s2.description}
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
                    Visible to: {s2.visibleTo} ▾
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
