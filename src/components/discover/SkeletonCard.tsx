export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-border-default overflow-hidden animate-pulse">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-border-default shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-border-default rounded w-36 mb-2" />
            <div className="h-3 bg-border-default rounded w-48 mb-1" />
            <div className="h-3 bg-border-default rounded w-20" />
          </div>
          <div className="h-7 w-24 bg-border-default rounded-full" />
        </div>
        <div className="h-5 bg-border-default rounded w-3/4 mb-3" />
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-28 bg-border-default rounded-full" />
          <div className="h-6 w-40 bg-border-default rounded" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="h-4 bg-border-default rounded w-24" />
          <div className="h-4 bg-border-default rounded w-28" />
          <div className="h-4 bg-border-default rounded w-32" />
          <div className="h-4 bg-border-default rounded w-36" />
        </div>
      </div>
      <div className="w-full h-[150px] bg-border-default" />
      <div className="px-5 py-4">
        <div className="h-4 bg-border-default rounded w-full mb-2" />
        <div className="h-4 bg-border-default rounded w-5/6 mb-4" />
        <div className="flex justify-around pt-3 border-t border-border-light">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-5 w-14 bg-border-default rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
