function Shimmer({ className }: { className: string }) {
  return (
    <div className={`bg-gradient-to-r from-[#f0f0f0] via-[#e0e0e0] to-[#f0f0f0] bg-[length:400%_100%] animate-shimmer rounded ${className}`} />
  );
}

export default function PostCardSkeleton() {
  return (
    <div className="bg-white border border-[#ececec] rounded-2xl shadow-[0px_1px_1px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Shimmer className="w-11 h-11 rounded-full shrink-0" />
          <div className="flex flex-col gap-2">
            <Shimmer className="h-3.5 w-32 rounded" />
            <Shimmer className="h-3 w-44 rounded" />
            <Shimmer className="h-3 w-20 rounded" />
          </div>
        </div>
        <Shimmer className="h-7 w-16 rounded-full" />
      </div>

      {/* Body text */}
      <div className="px-6 pb-3 flex flex-col gap-2">
        <Shimmer className="h-3.5 w-full rounded" />
        <Shimmer className="h-3.5 w-5/6 rounded" />
        <Shimmer className="h-3.5 w-3/4 rounded" />
      </div>

      {/* Image placeholder */}
      <Shimmer className="mx-4 mb-4 h-52 rounded-xl" />

      {/* Reactions row */}
      <div className="px-6 py-2 flex items-center justify-between border-t border-[#f2f2f3]">
        <Shimmer className="h-4 w-20 rounded" />
        <Shimmer className="h-4 w-24 rounded" />
      </div>

      {/* Actions row */}
      <div className="px-2 py-1.5 flex items-center justify-around border-t border-[#f2f2f3]">
        {[1, 2, 3, 4].map(i => (
          <Shimmer key={i} className="h-8 w-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
