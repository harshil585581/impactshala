type Props = { onDismiss: () => void };

export default function HelpBox({ onDismiss }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-border-default p-4 relative">
      <button
        onClick={onDismiss}
        aria-label="Dismiss help box"
        className="absolute top-3 right-3 p-1 hover:bg-border-light rounded-full transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex items-start gap-2 pr-6">
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <span className="text-lg">📝</span>
        </div>
        <div>
          <p className="font-bold text-primary text-sm">Help Box</p>
          <p className="text-text-medium text-xs mt-0.5 leading-relaxed">
            Not able to find what you're looking for? Let us help you.
          </p>
        </div>
      </div>

      <button className="mt-3 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-orange-600 transition-colors min-h-[44px]">
        Click Here
      </button>
    </div>
  );
}
