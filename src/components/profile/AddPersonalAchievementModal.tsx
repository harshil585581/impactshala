import { useState, useRef } from 'react';
import { createPersonalAchievement, updatePersonalAchievement } from '../../services/achievementService';
import type { PersonalAchievement } from '../../services/achievementService';

type Props = {
  onClose: () => void;
  onSaved: () => void;
  achievement?: PersonalAchievement;
};

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'community', label: 'My Community' },
  { value: 'only_me', label: 'Only Me' },
];

export default function AddPersonalAchievementModal({ onClose, onSaved, achievement }: Props) {
  const isEdit = !!achievement;

  const [title, setTitle] = useState(achievement?.title ?? '');
  const [description, setDescription] = useState(achievement?.description ?? '');
  const [achievedDate, setAchievedDate] = useState(achievement?.achieved_date ?? '');
  const [visibility, setVisibility] = useState<'public' | 'only_me' | 'community'>(achievement?.visibility ?? 'public');
  const [existingUrls, setExistingUrls] = useState<string[]>(achievement?.media_urls ?? []);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inp = 'w-full border border-[#e4e5e8] rounded-xl px-4 py-3 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] transition-colors';

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const previews = arr.map(f => URL.createObjectURL(f));
    setMediaFiles(prev => [...prev, ...arr]);
    setMediaPreviews(prev => [...prev, ...previews]);
  }

  function removeNewMedia(idx: number) {
    URL.revokeObjectURL(mediaPreviews[idx]);
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
    setMediaPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const input = { title: title.trim(), description: description.trim() || null, achieved_date: achievedDate || null, visibility };
      if (isEdit) {
        await updatePersonalAchievement(achievement.id, input, mediaFiles, existingUrls);
      } else {
        await createPersonalAchievement(input, mediaFiles);
      }
      mediaPreviews.forEach(p => URL.revokeObjectURL(p));
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
          <h2 className="text-[#18191c] text-lg font-semibold">{isEdit ? 'Edit Achievement' : 'Personal Achievement'}</h2>
          <button onClick={onClose} className="text-[#9199a3] hover:text-[#18191c] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <p className="text-[#9199a3] text-xs">* Indicates required</p>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className={inp}
              placeholder="Ex: Winner of National Science Olympiad 2004"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Descriptions</label>
            <textarea
              rows={4}
              placeholder="Ex: Briefly describe your achievements...."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={1000}
              className={`${inp} resize-none`}
            />
            <p className="text-[#9199a3] text-xs text-right">{description.length}/1,000</p>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Date of Achievement</label>
            <div className="relative">
              <input
                type="date"
                value={achievedDate}
                onChange={e => setAchievedDate(e.target.value)}
                className={`${inp} pr-10`}
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9199a3] pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Supporting Media */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Supporting Media</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="border border-[#e4e5e8] rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#ff9400] hover:bg-[#fffaf4] transition-colors"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 8 12 3 7 8" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[#9199a3] text-sm">Drop files here or click to upload</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {/* Existing media (edit mode) */}
            {existingUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {existingUrls.map((url, i) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-[#e4e5e8]"/>
                    <button
                      onClick={() => setExistingUrls(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New files previews */}
            {mediaPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {mediaPreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-16 h-16 object-cover rounded-lg border border-[#e4e5e8]"/>
                    <button
                      onClick={() => removeNewMedia(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Visibility</label>
            <div className="relative">
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as typeof visibility)}
                className={`${inp} appearance-none pr-10`}
              >
                {VISIBILITY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9199a3] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f2f2f3] flex justify-end shrink-0">
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
  );
}
