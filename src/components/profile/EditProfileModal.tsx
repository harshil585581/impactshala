import { useState, useEffect } from "react";
import type {
  UserProfile,
  EditProfileForm,
  SocialLink,
} from "../../types/profile";

const SOCIAL_PLATFORMS = [
  "GitHub",
  "Behance / Dribbble",
  "Instagram",
  "Twitter / X",
  "Facebook",
  "Medium / Substack",
  "LinkedIn",
];

interface Props {
  profile: UserProfile;
  saving: boolean;
  onSave: (data: Partial<EditProfileForm>) => void;
  onClose: () => void;
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  function commit() {
    const v = input.trim().replace(/,/g, "");
    if (v && !tags.includes(v)) {
      onAdd(v);
      setInput("");
    }
  }
  return (
    <div className="min-h-[44px] border border-[#e4e5e8] bg-white rounded-full px-3 flex flex-wrap items-center gap-1.5 py-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1 bg-[#ffeacc] text-[#f77f00] text-xs rounded-full pl-2.5 pr-1.5 py-1"
        >
          {t}
          <button type="button" onClick={() => onRemove(t)}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
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
        className="flex-1 min-w-[80px] text-sm bg-transparent outline-none placeholder-[#9199a3]"
      />
    </div>
  );
}

const inputCls =
  "w-full h-[44px] border border-[#e4e5e8] rounded-full px-4 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors bg-white";
const labelCls = "text-[#374151] text-sm font-medium mb-1.5 block";

export default function EditProfileModal({
  profile,
  saving,
  onSave,
  onClose,
}: Props) {
  const [form, setForm] = useState<EditProfileForm>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    title: profile.title,
    company: profile.company,
    location: profile.location,
    bio: profile.bio,
    phone: profile.phone,
    languages: profile.languages,
    website: profile.website ?? "",
    skills: [...profile.skills],
    socialLinks: [...profile.socialLinks],
    reachFor: [...profile.reachFor],
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof EditProfileForm, string>>
  >({});
  const [activeSection, setActiveSection] = useState<
    "basic" | "skills" | "contact"
  >("basic");

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function set(field: keyof EditProfileForm, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  }

  function addSocialLink() {
    set("socialLinks", [
      ...form.socialLinks,
      { platform: "LinkedIn", url: "" },
    ]);
  }

  function removeSocialLink(idx: number) {
    set(
      "socialLinks",
      form.socialLinks.filter((_, i) => i !== idx),
    );
  }

  function updateSocialLink(
    idx: number,
    field: keyof SocialLink,
    value: string,
  ) {
    set(
      "socialLinks",
      form.socialLinks.map((l, i) =>
        i === idx ? { ...l, [field]: value } : l,
      ),
    );
  }

  const sections = [
    { id: "basic" as const, label: "Basic Info" },
    { id: "skills" as const, label: "Skills & Reach" },
    { id: "contact" as const, label: "Contact & Social" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Profile"
    >
      <div className="bg-white rounded-[20px] w-full max-w-[600px] max-h-[90vh] flex flex-col shadow-[0px_20px_60px_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3] shrink-0">
          <h2 className="text-[#18191c] text-lg font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#374151] transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-[#f77f00]"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-[#f2f2f3] px-6 shrink-0">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`text-sm font-medium py-3 px-4 border-b-2 transition-colors -mb-px ${
                activeSection === s.id
                  ? "border-[#f77f00] text-[#f77f00]"
                  : "border-transparent text-[#5e6670] hover:text-[#18191c]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          {/* Basic Info */}
          {activeSection === "basic" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelCls}>First Name *</label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className={`${inputCls} ${errors.firstName ? "border-red-400" : ""}`}
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Last Name *</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={`${inputCls} ${errors.lastName ? "border-red-400" : ""}`}
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Job Title / Role</label>
                <input
                  type="text"
                  placeholder="e.g. UI/UX Designer"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Company / Organisation</label>
                <input
                  type="text"
                  placeholder="e.g. Accenture"
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input
                  type="text"
                  placeholder="City, Country"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Bio</label>
                <textarea
                  placeholder="Write a short bio about yourself..."
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={4}
                  className="w-full border border-[#e4e5e8] rounded-[14px] px-4 py-3 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* Skills & Reach */}
          {activeSection === "skills" && (
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelCls}>Skills & Expertise</label>
                <p className="text-[#9199a3] text-xs mb-2">
                  Type and press comma or Enter to add
                </p>
                <TagInput
                  tags={form.skills}
                  onAdd={(t) => set("skills", [...form.skills, t])}
                  onRemove={(t) =>
                    set(
                      "skills",
                      form.skills.filter((s) => s !== t),
                    )
                  }
                  placeholder="Add a skill..."
                />
              </div>
              <div>
                <label className={labelCls}>Reach Out to Me For</label>
                <p className="text-[#9199a3] text-xs mb-2">
                  Topics or areas people can reach out to you for
                </p>
                <TagInput
                  tags={form.reachFor}
                  onAdd={(t) => set("reachFor", [...form.reachFor, t])}
                  onRemove={(t) =>
                    set(
                      "reachFor",
                      form.reachFor.filter((s) => s !== t),
                    )
                  }
                  placeholder="e.g. Mentorship, Collaboration..."
                />
              </div>
            </div>
          )}

          {/* Contact & Social */}
          {activeSection === "contact" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  type="tel"
                  placeholder="+91 00000 00000"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Languages</label>
                <input
                  type="text"
                  placeholder="e.g. English, Hindi"
                  value={form.languages}
                  onChange={(e) => set("languages", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Social Links</label>
                <div className="flex flex-col gap-2">
                  {form.socialLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={link.platform}
                        onChange={(e) =>
                          updateSocialLink(idx, "platform", e.target.value)
                        }
                        className="h-[44px] border border-[#e4e5e8] rounded-full px-3 text-sm text-[#18191c] bg-white focus:outline-none focus:border-[#f77f00] w-[150px] shrink-0"
                      >
                        {SOCIAL_PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <input
                        type="url"
                        placeholder="Profile URL..."
                        value={link.url}
                        onChange={(e) =>
                          updateSocialLink(idx, "url", e.target.value)
                        }
                        className={`${inputCls} flex-1`}
                      />
                      {form.socialLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSocialLink(idx)}
                          className="w-9 h-9 bg-[#f1f2f4] rounded-full flex items-center justify-center hover:bg-[#e4e5e8] transition-colors shrink-0"
                        >
                          <svg
                            width="14"
                            height="14"
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
                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="w-full h-[40px] bg-[#ffeacc] rounded-full flex items-center justify-center gap-2 text-sm font-medium text-[#18191c] hover:bg-[#ffd99a] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
                    Add Social Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#f2f2f3] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-[42px] px-6 border border-[#e4e5e8] text-[#5e6670] text-sm font-medium rounded-full hover:bg-[#f9fafb] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={saving}
            className="h-[42px] px-8 bg-[#f77f00] text-white text-sm font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray="31.4"
                  strokeDashoffset="10"
                />
              </svg>
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
