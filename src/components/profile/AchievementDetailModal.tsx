import { useState } from 'react';
import type { PersonalAchievement } from '../../services/achievementService';
import { deletePersonalAchievement } from '../../services/achievementService';
import AddPersonalAchievementModal from './AddPersonalAchievementModal';

type Props = {
  achievement: PersonalAchievement;
  onClose: () => void;
  onDeleted: () => void;
  isOwn: boolean;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AchievementDetailModal({ achievement, onClose, onDeleted, isOwn }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    if (!confirm('Remove this achievement?')) return;
    setDeleting(true);
    try {
      await deletePersonalAchievement(achievement.id);
      onDeleted();
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  if (editOpen) {
    return (
      <AddPersonalAchievementModal
        achievement={achievement}
        onClose={() => setEditOpen(false)}
        onSaved={() => { onDeleted(); onClose(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          {/* Trophy icon */}
          <div className="w-14 h-14 rounded-full bg-[#ff9400] flex items-center justify-center shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M8 21h8M12 17v4M7 4H4a2 2 0 00-2 2v2a4 4 0 004 4h.5M17 4h3a2 2 0 012 2v2a4 4 0 01-4 4h-.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 4h10v7a5 5 0 01-10 0V4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[#18191c] text-lg font-bold leading-snug">{achievement.title}</h2>
            {achievement.achieved_date && (
              <p className="text-[#9199a3] text-sm mt-0.5">
                Achieved on: {formatDate(achievement.achieved_date)}
              </p>
            )}
          </div>

          {/* 3-dot menu (owner only) */}
          <div className="flex items-center gap-2 shrink-0">
            {isOwn && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="w-8 h-8 rounded-full border border-[#ff9400] flex items-center justify-center text-[#ff9400] hover:bg-[#fff8ee] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-[calc(100%+4px)] bg-white rounded-xl shadow-lg border border-[#e4e5e8] z-50 overflow-hidden min-w-[120px]">
                      <button
                        onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#f8f8f8] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button onClick={onClose} className="text-[#9199a3] hover:text-[#18191c] transition-colors p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {achievement.description && (
          <div className="px-6 pb-4">
            <p className="text-[#5e6670] text-sm leading-relaxed">{achievement.description}</p>
          </div>
        )}

        {/* Media */}
        {achievement.media_urls && achievement.media_urls.length > 0 && (
          <div className="px-6 pb-6">
            <div className={`grid gap-2 ${achievement.media_urls.length === 1 ? 'grid-cols-1' : achievement.media_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {achievement.media_urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full h-[120px] object-cover rounded-xl"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
