import { useState } from "react";
import type { FilterState } from "../../hooks/useDiscover";

type Props = {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
};

const SECTIONS: { key: keyof FilterState; label: string; options: string[] }[] =
  [
    {
      key: "subCategory",
      label: "Sub Category",
      options: [
        "Guest Lecture",
        "Workshop",
        "Experiential Learning",
        "Field Trip",
        "Mentorship",
        "Others",
      ],
    },
    {
      key: "deliveryMode",
      label: "Delivery Mode",
      options: ["Onsite", "Online", "Hybrid"],
    },
    {
      key: "payment",
      label: "Payment",
      options: ["Free", "Paid", "Negotiable"],
    },
    {
      key: "levelOfParticipant",
      label: "Level of participant",
      options: [
        "Pre-primary",
        "Primary (1-5)",
        "Middle School (6-8)",
        "High School (9-12)",
        "College/University",
        "Open to All",
      ],
    },
  ];

export default function FilterPanel({ filters, onChange, onApply, onReset }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-border-default p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-text-dark font-semibold text-base">Filter</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M7 12h10M10 18h4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.key} className="border-t border-border-light py-3">
          <button
            onClick={() =>
              setExpanded((prev) =>
                prev === section.key ? null : section.key
              )
            }
            className="w-full flex items-center justify-between text-text-medium text-sm font-medium min-h-[44px]"
          >
            {section.label}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-transform duration-200 ${
                expanded === section.key ? "rotate-180" : ""
              }`}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="#374151"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {expanded === section.key && (
            <div className="mt-2 flex flex-col gap-1.5 pl-1">
              {section.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-text-medium">
                  <input
                    type="radio"
                    name={section.key}
                    value={opt}
                    checked={filters[section.key] === opt}
                    onChange={() =>
                      onChange({ ...filters, [section.key]: opt })
                    }
                    className="accent-primary"
                  />
                  {opt}
                </label>
              ))}
              {filters[section.key] && (
                <button
                  onClick={() => onChange({ ...filters, [section.key]: "" })}
                  className="text-xs text-text-muted hover:text-primary mt-1 text-left"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-2 pt-3 border-t border-border-light">
        <button
          onClick={onApply}
          className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-full text-sm hover:bg-orange-600 transition-colors min-h-[44px]"
        >
          Apply
        </button>
        <button
          onClick={onReset}
          className="flex-1 border border-primary text-primary font-semibold py-2.5 rounded-full text-sm hover:bg-primary-light transition-colors min-h-[44px]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
