import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import PromoCard from "../../components/discover/PromoCard";
import type { ProviderFormStep1 } from "./CreateProviderPage";

type WeeklySlot = { day: string; startTime: string; startPeriod: "AM" | "PM"; endTime: string; endPeriod: "AM" | "PM" };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LANGUAGES = ["English", "Kannada", "Hindi", "Tamil", "Telugu", "Other"];
const LEVELS = ["Individual", "Group", "Open to both"];
const DELIVERY_MODES = ["Onsite", "Online", "Hybrid"];

const RECOMMENDATION_STORIES = [
  { title: "Tcs to let go of 12,000 people", time: "2h ago", readers: "10,470 readers" },
  { title: "Surat welcomes first vinfast", time: "2h ago", readers: "1,475 readers" },
  { title: "USLEU finalize trade pact", time: "10m ago", readers: "786 readers" },
  { title: "AI talent gap widens", time: "53m ago", readers: "756 readers" },
];

export default function CreateProviderDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const step1 = (location.state as { step1?: ProviderFormStep1 })?.step1;
  const eventType = step1?.eventOccurrence ?? "one_day";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Shared fields
  const [title, setTitle] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("");
  const [address, setAddress] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [onsiteVenue, setOnsiteVenue] = useState("");
  const [onlineAccess, setOnlineAccess] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [fee, setFee] = useState("");
  const [visibleTo, setVisibleTo] = useState("Public");

  // One-day specific
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  const [endTime, setEndTime] = useState("");
  const [endPeriod, setEndPeriod] = useState<"PM" | "AM">("PM");

  // Weekly/Custom specific
  const [slots, setSlots] = useState<WeeklySlot[]>([
    { day: "Monday", startTime: "09:00", startPeriod: "AM", endTime: "10:00", endPeriod: "AM" },
  ]);

  function addSlot() {
    setSlots((prev) => [
      ...prev,
      { day: "Monday", startTime: "09:00", startPeriod: "AM", endTime: "10:00", endPeriod: "AM" },
    ]);
  }

  function updateSlot(i: number, field: keyof WeeklySlot, value: string) {
    setSlots((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  }

  function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCoverPreview(URL.createObjectURL(file));
  }

  function handleNext() {
    const data = {
      step1,
      step2: {
        title,
        deliveryMode,
        address,
        language,
        level,
        eligibility,
        lastDate,
        coverPreview,
        description,
        onsiteVenue,
        onlineAccess,
        fee,
        eventDate,
        startTime: `${startTime} ${startPeriod}`,
        endTime: `${endTime} ${endPeriod}`,
        slots,
        visibleTo,
      },
    };
    navigate("/discover/create/provider/preview", { state: data });
  }

  const isWeekly = eventType === "weekly";
  const isCustom = eventType === "custom_multi_day";

  return (
    <div className="min-h-screen bg-bg-page">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">

          {/* ── Form ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-border-default p-6">
            <p className="text-primary font-bold text-sm mb-5">
              {isWeekly || isCustom ? "2 of 2: Post details" : "1 of 2: Post details"}
            </p>

            {/* Post title */}
            {!isWeekly && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-medium mb-1">
                  Post title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your post title"
                  className="w-full border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* One-day: date + time */}
            {!isWeekly && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Start Time
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="flex-1 border border-border-default rounded-xl px-2 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                    />
                    <PeriodToggle value={startPeriod} onChange={(v) => setStartPeriod(v as "AM" | "PM")} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    End Time
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="flex-1 border border-border-default rounded-xl px-2 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                    />
                    <PeriodToggle value={endPeriod} onChange={(v) => setEndPeriod(v as "AM" | "PM")} />
                  </div>
                </div>
              </div>
            )}

            {/* Weekly/Custom: day slots */}
            {(isWeekly || isCustom) && (
              <div className="mb-6">
                {slots.map((slot, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4 mb-3 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-text-medium mb-1">
                        Select Day
                      </label>
                      <select
                        value={slot.day}
                        onChange={(e) => updateSlot(i, "day", e.target.value)}
                        className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-medium mb-1">
                        Start Time
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(i, "startTime", e.target.value)}
                          className="flex-1 border border-border-default rounded-xl px-2 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                        />
                        <PeriodToggle value={slot.startPeriod} onChange={(v) => updateSlot(i, "startPeriod", v)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-medium mb-1">
                        End Time
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(i, "endTime", e.target.value)}
                          className="flex-1 border border-border-default rounded-xl px-2 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                        />
                        <PeriodToggle value={slot.endPeriod} onChange={(v) => updateSlot(i, "endPeriod", v)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addSlot}
                  className="flex items-center gap-2 text-sm text-primary font-medium mt-2 hover:underline"
                >
                  <span className="text-lg leading-none">⊕</span> Add More Data
                </button>
              </div>
            )}

            {/* Delivery mode + Address */}
            {!isWeekly && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Delivery Mode
                  </label>
                  <select
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value)}
                    className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Select</option>
                    {DELIVERY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address"
                    className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Language + Level */}
            {!isWeekly && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Mention the Communication language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Select</option>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Level of participant
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Select</option>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Eligibility + Fee */}
            {!isWeekly && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Mention eligibility criteria (if applicable)
                  </label>
                  <textarea
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    placeholder="Enter eligibility criteria"
                    rows={2}
                    className="w-full border border-border-default rounded-xl px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Fee (₹)
                  </label>
                  <input
                    type="text"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="e.g. 5,000 or Free"
                    className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Document upload */}
            {!isWeekly && (
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
                      {docFile ? docFile.name : "Click to upload document"}
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
            )}

            {/* Last date */}
            {!isWeekly && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-medium mb-1">
                  Last date to apply
                </label>
                <input
                  type="date"
                  value={lastDate}
                  onChange={(e) => setLastDate(e.target.value)}
                  className="border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Access details */}
            {!isWeekly && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Onsite Venue
                  </label>
                  <input
                    type="text"
                    value={onsiteVenue}
                    onChange={(e) => setOnsiteVenue(e.target.value)}
                    placeholder="Venue address"
                    className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Online Access
                  </label>
                  <input
                    type="text"
                    value={onlineAccess}
                    onChange={(e) => setOnlineAccess(e.target.value)}
                    placeholder="Zoom link or platform"
                    className="w-full border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Cover image */}
            {!isWeekly && (
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
                      alt="Cover preview"
                      className="w-full h-[150px] object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-text-muted">
                      <p className="text-sm">Browse and select a file to upload</p>
                      <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                    </div>
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
            )}

            {/* Description rich text (simplified textarea) */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-medium mb-1">
                Add any additional relevant details to complete your post
              </label>
              <div className="border border-border-default rounded-xl overflow-hidden">
                <div className="flex gap-2 px-3 py-2 border-b border-border-light text-text-muted text-sm">
                  <button className="font-bold hover:text-text-dark">B</button>
                  <button className="italic hover:text-text-dark">I</button>
                  <button className="underline hover:text-text-dark">U</button>
                  <button className="hover:text-text-dark">S̶</button>
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
                <div className="flex items-center gap-2 text-sm text-text-medium">
                  <span>Visible to:</span>
                  <select
                    value={visibleTo}
                    onChange={(e) => setVisibleTo(e.target.value)}
                    className="border border-border-default rounded-lg px-2 py-1 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
                  >
                    <option>Public</option>
                    <option>Community</option>
                  </select>
                </div>
                <button
                  onClick={handleNext}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full hover:bg-orange-600 transition-colors min-h-[44px]"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* ── Right panel (weekly shows news feed) ── */}
          <div className="hidden lg:block w-[287px] shrink-0">
            <div className="sticky top-[90px]">
              {isWeekly ? (
                <div className="bg-white rounded-2xl border border-border-default p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-text-dark text-sm">Recommendation Posts</p>
                    <span className="text-primary text-xs cursor-pointer">›</span>
                  </div>
                  <p className="text-xs text-text-muted font-semibold mb-3">Top Stories</p>
                  <div className="flex flex-col gap-3">
                    {RECOMMENDATION_STORIES.map((s, i) => (
                      <div key={i} className="border-b border-border-light pb-3 last:border-0 last:pb-0">
                        <p className="text-sm font-medium text-text-dark leading-snug mb-0.5">
                          {s.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {s.time} • {s.readers}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button className="mt-3 text-xs text-primary font-medium hover:underline">
                    Show more
                  </button>
                </div>
              ) : (
                <PromoCard />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PeriodToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col border border-border-default rounded-lg overflow-hidden text-xs font-semibold">
      {(["AM", "PM"] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-2 py-1 ${value === p ? "bg-primary text-white" : "bg-white text-text-medium hover:bg-border-light"}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
