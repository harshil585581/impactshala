import { useState, useRef, useEffect } from "react";

type Option = { label: string; value: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  compact?: boolean;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select type",
  className = "",
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className={`relative ${compact ? "inline-block" : ""} ${className}`} ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? "border border-border-default rounded-lg px-2 py-1 text-sm text-text-dark bg-white focus:outline-none focus:border-primary flex items-center gap-1.5 whitespace-nowrap"
            : "w-full border border-border-default rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary flex items-center justify-between gap-2 min-h-[44px]"
        }
      >
        <span className={selected ? "text-text-dark" : "text-text-muted"}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute top-full mt-1 bg-white border border-border-default rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto ${compact ? "right-0 min-w-[120px]" : "left-0 right-0"}`}>
          {options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-5 py-3.5 text-sm relative transition-colors ${
                  active ? "text-primary font-medium" : "text-text-muted hover:bg-border-light"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full" />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
