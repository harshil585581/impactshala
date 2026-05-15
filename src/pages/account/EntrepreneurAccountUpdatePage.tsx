import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import { useAccountUpdate } from "../../hooks/useAccountUpdate";
import { uploadProfileImage } from "../../services/accountService";

// Tab icons from Figma
type Tab = "profile" | "more" | "contact" | "complete";

const DESCRIBE_OPTIONS: Record<"established" | "aspiring", string[]> = {
  established: ["Startup Mentor", "Angel Investor", "Others"],
  aspiring: ["Student", "Working Professional", "Out of Work"],
};

const SOCIAL_PLATFORMS = [
  "GitHub",
  "Behance / Dribbble",
  "Instagram",
  "Twitter / X",
  "Facebook",
  "Medium / Substack",
  "LinkedIn",
];

const linkIcon = `data:image/svg+xml,${encodeURIComponent('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#9199a3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#9199a3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`;
const envelopeIcon = `data:image/svg+xml,${encodeURIComponent('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#9199a3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 6l-10 7L2 6" stroke="#9199a3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`;
const languageIcon = `data:image/svg+xml,${encodeURIComponent('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8c.667-1 1.5-2 2.5-2.5m.5 8c-2 0-4-1-4-1s2-4 5-4" stroke="#9199a3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11l4 8M20 11l-4 8m0 0h4" stroke="#9199a3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`;

const inputCls =
  "w-full h-[48px] border border-[#e4e5e8] bg-white rounded-full px-4 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors";

// ── Upload drop-zone ──────────────────────────────────────────────────────────
function UploadArea({
  hint,
  accept,
  preview,
  uploading,
  onFileChange,
}: {
  hint: string;
  accept?: string;
  preview?: string;
  uploading?: boolean;
  onFileChange?: (f: File) => void;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && onFileChange) onFileChange(f);
  }
  if (preview) {
    return (
      <label className="relative rounded-lg overflow-hidden cursor-pointer block w-full h-[120px]">
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-white text-sm font-medium">Change</span>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleChange}
        />
      </label>
    );
  }
  return (
    <label className="flex flex-col items-center gap-3 border border-dashed border-[#767676] bg-[#f3f5f7] rounded-lg p-4 cursor-pointer hover:bg-[#eef0f2] transition-colors w-full">
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleChange}
      />
      {uploading ? (
        <div className="w-10 h-10 border-4 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[#7c8493]"
        >
          <polyline
            points="16 16 12 12 8 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="12"
            y1="12"
            x2="12"
            y2="21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <div className="text-center">
        <p className="text-sm text-[#18191c]">
          <span className="font-medium">Browse photo</span> or drop here
        </p>
        <p className="text-xs text-[#5e6670] mt-1 leading-relaxed">{hint}</p>
      </div>
    </label>
  );
}

