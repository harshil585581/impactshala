import { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/cn';

export type AcademicLevel =
  | ''
  | 'high_school'
  | 'diploma'
  | 'under_graduate'
  | 'post_graduate'
  | 'phd';

export interface CollegeSubCategoryPillsProps {
  value: AcademicLevel;
  onChange: (next: AcademicLevel) => void;
  className?: string;
}

const OPTIONS = [
  { value: 'high_school',    label: 'High School (Grade 11 to 12)' },
  { value: 'diploma',        label: 'Diploma' },
  { value: 'under_graduate', label: 'Under Graduate' },
  { value: 'post_graduate',  label: 'Post Graduate' },
  { value: 'phd',            label: 'PhD' },
] as const satisfies readonly { value: AcademicLevel; label: string }[];

export default function CollegeSubCategoryPills({
  value,
  onChange,
  className,
}: CollegeSubCategoryPillsProps) {
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

      if (e.key === 'ArrowRight') {
        nextIndex = (index + 1) % OPTIONS.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (index - 1 + OPTIONS.length) % OPTIONS.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = OPTIONS.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        onChange(OPTIONS[nextIndex].value);
        const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons?.[nextIndex]?.focus();
      }
    },
    [onChange],
  );

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Academic level"
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
