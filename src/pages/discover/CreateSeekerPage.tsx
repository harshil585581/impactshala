import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import DiscoverSidePanel from "../../components/discover/DiscoverSidePanel";
import CustomSelect from "../../components/ui/CustomSelect";
import {
  DOMAINS,
  DOMAIN_SUBGROUPS,
  TARGET_AUDIENCE_OPTIONS,
  EDUCATIONAL_LEVELS,
} from "./subcategories";

export type SeekerFormStep1 = {
  domain: string;
  nature: string;
  keyword: string;
  targetAudience: string;
  educationalLevel: string;
};

export default function CreateSeekerPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visibleTo, setVisibleTo] = useState("Public");

  const [form, setForm] = useState<SeekerFormStep1>({
    domain: "Education",
    nature: "",
    keyword: "",
    targetAudience: "",
    educationalLevel: "",
  });

  const subGroups = DOMAIN_SUBGROUPS[form.domain] ?? [];

  function set<K extends keyof SeekerFormStep1>(
    key: K,
    value: SeekerFormStep1[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNext() {
    navigate("/discover/create/seeker/details", { state: { step1: form } });
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">

          {/* ── Main form ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-border-default p-6">
            <h1 className="text-text-dark font-bold text-lg mb-5">
              What are you looking for?
            </h1>

            {/* Domain */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-text-medium mb-2">
                Choose the Domain
              </p>
              <CustomSelect
                value={form.domain}
                onChange={(v) => { set("domain", v); set("nature", ""); }}
                options={DOMAINS.map((d) => ({ label: d, value: d }))}
              />
            </div>

            {/* Sub-category */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-text-medium mb-1">
                Select What You Are Looking For
              </p>
              <p className="text-xs text-text-muted mb-4">
                (Choose a category first then select keyword)
              </p>

              {subGroups.map((group) => {
                const groupChecked = form.nature.startsWith(group.group);
                return (
                <div key={group.group} className="mb-5">
                  <label className={`flex items-center gap-2 cursor-pointer mb-3 font-medium ${groupChecked ? "text-primary" : "text-text-dark"}`}>
                    <input
                      type="radio"
                      name="group"
                      value={group.group}
                      checked={groupChecked}
                      onChange={() =>
                        set(
                          "nature",
                          group.options[0]
                            ? `${group.group}:${group.options[0]}`
                            : group.group
                        )
                      }
                      className="sr-only"
                    />
                    <span className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${groupChecked ? "border-primary" : "border-border-default"}`}>
                      <span className={`w-[8px] h-[8px] rounded-full transition-colors ${groupChecked ? "bg-primary" : ""}`} />
                    </span>
                    {group.group}
                  </label>

                  {group.options.length > 0 && (
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 pl-6">
                      {group.options.map((opt) => {
                        const val = `${group.group}:${opt}`;
                        const optChecked = form.nature === val;
                        return (
                          <label
                            key={opt}
                            className="flex items-center gap-2 text-sm text-text-medium cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="nature"
                              value={val}
                              checked={optChecked}
                              onChange={() => set("nature", val)}
                              className="sr-only"
                            />
                            <span className={`w-[16px] h-[16px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${optChecked ? "border-primary" : "border-border-default"}`}>
                              <span className={`w-[7px] h-[7px] rounded-full transition-colors ${optChecked ? "bg-primary" : ""}`} />
                            </span>
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {group.options.length === 0 && group.group === "Others" && (
                    <div className="pl-6">
                      <input
                        type="text"
                        placeholder="Enter keyword"
                        value={form.keyword}
                        onChange={(e) => set("keyword", e.target.value)}
                        className="w-full border border-border-default rounded-xl px-4 py-2 text-sm text-text-dark focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>
              );})}

            </div>

            {/* Target audience */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-text-medium mb-2">
                I am a / representing
              </p>
              <CustomSelect
                value={form.targetAudience}
                onChange={(v) => set("targetAudience", v)}
                options={TARGET_AUDIENCE_OPTIONS.map((o) => ({ label: o, value: o }))}
              />
            </div>

            {/* Level */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-text-medium mb-2">
                Level Targeted
              </p>
              <CustomSelect
                value={form.educationalLevel}
                onChange={(v) => set("educationalLevel", v)}
                options={EDUCATIONAL_LEVELS.map((o) => ({ label: o, value: o }))}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <button
                onClick={() => navigate("/discover")}
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
                  disabled={!form.nature && !form.keyword}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  Next
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