// ── Tag input ─────────────────────────────────────────────────────────────────
function TagInput({
  label,
  placeholder,
  hint,
  tags,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  hint?: string;
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
}) {
  const [input, setInput] = useState("");

  function commit() {
    const v = input.trim().replace(/,/g, "");
    if (v) {
      onAdd(v);
      setInput("");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#18191c] text-sm">{label}</label>
      <div className="min-h-[48px] border border-[#e4e5e8] bg-white rounded-full px-3 flex flex-wrap items-center gap-1.5 py-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 bg-[#ffeacc] text-[#f77f00] text-sm rounded-full pl-3 pr-2 py-1 shrink-0"
          >
            {t}
            <button
              type="button"
              onClick={() => onRemove(t)}
              className="hover:text-[#cc7700] transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "," || e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] text-sm bg-transparent outline-none text-[#18191c] placeholder-[#9199a3]"
        />
      </div>
      {hint && <p className="text-[#9199a3] text-sm">{hint}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EntrepreneurAccountUpdatePage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");
  const { profile, loading, saving, error, successMsg, save } =
    useAccountUpdate();

  // Photo upload
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Profile Info
  const [entrepreneurType, setEntrepreneurType] = useState<
    "established" | "aspiring"
  >("established");
  const [describeAs, setDescribeAs] = useState("");
  const [showDescribeDrop, setShowDescribeDrop] = useState(false);
  const [bio, setBio] = useState("");

  // More Info
  const [skills, setSkills] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [socialLinks, setSocialLinks] = useState([
    { platform: "GitHub", url: "" },
  ]);
  const [openSocialDropdown, setOpenSocialDropdown] = useState<number | null>(
    null,
  );

  // Contact
  const [reachFor, setReachFor] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [languages, setLanguages] = useState("");

  // Pre-fill form when profile loads
  useEffect(() => {
    if (!profile) return;
    if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
    if (profile.cover_url) setCoverUrl(profile.cover_url);
    if (profile.entrepreneur_type)
      setEntrepreneurType(profile.entrepreneur_type);
    if (profile.describe_as) setDescribeAs(profile.describe_as);
    if (profile.bio) setBio(profile.bio);
    if (profile.skills?.length) setSkills(profile.skills);
    if (profile.website) setWebsite(profile.website);
    if (profile.social_links?.length) setSocialLinks(profile.social_links);
    if (profile.reach_for?.length) setReachFor(profile.reach_for);
    if (profile.location) setLocation(profile.location);
    if (profile.email) setEmail(profile.email);
    if (profile.languages) setLanguages(profile.languages);
  }, [profile]);

  const progressMap: Record<Tab, number> = {
    profile: 25,
    more: 50,
    contact: 75,
    complete: 100,
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile Info" },
    { id: "more", label: "More Info" },
    { id: "contact", label: "Contact" },
  ];

  async function handleAvatarChange(file: File) {
    setAvatarUploading(true);
    setUploadError("");
    try {
      const url = await uploadProfileImage(file, "avatar");
      setAvatarUrl(url);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleCoverChange(file: File) {
    setCoverUploading(true);
    setUploadError("");
    try {
      const url = await uploadProfileImage(file, "cover");
      setCoverUrl(url);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Cover upload failed");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSave() {
    if (tab === "profile") {
      const ok = await save({
        entrepreneur_type: entrepreneurType,
        describe_as: describeAs,
        bio,
      });
      if (ok) setTab("more");
    } else if (tab === "more") {
      const ok = await save({ skills, website, social_links: socialLinks });
      if (ok) setTab("contact");
    } else {
      const ok = await save({
        reach_for: reachFor,
        location,
        languages,
        setup_complete: true,
      });
      if (ok) setTab("complete");
    }
  }

  function removeSocialLink(idx: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateSocialLink(
    idx: number,
    field: "platform" | "url",
    value: string,
  ) {
    setSocialLinks((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="pt-[78px] lg:pl-[280px] flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        {/* ── Completion screen ── */}
        {tab === "complete" && (
          <div className="flex items-center justify-center min-h-[calc(100vh-78px)] px-4">
            <div className="flex flex-col items-center gap-8 text-center max-w-md w-full">
              <div className="bg-[#ffeacc] p-10 rounded-full">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-[#f77f00]"
                >
                  <polyline
                    points="20 6 9 17 4 12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="20 12 9 23 4 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-[#18191c] text-xl sm:text-2xl font-semibold leading-snug">
                🎉 Congratulations, Your profile is 100% complete!
              </h2>
              <button
                onClick={() => navigate("/home")}
                className="flex items-center gap-3 bg-[#f77f00] text-white text-base font-semibold rounded-full px-8 py-4 hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.35)]"
              >
                Go To Home
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Form ── */}
        {tab !== "complete" && (
          <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Progress */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between text-sm sm:text-base mb-3">
                <span className="text-[#767f8c]">Setup Progress</span>
                <span className="text-[#f77f00] font-medium">
                  {progressMap[tab]}% Completed
                </span>
              </div>
              <div className="w-full h-[9px] bg-[#e7f0fa] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#f77f00] rounded-full transition-all duration-500"
                  style={{ width: `${progressMap[tab]}%` }}
                />
              </div>
            </div>

            {/* Tab bar */}
            <div className="bg-[#f9fafb] rounded-[10px] p-1 mb-6 sm:mb-8">
              <div className="flex items-center">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-3 rounded-[10px] text-sm transition-all ${
                      tab === t.id
                        ? "bg-white shadow-sm text-[#f77f00] font-semibold"
                        : "text-[#4f5665] font-medium hover:text-[#18191c]"
                    }`}
                  >
                    {t.id === 'profile' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    {t.id === 'more' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M6 20c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    {t.id === 'contact' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    <span className="hidden xs:inline sm:inline">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}
            {successMsg && (
              <p className="text-green-600 text-sm mb-4 text-center">
                {successMsg}
              </p>
            )}
            {uploadError && (
              <p className="text-red-500 text-sm mb-4 text-center">
                {uploadError}
              </p>
            )}

            {/* ── Tab: Profile Info ── */}
            {tab === "profile" && (
              <div className="flex flex-col gap-5 sm:gap-6">
                {/* Photo uploads */}
                <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                  <div className="flex flex-col gap-2 w-full sm:w-[260px] shrink-0">
                    <p className="text-[#18191c] text-sm">Profile Photo</p>
                    <UploadArea
                      hint="A photo larger than 400 pixels work best. Max photo size 5 MB."
                      accept="image/*"
                      preview={avatarUrl}
                      uploading={avatarUploading}
                      onFileChange={handleAvatarChange}
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <p className="text-[#18191c] text-sm">Cover Photo</p>
                    <UploadArea
                      hint="Banner images optimal dimension 1520 × 400. Supported: jpeg, png, max 5 MB."
                      accept="image/*"
                      preview={coverUrl}
                      uploading={coverUploading}
                      onFileChange={handleCoverChange}
                    />
                  </div>
                </div>

                {/* Identify yourself further */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">
                    Identify yourself further
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEntrepreneurType("established");
                        setDescribeAs("");
                      }}
                      className={`h-[48px] rounded-full px-6 text-sm font-medium transition-colors bg-white ${
                        entrepreneurType === "established"
                          ? "border border-[#f77f00] text-[#f77f00]"
                          : "border border-[#9f9f9f] text-[#9f9f9f]"
                      }`}
                    >
                      Established Entrepreneur
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEntrepreneurType("aspiring");
                        setDescribeAs("");
                      }}
                      className={`h-[48px] rounded-full px-6 text-sm font-medium transition-colors bg-white ${
                        entrepreneurType === "aspiring"
                          ? "border border-[#f77f00] text-[#f77f00]"
                          : "border border-[#9f9f9f] text-[#9f9f9f]"
                      }`}
                    >
                      Aspiring Entrepreneur
                    </button>
                  </div>
                </div>

                {/* Select what best describes you */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">
                    Select what best describes you
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDescribeDrop((v) => !v)}
                      className="w-full h-[48px] border border-[#e4e5e8] bg-white rounded-full px-4 flex items-center justify-between text-sm focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00]"
                    >
                      <span
                        className={
                          describeAs ? "text-[#18191c]" : "text-[#9199a3]"
                        }
                      >
                        {describeAs || "Select"}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={`transition-transform duration-200 ${showDescribeDrop ? "rotate-180" : ""}`}
                      >
                        <path
                          d="M6 9l6 6 6-6"
                          stroke="#9199a3"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {showDescribeDrop && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e4e5e8] rounded-2xl shadow-lg z-10 overflow-hidden">
                        {DESCRIBE_OPTIONS[entrepreneurType].map((opt, idx) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setDescribeAs(opt);
                              setShowDescribeDrop(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                              idx === 0
                                ? "text-[#f77f00] border-l-2 border-[#f77f00]"
                                : "text-[#18191c] hover:bg-[#fff6ed] hover:text-[#f77f00]"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Bio</label>
                  <textarea
                    placeholder="Write down your bio here. Let others know who you are..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    className="w-full border border-[#e4e5e8] bg-white rounded-[18px] px-4 py-3 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── Tab: More Info ── */}
            {tab === "more" && (
              <div className="flex flex-col gap-5 sm:gap-6">
                <TagInput
                  label="Mention your Expertise & Skills in keywords"
                  placeholder="Type a skill and press comma or Enter"
                  hint="Enter a comma after each tag"
                  tags={skills}
                  onAdd={(t) => setSkills((prev) => [...prev, t])}
                  onRemove={(t) =>
                    setSkills((prev) => prev.filter((x) => x !== t))
                  }
                />

                {/* Portfolio / Resume upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">
                    Upload your Portfolio/Resume
                  </label>
                  <label className="flex flex-col items-center gap-3 border-2 border-dashed border-[rgba(200,204,209,0.7)] bg-[rgba(241,242,244,0.4)] rounded-[6px] px-8 py-6 cursor-pointer hover:bg-[rgba(241,242,244,0.7)] transition-colors">
                    <input type="file" accept=".pdf" className="sr-only" />
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-[#7c8493]"
                    >
                      <polyline
                        points="16 16 12 12 8 16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="12"
                        y1="12"
                        x2="12"
                        y2="21"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm text-[#18191c]">
                        <span className="font-medium">Browse File</span> or drop
                        here
                      </p>
                      <p className="text-xs text-[#5e6670] mt-1">
                        *Supported Format Pdf, Max file size 12 MB.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Website */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">
                    Website (Optional)
                  </label>
                  <div className="relative">
                    <img
                      src={linkIcon}
                      alt=""
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                    />
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>

                {/* Social links */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Social Link</label>
                  <div className="flex flex-col gap-3">
                    {socialLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          {/* Platform selector button */}
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenSocialDropdown(
                                    openSocialDropdown === idx ? null : idx,
                                  )
                                }
                                className="h-[48px] border border-[#e4e5e8] bg-white rounded-full px-4 flex items-center gap-2 text-sm font-medium text-[#18191c] focus:outline-none focus:border-[#f77f00] min-w-[160px] justify-between"
                              >
                                <span>{link.platform}</span>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className={`transition-transform duration-200 ${openSocialDropdown === idx ? "rotate-180" : ""}`}
                                >
                                  <path
                                    d="M6 9l6 6 6-6"
                                    stroke="#9199a3"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              {openSocialDropdown === idx && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-[#e4e5e8] rounded-2xl shadow-lg z-20 overflow-hidden min-w-[180px]">
                                  {SOCIAL_PLATFORMS.map((p, pIdx) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => {
                                        updateSocialLink(idx, "platform", p);
                                        setOpenSocialDropdown(null);
                                      }}
                                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                        pIdx === SOCIAL_PLATFORMS.length - 1
                                          ? "text-[#f77f00] border-l-2 border-[#f77f00]"
                                          : "text-[#18191c] hover:bg-[#fff6ed] hover:text-[#f77f00]"
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <input
                              type="url"
                              placeholder="Profile link/url..."
                              value={link.url}
                              onChange={(e) =>
                                updateSocialLink(idx, "url", e.target.value)
                              }
                              className="flex-1 h-[48px] border border-[#e4e5e8] bg-white rounded-full px-4 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors"
                            />
                          </div>
                        </div>
                        {socialLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSocialLink(idx)}
                            className="w-10 h-10 bg-[#f1f2f4] rounded-full flex items-center justify-center shrink-0 hover:bg-[#e4e5e8] transition-colors"
                            aria-label="Remove link"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M18 6L6 18M6 6l12 12"
                                stroke="#7c8493"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add new */}
                    <button
                      type="button"
                      onClick={() =>
                        setSocialLinks((prev) => [
                          ...prev,
                          { platform: "GitHub", url: "" },
                        ])
                      }
                      className="w-full h-[44px] bg-[#ffeacc] rounded-full flex items-center justify-center gap-2 text-sm font-medium text-[#18191c] hover:bg-[#ffd99a] transition-colors"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="#f77f00"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M12 8v8M8 12h8"
                          stroke="#f77f00"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Add New Social Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Contact ── */}
            {tab === "contact" && (
              <div className="flex flex-col gap-5 sm:gap-6">
                <TagInput
                  label="Reach out to me for:"
                  placeholder="Type a keyword and press comma or Enter"
                  hint="Enter a comma after each tag"
                  tags={reachFor}
                  onAdd={(t) => setReachFor((prev) => [...prev, t])}
                  onRemove={(t) =>
                    setReachFor((prev) => prev.filter((x) => x !== t))
                  }
                />

                {/* Location */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Location</label>
                  <input
                    type="text"
                    placeholder="Enter your location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone number.."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Email</label>
                  <div className="relative">
                    <img
                      src={envelopeIcon}
                      alt=""
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>

                {/* Languages */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#18191c] text-sm">Languages</label>
                  <div className="relative">
                    <img
                      src={languageIcon}
                      alt=""
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Languages you speak"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="border-t border-[#f2f2f3] mt-6 sm:mt-8 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="border border-[#f77f00] text-[#f77f00] text-sm font-medium rounded-full px-5 py-2 hover:bg-[#fff6ed] transition-colors"
              >
                Skip Now
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#f77f00] text-white text-sm font-medium rounded-full px-6 py-2 hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
