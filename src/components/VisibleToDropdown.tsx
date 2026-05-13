import { useState, useRef, useEffect } from 'react';
import type { PostVisibility } from '../services/postService';

const OPTIONS: { value: PostVisibility; label: string; sub: string }[] = [
  { value: 'public',    label: 'Public',       sub: 'show to everyone in web'   },
  { value: 'community', label: 'My Community', sub: 'show to my community only' },
];

type Props = {
  value: PostVisibility;
  onChange: (v: PostVisibility) => void;
};

export function VisibleToDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const selected = OPTIONS.find(o => o.value === value)!;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className="flex flex-col items-start text-left">
        <div className="flex items-center gap-1">
          <span className="text-[#374151] text-sm">Visible To: </span>
          <span className="text-[#374151] text-sm font-semibold">{selected.label}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-[#9ca3af] text-xs">{selected.sub}</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-50 min-w-[270px] overflow-hidden">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-3 transition-colors hover:bg-[#fff8ee] ${value === opt.value ? 'bg-[#fff8ee]' : ''}`}
            >
              <span className="font-semibold text-[#374151] text-sm">{opt.label}:</span>
              <span className="text-[#6b7280] text-sm"> {opt.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
