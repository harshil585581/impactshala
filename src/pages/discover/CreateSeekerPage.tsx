import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import HelpBox from "../../components/discover/HelpBox";
import PromoCard from "../../components/discover/PromoCard";
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
  const [helpVisible, setHelpVisible] = useState(true);

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
              <select
                value={form.domain}
                onChange={(e) => {
                  set("domain", e.target.value);
                  set("nature", "");
                }}
                className="w-full border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Sub-category */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-text-medium mb-1">
                Select What You Are Looking For
              </p>
              <p className="text-xs text-text-muted mb-4">
                (Choose a category first then select keyword)
              </p>

              {subGroups.map((group) => (
                <div key={group.group} className="mb-5">
                  <label className="flex items-center gap-2 cursor-pointer mb-3 text-text-dark font-medium">
                    <input
                      type="radio"
                      name="group"
                      value={group.group}
                      checked={form.nature.startsWith(group.group)}
                      onChange={() =>
                        set(
                          "nature",
                          group.options[0]
                            ? `${group.group}:${group.options[0]}`
                            : group.group
                        )
                      }
                      className="accent-primary"
                    />
                    {group.group}
                  </label>

                  {group.options.length > 0 && (
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 pl-6">
                      {group.options.map((opt) => {
                        const val = `${group.group}:${opt}`;
                        return (
                          <label
                            key={opt}
                            className="flex items-center gap-2 text-sm text-text-medium cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="nature"
                              value={val}
                              checked={form.nature === val}
                              onChange={() => set("nature", val)}
                              className="accent-primary"
                            />
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
              ))}
            </div>

            {/* Target audience */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-text-medium mb-2">
                I am a / representing
              </p>
              <select
                value={form.targetAudience}
                onChange={(e) => set("targetAudience", e.target.value)}
                className="w-full border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
              >
                <option value="">Select type</option>
                {TARGET_AUDIENCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-text-medium mb-2">
                Level Targeted
              </p>
              <select
                value={form.educationalLevel}
                onChange={(e) => set("educationalLevel", e.target.value)}
                className="w-full border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
              >
                <option value="">Select type</option>
                {EDUCATIONAL_LEVELS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
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
                <select className="border border-border-default rounded-lg px-2 py-1 text-sm text-text-dark bg-white focus:outline-none focus:border-primary">
                  <option>Public</option>
                  <option>Community</option>
                </select>
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
          <div className="hidden lg:block w-[287px] shrink-0">
            <div className="flex flex-col gap-4 sticky top-[90px]">
              <div className="bg-white rounded-2xl border border-border-default overflow-hidden">
                <div className="h-16 bg-navy" />
                <div className="px-4 pb-4 -mt-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-border-default border-4 border-white mx-auto mb-2" />
                  <p className="font-semibold text-text-dark text-sm">Your Profile</p>
                </div>
              </div>
              <PromoCard />
              {helpVisible && <HelpBox onDismiss={() => setHelpVisible(false)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
