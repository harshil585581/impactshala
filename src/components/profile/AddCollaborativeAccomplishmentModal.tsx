import { useState, useRef, useEffect, useCallback } from 'react';
import type { CollaborativeAccomplishment, Collaborator } from '../../services/collaborativeAccomplishmentService';
import {
  createCollaborativeAccomplishment,
  updateCollaborativeAccomplishment,
  searchUsers,
} from '../../services/collaborativeAccomplishmentService';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

type Props = {
  accomplishment?: CollaborativeAccomplishment;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddCollaborativeAccomplishmentModal({ accomplishment, onClose, onSaved }: Props) {
  const isEdit = !!accomplishment;

  const [title, setTitle] = useState(accomplishment?.title ?? '');
  const [description, setDescription] = useState(accomplishment?.description ?? '');
  const [achievedMonth, setAchievedMonth] = useState(accomplishment?.achieved_month ?? '');
  const [achievedYear, setAchievedYear] = useState(accomplishment?.achieved_year ?? '');
  const [visibility, setVisibility] = useState<'public' | 'only_me' | 'community'>(
    accomplishment?.visibility ?? 'public',
  );
  const [collaborators, setCollaborators] = useState<Collaborator[]>(accomplishment?.collaborators ?? []);
  const [collabQuery, setCollabQuery] = useState('');
  const [collabSuggestions, setCollabSuggestions] = useState<Collaborator[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>(accomplishment?.media_urls ?? []);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const inp = 'w-full border border-[#e4e5e8] bg-white rounded-full px-4 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] h-[48px]';
  const sel = 'w-full border border-[#e4e5e8] bg-white rounded-full px-4 text-sm text-[#18191c] focus:outline-none focus:border-[#ff9400] h-[48px] appearance-none';

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (collabQuery.length < 2) { setCollabSuggestions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(collabQuery);
      const alreadyAdded = new Set(collaborators.map(c => c.id));
      setCollabSuggestions(results.filter(r => !alreadyAdded.has(r.id)));
    }, 300);
  }, [collabQuery, collaborators]);

  const addCollaborator = useCallback((c: Collaborator) => {
    setCollaborators(prev => [...prev, c]);
    setCollabQuery('');
    setCollabSuggestions([]);
  }, []);

  const removeCollaborator = useCallback((id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const total = mediaFiles.length + existingUrls.length;
    const slots = Math.max(0, 3 - total);
    const added = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, slots);
    setMediaFiles(prev => [...prev, ...added]);
  };

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const input = { title: title.trim(), collaborators, description: description || null,
        achieved_month: achievedMonth || null, achieved_year: achievedYear || null, visibility };
      if (isEdit) {
        await updateCollaborativeAccomplishment(accomplishment!.id, input, mediaFiles, existingUrls);
      } else {
        await createCollaborativeAccomplishment(input, mediaFiles);
      }
      onSaved();
      onClose();
    } catch {
      setSaving(false);
    }
  }

  const totalMedia = existingUrls.length + mediaFiles.length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[20px] w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 shrink-0">
          <h2 className="text-[#18191c] text-xl font-bold">
            {isEdit ? 'Edit Collaborative Accomplishment' : 'Collaborative Accomplishment'}
          </h2>
          <button onClick={onClose} className="text-[#18191c] hover:opacity-70 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="h-px bg-[#e4e5e8] mx-8" />
        <p className="text-[#9199a3] text-xs px-8 pt-3 shrink-0">* Indicates required</p>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-8 py-5 flex flex-col gap-5">

          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-[#18191c] text-sm font-semibold">
              Title<span className="text-red-500">*</span>
            </label>
            <input
              className={inp}
              placeholder="Ex: Launched a Community Clean up Drive"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Collaborators */}
          <div className="flex flex-col gap-2">
            <label className="text-[#18191c] text-sm font-semibold">Collaborators</label>

            {/* Selected tags */}
            {collaborators.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {collaborators.map(c => (
                  <span key={c.id} className="flex items-center gap-1.5 bg-[#fff8ee] border border-[#ffd9a0] text-[#ff9400] text-xs px-3 py-1.5 rounded-full">
                    {c.name}
                    <button onClick={() => removeCollaborator(c.id)} className="hover:text-red-500 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                className={inp}
                placeholder="Type a name to search users..."
                value={collabQuery}
                onChange={e => setCollabQuery(e.target.value)}
              />
              {collabSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-[#e4e5e8] rounded-2xl shadow-xl z-10 overflow-hidden">
                  {collabSuggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => addCollaborator(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#18191c] hover:bg-[#fff8ee] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#ff9400] flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">
                          {s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[#18191c] text-sm font-semibold">Descriptions</label>
            <textarea
              rows={4}
              placeholder="Ex: Describe the accomplishment and its impact..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={1000}
              className="w-full border border-[#e4e5e8] bg-white rounded-[20px] px-4 py-3 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] resize-none"
            />
            <p className="text-[#9199a3] text-xs text-right">{description.length}/1,000</p>
          </div>

          {/* Date of Accomplishment */}
          <div className="flex flex-col gap-2">
            <label className="text-[#18191c] text-sm font-semibold">Date of Accomplishment</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select className={sel} value={achievedMonth} onChange={e => setAchievedMonth(e.target.value)}>
                  <option value="">Month</option>
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9199a3" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div className="relative">
                <select className={sel} value={achievedYear} onChange={e => setAchievedYear(e.target.value)}>
                  <option value="">Year</option>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9199a3" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Supporting Media */}
          <div className="flex flex-col gap-2">
            <label className="text-[#18191c] text-sm font-semibold">Supporting Media</label>

            {/* Existing thumbnails */}
            {(existingUrls.length > 0 || mediaFiles.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-1">
                {existingUrls.map((url, i) => (
                  <div key={url} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#e4e5e8]">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setExistingUrls(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
                {mediaFiles.map((f, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#e4e5e8]">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {totalMedia < 3 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-[20px] p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  dragOver ? 'border-[#ff9400] bg-[#fff8ee]' : 'border-[#e4e5e8] hover:border-[#ff9400]'
                }`}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round"/>
                  <polyline points="17 8 12 3 7 8" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-[#5e6670] text-sm font-medium">Drop files here or click to upload</p>
                <p className="text-[#9199a3] text-xs">Max {3 - totalMedia} more file{3 - totalMedia !== 1 ? 's' : ''}, supported format JPG, PNG</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>

          {/* Visibility */}
          <div className="flex flex-col gap-2">
            <label className="text-[#18191c] text-sm font-semibold">Visibility</label>
            <div className="relative">
              <select
                className={sel}
                value={visibility}
                onChange={e => setVisibility(e.target.value as 'public' | 'only_me' | 'community')}
              >
                <option value="public">Public</option>
                <option value="community">Community</option>
                <option value="only_me">Only Me</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9199a3" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-5 flex justify-end shrink-0 border-t border-[#f2f2f3]">
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="h-[44px] px-10 bg-[#ff9400] text-white text-sm font-bold rounded-full hover:bg-[#e68500] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
