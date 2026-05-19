import { useState } from 'react';
import type { PersonalAchievement } from '../../services/achievementService';
import { deletePersonalAchievement } from '../../services/achievementService';
import AddPersonalAchievementModal from './AddPersonalAchievementModal';
import cup1Svg from '../../assets/images/svg/cup1.svg';

type Props = {
  achievements: PersonalAchievement[];
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

function AchievementItem({
  achievement,
  isOwn,
  onDeleted,
  onEdit,
}: {
  achievement: PersonalAchievement;
  isOwn: boolean;
  onDeleted: () => void;
  onEdit: (a: PersonalAchievement) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Remove this achievement?')) return;
    setDeleting(true);
    try {
      await deletePersonalAchievement(achievement.id);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="py-5 px-6">
      <div className="flex items-start gap-4">
        <img src={cup1Svg} alt="achievement" className="w-12 h-12 shrink-0 object-contain" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[#18191c] font-bold text-base leading-snug">{achievement.title}</p>
              {achievement.achieved_date && (
                <p className="text-[#9199a3] text-sm mt-0.5">
                  Achieved on: {formatDate(achievement.achieved_date)}
                </p>
              )}
            </div>

            {isOwn && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#9199a3] hover:text-[#18191c] hover:bg-[#f5f5f5] transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-[calc(100%+4px)] bg-white rounded-xl shadow-xl border border-[#e4e5e8] z-50 overflow-hidden min-w-[130px] py-1">
                      <button
                        onClick={() => { setMenuOpen(false); onEdit(achievement); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#18191c] hover:bg-[#f8f8f8] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {achievement.description && (
            <p className="text-[#5e6670] text-sm leading-relaxed mt-2">{achievement.description}</p>
          )}

          {achievement.media_urls && achievement.media_urls.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {achievement.media_urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-24 h-24 object-cover rounded-xl border border-[#f2f2f3] shrink-0"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllAchievementsModal({ achievements, onClose, onDeleted, isOwn }: Props) {
  const [editTarget, setEditTarget] = useState<PersonalAchievement | null>(null);

  if (editTarget) {
    return (
      <AddPersonalAchievementModal
        achievement={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => { onDeleted(); setEditTarget(null); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl border border-[#f2f2f3] flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#f2f2f3] shrink-0">
          <h2 className="text-[#18191c] text-lg font-bold">
            My Achievements <span className="text-[#9199a3] font-normal text-base">({achievements.length})</span>
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#f2f2f3] flex items-center justify-center text-[#9199a3] hover:text-[#18191c] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#f2f2f3]">
          {achievements.length === 0 ? (
            <p className="text-[#9199a3] text-sm text-center py-10">No achievements added yet.</p>
          ) : (
            achievements.map((a) => (
              <AchievementItem
                key={a.id}
                achievement={a}
                isOwn={isOwn}
                onDeleted={onDeleted}
                onEdit={setEditTarget}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
