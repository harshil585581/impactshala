import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import DiscoverSidePanel from "../../components/discover/DiscoverSidePanel";
import CustomSelect from "../../components/ui/CustomSelect";
import type { ProviderFormStep1 } from "./CreateProviderPage";

type WeeklySlot = { day: string; startTime: string; startPeriod: "AM" | "PM"; endTime: string; endPeriod: "AM" | "PM" };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LANGUAGES = ["English", "Kannada", "Hindi", "Tamil", "Telugu", "Other"];
const LEVELS = ["Individual", "Group", "Open to both"];
const DELIVERY_MODES = ["Onsite", "Online", "Hybrid"];


export default function CreateProviderDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const step1 = (location.state as { step1?: ProviderFormStep1 })?.step1;
  const eventType = step1?.eventOccurrence ?? "one_day";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Shared fields
  const [title, setTitle] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("");
  const [address, setAddress] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("");
  const [eligibilities, setEligibilities] = useState<string[]>([]);
  const [eligibilityInput, setEligibilityInput] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [onsiteVenue, setOnsiteVenue] = useState("");
  const [onlineAccess, setOnlineAccess] = useState("");
  const [docTexts, setDocTexts] = useState<string[]>([]);
  const [docInput, setDocInput] = useState("");
  const [fee, setFee] = useState("");
  const [visibleTo, setVisibleTo] = useState("Public");

  function addEligibility() {
    const trimmed = eligibilityInput.trim();
    if (trimmed) {
      setEligibilities((prev) => [...prev, trimmed]);
      setEligibilityInput("");
    }
  }

  function removeEligibility(i: number) {
    setEligibilities((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addDoc() {
    const trimmed = docInput.trim();
    if (trimmed) {
      setDocTexts((prev) => [...prev, trimmed]);
      setDocInput("");
    }
  }

  function removeDoc(i: number) {
    setDocTexts((prev) => prev.filter((_, idx) => idx !== i));
  }

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
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
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
        eligibilities,
        lastDate,
        coverPreview,
        coverFile,
        description,
        onsiteVenue,
        onlineAccess,
        docTexts,
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
                      <CustomSelect
                        value={slot.day}
                        onChange={(v) => updateSlot(i, "day", v)}
                        options={DAYS.map((d) => ({ label: d, value: d }))}
                        placeholder="Select day"
                      />
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
                  <CustomSelect
                    value={deliveryMode}
                    onChange={setDeliveryMode}
                    options={DELIVERY_MODES.map((m) => ({ label: m, value: m }))}
                    placeholder="Select"
                  />
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
                  <CustomSelect
                    value={language}
                    onChange={setLanguage}
                    options={LANGUAGES.map((l) => ({ label: l, value: l }))}
                    placeholder="Select"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-medium mb-1">
                    Level of participant
                  </label>
                  <CustomSelect
                    value={level}
                    onChange={setLevel}
                    options={LEVELS.map((l) => ({ label: l, value: l }))}
                    placeholder="Select"
                  />
                </div>
              </div>
            )}

            {/* Fee */}
            {!isWeekly && (
              <div className="mb-4">
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
            )}

            {/* Eligibility */}
            {!isWeekly && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-medium mb-1">
                  Mention eligibility criteria (if applicable)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={eligibilityInput}
                    onChange={(e) => setEligibilityInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEligibility()}
                    placeholder="Enter eligibility criteria"
                    className="flex-1 border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={addEligibility}
                    className="px-4 py-2 border border-primary text-primary text-sm font-medium rounded-full hover:bg-primary-light transition-colors min-h-[44px]"
                  >
                    Add
                  </button>
                </div>
                {eligibilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {eligibilities.map((item, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 bg-orange-50 border border-primary text-primary text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {item}
                        <button
                          onClick={() => removeEligibility(i)}
                          className="ml-1 text-primary hover:text-orange-700 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Document to be shared */}
            {!isWeekly && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-medium mb-1">
                  Document to be shared by applicant
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={docInput}
                    onChange={(e) => setDocInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addDoc()}
                    placeholder="Enter document name"
                    className="flex-1 border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-dark focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={addDoc}
                    className="px-4 py-2 border border-primary text-primary text-sm font-medium rounded-full hover:bg-primary-light transition-colors min-h-[44px]"
                  >
                    Add
                  </button>
                </div>
                {docTexts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {docTexts.map((item, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 bg-orange-50 border border-primary text-primary text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {item}
                        <button
                          onClick={() => removeDoc(i)}
                          className="ml-1 text-primary hover:text-orange-700 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                  <CustomSelect
                    compact
                    value={visibleTo}
                    onChange={setVisibleTo}
                    options={[{ label: "Public", value: "Public" }, { label: "Community", value: "Community" }]}
                  />
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

          {/* ── Right panel ── */}
          <div className="hidden lg:block shrink-0 sticky top-[84px] self-start">
            <DiscoverSidePanel />
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
