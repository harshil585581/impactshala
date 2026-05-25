import { useRef, useState, useCallback, useEffect } from "react";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbPct, setThumbPct] = useState(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartLeft = useRef(0);

  const THUMB_WIDTH = 0.25; // thumb is 25% of track width

  function updateThumb() {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setThumbPct(max > 0 ? el.scrollLeft / max : 0);
  }

  // Sync thumb when chips scroll
  function handleScroll() {
    updateThumb();
  }

  // Click on track → jump scroll
  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    const clickPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const max = el.scrollWidth - el.clientWidth;
    el.scrollLeft = clickPct * max;
  }

  // Drag thumb
  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartLeft.current = scrollRef.current?.scrollLeft ?? 0;

    function onMove(ev: MouseEvent) {
      if (!isDragging.current) return;
      const track = trackRef.current;
      const el = scrollRef.current;
      if (!track || !el) return;
      const trackW = track.clientWidth;
      const max = el.scrollWidth - el.clientWidth;
      const dx = ev.clientX - dragStartX.current;
      const scrollDelta = (dx / trackW) * max;
      el.scrollLeft = Math.max(0, Math.min(max, dragStartLeft.current + scrollDelta));
    }

    function onUp() {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  // Touch drag
  const handleThumbTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    dragStartX.current = e.touches[0].clientX;
    dragStartLeft.current = scrollRef.current?.scrollLeft ?? 0;

    function onMove(ev: TouchEvent) {
      if (!isDragging.current) return;
      const track = trackRef.current;
      const el = scrollRef.current;
      if (!track || !el) return;
      const trackW = track.clientWidth;
      const max = el.scrollWidth - el.clientWidth;
      const dx = ev.touches[0].clientX - dragStartX.current;
      const scrollDelta = (dx / trackW) * max;
      el.scrollLeft = Math.max(0, Math.min(max, dragStartLeft.current + scrollDelta));
    }

    function onEnd() {
      isDragging.current = false;
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    }

    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onEnd);
  }, []);

  // Scroll active chip into view when active changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = chips.indexOf(active);
    const btn = el.children[idx] as HTMLElement | undefined;
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    setTimeout(updateThumb, 300);
  }, [active, chips]);

  const thumbLeft = `${thumbPct * (100 - THUMB_WIDTH * 100)}%`;

  return (
    <div className="bg-white border border-border-default border-t-0 rounded-b-2xl px-4 pt-3 pb-4 mb-4">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar"
      >
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

      {/* Interactive scroll track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="mt-3 h-1.5 rounded-full bg-primary-light relative cursor-pointer select-none"
      >
        <div
          onMouseDown={handleThumbMouseDown}
          onTouchStart={handleThumbTouchStart}
          className="absolute top-0 h-full rounded-full bg-primary/60 cursor-grab active:cursor-grabbing transition-[left] duration-150"
          style={{ width: `${THUMB_WIDTH * 100}%`, left: thumbLeft }}
        />
      </div>
    </div>
  );
}
