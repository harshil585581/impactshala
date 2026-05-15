import { useState } from 'react';
import type { CollaborativeAccomplishment } from '../../services/collaborativeAccomplishmentService';
import { deleteCollaborativeAccomplishment } from '../../services/collaborativeAccomplishmentService';
import AddCollaborativeAccomplishmentModal from './AddCollaborativeAccomplishmentModal';

type Props = {
  accomplishment: CollaborativeAccomplishment;
  onClose: () => void;
  onDeleted: () => void;
  isOwn: boolean;
};

function formatDate(month: string | null, year: string | null): string {
  if (!month && !year) return '';
  if (month && year) return `${month} ${year}`;
  return month || year || '';
}

export default function CollaborativeAccomplishmentDetailModal({ accomplishment, onClose, onDeleted, isOwn }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    if (!confirm('Remove this accomplishment?')) return;
    setDeleting(true);
    try {
      await deleteCollaborativeAccomplishment(accomplishment.id);
      onDeleted();
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  if (editOpen) {
    return (
      <AddCollaborativeAccomplishmentModal
        accomplishment={accomplishment}
        onClose={() => setEditOpen(false)}
        onSaved={() => { onDeleted(); onClose(); }}
      />
    );
  }

  const dateStr = formatDate(accomplishment.achieved_month, accomplishment.achieved_year);
  const collabs = accomplishment.collaborators ?? [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-[28px] w-full max-w-2xl shadow-2xl overflow-hidden border border-[#f2f2f3] max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-[#18191c] text-2xl font-bold leading-tight">{accomplishment.title}</h2>
              {dateStr && (
                <p className="text-[#9199a3] text-base mt-1">
                  Achieved on &nbsp; {dateStr}
                </p>
              )}
            </div>

            {/* 3-dot menu */}
            {isOwn && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="w-10 h-10 rounded-full bg-[#fff8ee] border border-[#ffd9a0] flex items-center justify-center text-[#ff9400] hover:bg-[#ffeacc] transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
          </div>

          {/* Collaborators */}
          {collabs.length > 0 && (
            <div className="mt-5">
              <p className="text-[#18191c] text-lg font-bold leading-snug">
                {collabs.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && <span className="font-normal text-[#18191c]"> and </span>}
                    <span className={i === collabs.length - 1 && collabs.length > 1 ? 'text-[#ff9400]' : 'text-[#18191c]'}>
                      {c.name}
                    </span>
                  </span>
                ))}
              </p>
            </div>
          )}

          {/* Description */}
          {accomplishment.description && (
            <p className="text-[#5e6670] text-base leading-relaxed mt-4">{accomplishment.description}</p>
          )}

          {/* Media */}
          {accomplishment.media_urls && accomplishment.media_urls.length > 0 && (
            <div className={`mt-6 grid gap-3 ${accomplishment.media_urls.length === 1 ? 'grid-cols-1' : accomplishment.media_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {accomplishment.media_urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full h-[180px] object-cover rounded-2xl border border-[#f2f2f3]"
                />
              ))}
            </div>
          )}

          {/* Bottom divider */}
          <div className="h-px bg-[#f2f2f3] mt-8" />
        </div>
      </div>
    </div>
  );
}
