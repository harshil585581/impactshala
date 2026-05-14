import { useState, useRef } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-[28px] w-full max-w-2xl shadow-2xl overflow-hidden border border-[#f2f2f3]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-5 px-8 pt-8 pb-6">
          {/* Trophy icon */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff9400] to-[#ff7b00] flex items-center justify-center shrink-0 shadow-lg shadow-orange-200">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M8 21h8M12 17v4M7 4H4a2 2 0 00-2 2v2a4 4 0 004 4h.5M17 4h3a2 2 0 012 2v2a4 4 0 01-4 4h-.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 4h10v7a5 5 0 01-10 0V4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[#18191c] text-2xl font-bold leading-tight">{achievement.title}</h2>
            {achievement.achieved_date && (
              <p className="text-[#9199a3] text-base mt-1">
                Achieved on: {formatDate(achievement.achieved_date)}
              </p>
            )}
          </div>

          {/* 3-dot menu (owner only) */}
          <div className="flex items-center gap-3 shrink-0">
            {isOwn && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="w-10 h-10 rounded-full border border-[#ff9400] flex items-center justify-center text-[#ff9400] hover:bg-[#fff8ee] transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-2xl shadow-xl border border-[#e4e5e8] z-50 overflow-hidden min-w-[140px] py-1">
                      <button
                        onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                        className="w-full text-left px-5 py-3 text-sm font-medium text-[#18191c] hover:bg-[#f8f8f8] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="w-full text-left px-5 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-full border border-[#f2f2f3] flex items-center justify-center text-[#9199a3] hover:text-[#18191c] transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {achievement.description && (
          <div className="px-8 pb-6">
            <p className="text-[#5e6670] text-base leading-relaxed">{achievement.description}</p>
          </div>
        )}

        {/* Media */}
        {achievement.media_urls && achievement.media_urls.length > 0 && (
          <div className="px-8 pb-8">
            <div className="relative group/slider">
              <div 
                ref={scrollRef}
                className="flex gap-5 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory scroll-smooth"
              >
                {achievement.media_urls.map((url, i) => (
                  <div key={i} className="min-w-[calc(50%-10px)] h-[280px] snap-start shrink-0">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover rounded-[24px] border border-[#f2f2f3] shadow-md hover:border-[#ff9400] transition-all duration-300"
                    />
                  </div>
                ))}
              </div>
              
              {/* Functional Arrows */}
              {achievement.media_urls.length > 2 && (
                <>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                    className="absolute inset-y-0 -left-6 flex items-center z-20"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-[#ff9400] border border-[#f2f2f3] hover:scale-110 active:scale-95 transition-all cursor-pointer pointer-events-auto">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </div>
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                    className="absolute inset-y-0 -right-6 flex items-center z-20"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-[#ff9400] border border-[#f2f2f3] hover:scale-110 active:scale-95 transition-all cursor-pointer pointer-events-auto">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </button>
                </>
              )}

              {/* Dots at bottom */}
              <div className="flex justify-center gap-2 mt-4">
                {achievement.media_urls.map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 h-2 rounded-full bg-[#ff9400]/20 transition-colors"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
