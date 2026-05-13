import { useState, useRef, useEffect } from 'react';
import { createEducation, updateEducation } from '../../services/educationService';
import type { Education, EducationInput } from '../../services/educationService';

type Props = {
  onClose: () => void;
  onSaved: () => void;
  education?: Education;
};

const EDUCATION_LEVELS = [
  'Middle School (Class 6–8)',
  'Secondary School (Class 9–10)',
  'Vocational / Diploma / ITI',
  'Higher Secondary (Class 11–12)',
  'Undergraduate (UG)',
  'Postgraduate (PG)',
  'PhD / Research',
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'community', label: 'My Community' },
  { value: 'only_me', label: 'Only Me' },
];

function LevelDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between border border-[#e4e5e8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ff9400] transition-colors bg-white"
      >
        <span className={value ? 'text-[#18191c]' : 'text-[#9199a3]'}>
          {value || "Ex: Bachelor's"}
        </span>
        <svg
          className={`text-[#9199a3] transition-transform ${open ? 'rotate-180' : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-[#e4e5e8] rounded-xl shadow-lg z-50 overflow-hidden">
          {EDUCATION_LEVELS.map(lvl => {
            const selected = lvl === value;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => { onChange(lvl); setOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center
                  ${selected
                    ? 'text-[#ff9400] font-medium border-l-[3px] border-[#ff9400] pl-[13px] bg-[#fffaf4]'
                    : 'text-[#5e6670] border-l-[3px] border-transparent hover:bg-[#f8f8f8]'
                  }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AddEducationModal({ onClose, onSaved, education }: Props) {
  const isEdit = !!education;

  const [level, setLevel] = useState(education?.level ?? '');
  const [school, setSchool] = useState(education?.school ?? '');
  const [grade, setGrade] = useState(education?.grade ?? '');
  const [fieldOfStudy, setFieldOfStudy] = useState(education?.field_of_study ?? '');
  const [startDate, setStartDate] = useState(education?.start_date ?? '');
  const [endDate, setEndDate] = useState(education?.end_date ?? '');
  const [visibility, setVisibility] = useState<'public' | 'only_me' | 'community'>(education?.visibility ?? 'public');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inp = 'w-full border border-[#e4e5e8] rounded-xl px-4 py-3 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] transition-colors';

  async function handleSave() {
    if (!school.trim()) { setError('School name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const input: EducationInput = {
        level: level || null,
        school: school.trim(),
        grade: grade.trim() || null,
        field_of_study: fieldOfStudy.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        visibility,
      };
      if (isEdit) {
        await updateEducation(education.id, input);
      } else {
        await createEducation(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f2f2f3] shrink-0">
          <h2 className="text-[#18191c] text-lg font-semibold">{isEdit ? 'Edit Education' : 'Add Education'}</h2>
          <button onClick={onClose} className="text-[#9199a3] hover:text-[#18191c] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <p className="text-[#9199a3] text-xs">* Indicates required</p>

          {/* Level */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Select the level of education</label>
            <LevelDropdown value={level} onChange={setLevel} />
          </div>

          {/* School */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inp}
              placeholder="Ex: Boston university"
              value={school}
              onChange={e => setSchool(e.target.value)}
            />
          </div>

          {/* Grade */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Grade</label>
            <input
              className={inp}
              placeholder="Ex: Business"
              value={grade}
              onChange={e => setGrade(e.target.value)}
            />
          </div>

          {/* Field of Study */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Field of Study</label>
            <input
              className={inp}
              placeholder="Ex: Business"
              value={fieldOfStudy}
              onChange={e => setFieldOfStudy(e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#18191c] font-medium">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className={`${inp} pr-10`}
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9199a3] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#18191c] font-medium">End Date (or expected)</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className={`${inp} pr-10`}
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9199a3] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f2f2f3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-[#5e6670]">
            <span>Visible To :</span>
            <div className="relative">
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as typeof visibility)}
                className="appearance-none bg-transparent text-[#18191c] font-medium pr-5 focus:outline-none cursor-pointer"
              >
                {VISIBILITY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg className="absolute right-0 top-1/2 -translate-y-1/2 text-[#9199a3] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-[40px] px-6 border border-[#ff9400] text-[#ff9400] text-sm font-semibold rounded-full hover:bg-[#fff8ee] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-[40px] px-8 bg-[#ff9400] text-white text-sm font-semibold rounded-full hover:bg-[#e68500] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
