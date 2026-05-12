import type { ProfileStats as Stats } from "../../types/profile";

export default function ProfileStats({ stats }: { stats: Stats }) {
  return (
    <div className="bg-white rounded-[14px] border border-[#f2f2f3] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] px-6 py-5">
      <div className="flex items-center justify-around">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[#f77f00] text-xl sm:text-2xl font-bold">
            {stats.recommendations}
          </span>
          <span className="text-[#18191c] text-xs sm:text-sm font-medium text-center">
            Recommendations
          </span>
        </div>
        <div className="w-px h-10 bg-[#f77f00]" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[#f77f00] text-xl sm:text-2xl font-bold">
            {stats.credibility}
          </span>
          <span className="text-[#18191c] text-xs sm:text-sm font-medium text-center">
            Credibility
          </span>
        </div>
        <div className="w-px h-10 bg-[#f77f00]" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[#f77f00] text-xl sm:text-2xl font-bold">
            {stats.achievement}
          </span>
          <span className="text-[#18191c] text-xs sm:text-sm font-medium text-center">
            Achievement
          </span>
        </div>
      </div>
    </div>
  );
}
