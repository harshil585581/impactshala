import type { Review } from '../../services/reviewService';

interface Props {
  reviews: Review[];
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days >= 1) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours >= 1) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? '#ff9400' : '#e4e5e8'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewerAvatar({ reviewer }: { reviewer: Review['reviewer'] }) {
  if (reviewer?.avatar_url) {
    return (
      <img
        src={reviewer.avatar_url}
        alt=""
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
    );
  }
  const initials = reviewer
    ? `${reviewer.first_name?.[0] ?? ''}${reviewer.last_name?.[0] ?? ''}`.toUpperCase() || '?'
    : '?';
  return (
    <div className="w-10 h-10 rounded-full bg-[#ff9400] flex items-center justify-center text-white text-sm font-semibold shrink-0">
      {initials}
    </div>
  );
}

export default function ReviewsPreviewModal({ reviews, onClose }: Props) {
  const avg =
    reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  const dist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: reviews.length ? (count / reviews.length) * 100 : 0 };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0">
          <h2 className="text-[#121212] text-2xl font-semibold">Credibility</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-[#18191c] hover:text-[#ff9400] transition-colors rounded-full hover:bg-[#fff5e8]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="h-px bg-[#f2f2f3] shrink-0" />

        {/* Scrollable content */}
        <div
          className="overflow-y-auto px-8 py-6 flex flex-col gap-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#ffb044 #fff5e8',
          }}
        >
          {reviews.length === 0 ? (
            <p className="text-[#9199a3] text-sm text-center py-8">No reviews yet.</p>
          ) : (
            <>
              {/* Rating summary */}
              <div className="flex items-start gap-8">
                <div className="flex flex-col items-start gap-2 min-w-[90px]">
                  <span className="text-[#191919] text-[32px] font-semibold leading-none">{avg.toFixed(1)}</span>
                  <StarDisplay rating={Math.round(avg)} size={18} />
                  <span className="text-[#bdbdbd] text-sm">({reviews.length.toLocaleString()})</span>
                </div>
                <div className="flex flex-col gap-3 flex-1 mt-1">
                  {dist.map(({ star, pct }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs text-[#818181] w-3 text-right">{star}</span>
                      <div className="flex-1 h-[7px] bg-[#d9d9d9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ff9400] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#f2f2f3]" />

              {/* Reviews list */}
              <div className="flex flex-col gap-6">
                {reviews.map((review, idx) => {
                  const name = review.reviewer
                    ? (
                        `${review.reviewer.first_name ?? ''} ${review.reviewer.last_name ?? ''}`.trim() ||
                        review.reviewer.org_name ||
                        'Anonymous'
                      )
                    : 'Anonymous';
                  return (
                    <div key={review.id} className="flex flex-col gap-3">
                      <div className="flex items-start gap-4">
                        <ReviewerAvatar reviewer={review.reviewer} />
                        <div className="flex flex-col gap-1">
                          <span className="text-[#1a1a1a] text-sm font-semibold">{name}</span>
                          <div className="flex items-center gap-2">
                            <StarDisplay rating={review.rating} size={14} />
                            <span className="text-[#a6a6a6] text-xs">{timeAgo(review.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[#191919] text-sm leading-relaxed">{review.review_text}</p>
                      {review.media_url && (
                        <div className="grid grid-cols-2 gap-2">
                          <img src={review.media_url} className="w-full h-36 object-cover rounded-xl" alt="" />
                        </div>
                      )}
                      {idx < reviews.length - 1 && <div className="h-px bg-[#f2f2f3]" />}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
