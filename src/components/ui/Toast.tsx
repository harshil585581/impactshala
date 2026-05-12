import type { Toast as ToastType } from '../../types/profile';

interface Props {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const icons = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#22c55e"/>
      <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#ef4444"/>
      <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#3b82f6"/>
      <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 bg-white border border-[#f2f2f3] rounded-[12px] shadow-[0px_8px_24px_rgba(0,0,0,0.12)] px-4 py-3 animate-[slideIn_0.2s_ease]"
        >
          {icons[t.type]}
          <p className="flex-1 text-[#18191c] text-sm">{t.message}</p>
          <button onClick={() => onRemove(t.id)} className="text-[#9ca3af] hover:text-[#6b7280]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
