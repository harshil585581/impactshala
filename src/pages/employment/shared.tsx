import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';

// ─── Shared type ──────────────────────────────────────────────────────────────

export type Visibility = 'Public' | 'Community';

// ─── Industry columns (identical in both Employer and Seeker forms) ───────────

export const INDUSTRIES_COL1 = [
  'Agriculture & Agribusiness', 'Aerospace & Defense', 'Architecture & Design',
  'Arts & Culture (Museums, Galleries)', 'Automotive', 'Aviation',
  'Banking & Finance', 'Biotechnology', 'Chemicals',
  'Consumer Electronics', 'Construction', 'Consulting Services',
  'Cyber Security', 'Defense Manufacturing', 'Digital Marketing & Advertising',
  'Education & EdTech', 'Energy & Utilities', 'Entertainment & Media',
];

export const INDUSTRIES_COL2 = [
  'Environmental Services & Sustainability', 'Fashion & Apparel',
  'Fintech & Financial Services', 'Food & Beverage', 'Healthcare Services',
  'Hospitality & Tourism', 'Human Resources & Staffing',
  'Information Technology (IT)', 'Insurance', 'Legal Services',
  'Logistics & Supply Chain', 'Manufacturing', 'Marine & Shipping',
  'Marketing & Advertising', 'Metals & Mining', 'Oil & Gas',
  'Packaging', 'Pharmaceuticals',
];

export const INDUSTRIES_COL3 = [
  'Printing & Publishing', 'Public Relations', 'Real Estate',
  'Retail & E-Commerce', 'Security & Investigations', 'Events & Entertainment',
  'Sports Management', 'Social Work', 'Textiles & Apparel',
  'Travel & Tourism', 'Venture Capital & Private Equity',
  'Warehousing', 'Others',
];

// ─── Shared UI components ─────────────────────────────────────────────────────

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[#18191c] text-sm font-medium mb-2">{children}</p>;
}

export function TextInput({
  label, value, onChange, placeholder, className, error,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string; error?: string;
}) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ''}
        className={cn(
          'w-full h-12 bg-white border rounded-full px-4 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none transition-colors',
          error ? 'border-red-400 focus:border-red-500' : 'border-[#e4e5e8] focus:border-[#f77f00]',
        )}
      />
      {error && <p className="text-xs text-red-500 mt-1 px-2">{error}</p>}
    </div>
  );
}

export function SelectDropdown({
  label, value, options, placeholder, onChange, className,
}: {
  label?: string; value: string; options: string[]; placeholder?: string;
  onChange: (v: string) => void; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, []);

  return (
    <div className={className} ref={ref}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full h-12 bg-white border border-[#e4e5e8] rounded-full flex items-center justify-between px-4 focus:outline-none focus:border-[#f77f00] transition-colors"
        >
          <span className={cn('text-sm truncate', value ? 'text-[#18191c]' : 'text-[#9f9f9f]')}>
            {value || placeholder || 'Select'}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            className={cn('shrink-0 transition-transform ml-2', open && 'rotate-180')}>
            <path d="M6 9l6 6 6-6" stroke="#9f9f9f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 bg-white border border-[#e4e5e8] rounded-2xl shadow-lg max-h-52 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  'w-full text-left px-4 py-3 text-sm hover:bg-[#fff8ee] transition-colors',
                  opt === value
                    ? 'text-[#f77f00] font-semibold border-l-4 border-[#f77f00]'
                    : 'text-[#6b6b6b] border-l-4 border-transparent',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function IndustrySelectorGrid({
  value, onChange,
}: {
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="border border-[#e4e5e8] rounded-2xl overflow-hidden">
      <div className="h-[280px] overflow-y-auto">
        <div className="grid grid-cols-3 divide-x divide-[#f2f2f3]">
          {[INDUSTRIES_COL1, INDUSTRIES_COL2, INDUSTRIES_COL3].map((col, ci) => (
            <div key={ci} className="flex flex-col">
              {col.map((item) => (
                <label
                  key={item}
                  className="flex items-center justify-between gap-2 px-3 py-3 cursor-pointer hover:bg-[#fafafa] border-b border-[#f2f2f3] last:border-b-0 group"
                >
                  <span className="text-xs text-[#18191c] leading-snug">{item}</span>
                  <input
                    type="radio"
                    name="industry"
                    value={item}
                    checked={value === item}
                    onChange={() => onChange(item)}
                    className="sr-only"
                  />
                  <span className={cn(
                    'w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                    value === item ? 'border-[#f77f00]' : 'border-[#c7c7c7] group-hover:border-[#f77f00]/50',
                  )}>
                    {value === item && <span className="w-[8px] h-[8px] rounded-full bg-[#f77f00]" />}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProgressBar({ pct, complete }: { pct: number; complete?: boolean }) {
  return (
    <div className="mb-6">
      <div className="relative pt-7">
        {complete ? (
          <div className="absolute right-0 top-0 w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div
            className="absolute top-0 bg-[#1d3557] text-white text-[11px] font-semibold px-2 py-0.5 rounded"
            style={{ left: `${pct}%`, transform: pct > 0 ? 'translateX(-50%)' : 'translateX(0)' }}
          >
            {pct}%
          </div>
        )}
        <div className="h-[6px] bg-[#e5e7eb] rounded-full">
          <div
            className="h-full bg-[#1d3557] rounded-full transition-all duration-500"
            style={{ width: `${complete ? 100 : pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function VisibilityToggle({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm focus:outline-none"
      >
        <span className="text-[#6b6b6b]">Visible To :</span>
        <span className="text-[#18191c] font-semibold">{value}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          className={cn('transition-transform', open && 'rotate-180')}>
          <path d="M6 9l6 6 6-6" stroke="#18191c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 bg-white border border-[#e4e5e8] rounded-2xl shadow-lg overflow-hidden z-30">
          {(['Public', 'Community'] as Visibility[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                'w-full text-left flex items-center gap-1 px-4 py-3 text-sm hover:bg-[#fff8ee] transition-colors',
                opt === value ? 'text-[#f77f00] font-semibold border-l-4 border-[#f77f00]' : 'text-[#6b6b6b] border-l-4 border-transparent',
              )}
            >
              {opt}
              <span className={cn('text-xs font-normal ml-1', opt === value ? 'text-[#f77f00]' : 'text-[#9f9f9f]')}>
                — {opt === 'Public' ? 'seen to everyone' : 'seen to community only'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { default as RightPanel } from '../../components/RightPanel';
