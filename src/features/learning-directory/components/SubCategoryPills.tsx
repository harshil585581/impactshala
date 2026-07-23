import { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/cn';

export type GradeLevel =
  | ''
  | 'pre_school'
  | 'primary'
  | 'secondary'
  | 'senior_secondary'
  | 'high_school';

export interface SubCategoryPillsProps {
  value: GradeLevel;
  onChange: (next: GradeLevel) => void;
  className?: string;
}

const OPTIONS = [
  { value: 'pre_school',       label: 'Pre-School (Pre K - UKG)' },
  { value: 'primary',          label: 'Primary School (Grade 1 to 4)' },
  { value: 'secondary',        label: 'Secondary School (Grade 5 to 7)' },
  { value: 'senior_secondary', label: 'Senior Secondary School (Grade 8 to 10)' },
  { value: 'high_school',      label: 'High School (Grade 11 to 12)' },
] as const satisfies readonly { value: GradeLevel; label: string }[];

export default function SubCategoryPills({
  value,
  onChange,
  className,
}: SubCategoryPillsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dragging: false, startX: 0, scrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = listRef.current;
    if (!el) return;
    dragRef.current = { dragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging || !listRef.current) return;
    e.preventDefault();
    const x = e.pageX - listRef.current.offsetLeft;
    listRef.current.scrollLeft = dragRef.current.scrollLeft - (x - dragRef.current.startX);
  };

  const stopDrag = () => {
    dragRef.current.dragging = false;
    setIsDragging(false);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number | null = null;
      if (e.key === 'ArrowRight') nextIndex = (index + 1) % OPTIONS.length;
      else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + OPTIONS.length) % OPTIONS.length;
      else if (e.key === 'Home') nextIndex = 0;
      else if (e.key === 'End') nextIndex = OPTIONS.length - 1;

      if (nextIndex !== null) {
        e.preventDefault();
        onChange(OPTIONS[nextIndex].value);
        listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
      }
    },
    [onChange],
  );

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Grade level"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      className={cn(
        'flex gap-3 w-full overflow-x-auto pb-1 select-none no-scrollbar',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className,
      )}
    >
      {OPTIONS.map((opt, i) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive || (!value && i === 0) ? 0 : -1}
            onClick={() => !dragRef.current.dragging && onChange(isActive ? '' : opt.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-5 py-2',
              'text-sm font-semibold transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f77f00] focus-visible:ring-offset-2',
              isActive
                ? 'bg-[#f77f00] text-white border border-[#f77f00]'
                : 'bg-white border border-[#f77f00] text-[#f77f00] hover:bg-[#fff8ee]',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
