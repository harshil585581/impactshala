export const CATEGORY_CHIPS = [
  "Job Ready Exposures",
  "Education",
  "Social Impact",
  "Startup & Grants",
  "Talent & Sports",
  "Meetups & Competitions",
];

type Props = {
  chips?: string[];
  active: string;
  onChange: (chip: string) => void;
};

export default function CategoryChips({
  chips = CATEGORY_CHIPS,
  active,
  onChange,
}: Props) {
  const activeIndex = chips.indexOf(active);
  const pct = chips.length > 1 ? (activeIndex / (chips.length - 1)) * 100 : 0;

  return (
    <div className="bg-white border border-border-default border-t-0 rounded-b-2xl px-4 pt-3 pb-4 mb-4">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {chips.map((chip) => (
          <button
            key={chip}
            onClick={() => onChange(chip)}
            aria-pressed={active === chip}
            className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap shrink-0 transition-colors min-h-[44px] ${
              active === chip
                ? "bg-primary text-white border-primary"
                : "bg-white text-primary border-primary hover:bg-primary-light"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Slider indicator */}
      <div className="mt-3 h-1.5 rounded-full bg-primary-light relative overflow-hidden">
        <div
          className="absolute top-0 h-full w-1/4 rounded-full bg-primary/50 transition-[left] duration-300"
          style={{ left: `calc(${pct}% - ${pct / 4}%)` }}
        />
      </div>
    </div>
  );
}
