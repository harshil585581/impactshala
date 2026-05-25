import helpIcon from "../../assets/images/svg/h-help.svg";

type Props = { onDismiss: () => void };

export default function HelpBox({ onDismiss }: Props) {
  return (
    <div className="bg-white border border-[#f2f2f3] rounded-[14px] p-4 flex flex-col gap-2 relative shadow-sm">
      <div className="flex items-start justify-between">
        <img src={helpIcon} alt="Help" className="w-10 h-10 object-contain" />
        <button
          onClick={onDismiss}
          className="text-[#9ca3af] hover:text-[#6b7280] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div>
        <p className="text-[#FF9400] text-lg font-bold leading-snug">Help Box</p>
        <p className="text-[#7c8493] text-sm mt-0.5 leading-relaxed">
          Not able to find what you're looking for? Let us help you.
        </p>
      </div>
      <button className="bg-[#FF9400] text-white text-sm font-semibold px-6 py-2 rounded-full w-fit hover:bg-[#e68500] transition-all shadow-md active:scale-95">
        Click Here
      </button>
    </div>
  );
}
