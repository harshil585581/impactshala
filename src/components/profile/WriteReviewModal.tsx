import { useState, useRef } from 'react';
import { submitReview, uploadReviewMedia } from '../../services/reviewService';

interface Props {
  targetUserId: string;
  targetName: string;
  onClose: () => void;
  onSubmitted?: () => void;
  initialRating?: number;
  initialReviewText?: string;
  initialMediaUrl?: string;
}

export default function WriteReviewModal({ targetUserId, targetName, onClose, onSubmitted, initialRating, initialReviewText, initialMediaUrl }: Props) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState(initialReviewText ?? '');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(initialMediaUrl ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!reviewText.trim()) { setError('Please write your review.'); return; }
    setError('');
    setSubmitting(true);
    try {
      let mediaUrl: string | undefined;
      if (mediaFile) {
        try {
          mediaUrl = await uploadReviewMedia(mediaFile);
        } catch (uploadErr: any) {
          setError(`Image upload failed: ${uploadErr?.message ?? 'Unknown error'}. Submitting review without new image.`);
          mediaUrl = mediaPreview ?? undefined;
        }
      } else {
        mediaUrl = mediaPreview ?? undefined;
      }
      await submitReview(targetUserId, rating, reviewText.trim(), mediaUrl);
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      setError(err?.message ? `Failed: ${err.message}` : 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hovered || rating;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] border border-[#d6ddeb] w-full max-w-[560px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <h2 className="text-[#18191c] text-[20px] font-semibold">Credibility</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9199a3] hover:bg-[#f2f2f3] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 pt-5 pb-6 flex flex-col gap-5">
          {/* Write Your Review + Star Rating */}
          <div className="flex flex-col gap-1">
            <p className="text-[#424141] text-[16px] font-medium">Write Your Review</p>
            <p className="text-[#606060] text-[13px]">Rate Your Experience</p>
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= displayRating ? '#ff9400' : 'none'} stroke="#ff9400" strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Your Review textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-[#1f2937] text-[15px] font-semibold">Your Review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={`Share your thought about your experience with ${targetName}...`}
              rows={4}
              className="w-full border border-[#e2e2e2] rounded-lg px-3 py-3 text-[14px] text-[#18191c] placeholder-[#9199a3] resize-none focus:outline-none focus:border-[#ff9400] transition-colors"
            />
          </div>

          {/* Supporting Media */}
          <div className="flex flex-col gap-2">
            <label className="text-[#1f2937] text-[15px] font-semibold">Supporting Media <span className="text-[#9199a3] font-normal">(Optional)</span></label>
            {mediaPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-[#e2e2e2] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img src={mediaPreview} alt="Preview" className="w-full h-[140px] object-cover" />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                  onClick={(e) => { e.stopPropagation(); setMediaFile(null); setMediaPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                >✕</button>
                <p className="text-[#4b5563] text-[12px] px-2 py-1 bg-white/80 absolute bottom-0 left-0 right-0 truncate">{mediaFile?.name ?? 'Click to replace image'}</p>
              </div>
            ) : (
              <div
                className="border border-[#e2e2e2] rounded-lg h-[100px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#ff9400] hover:bg-[#fff8ee] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="#6b7280">
                  <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                </svg>
                <p className="text-[#4b5563] text-[13px]">Drop files here or click to upload</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setMediaFile(file);
                if (file && file.type.startsWith('image/')) {
                  const url = URL.createObjectURL(file);
                  setMediaPreview(url);
                } else {
                  setMediaPreview(null);
                }
              }}
            />
          </div>

          {error && <p className="text-red-500 text-[13px]">{error}</p>}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-[48px] px-8 bg-[#ff9400] text-white text-[15px] font-semibold rounded-full hover:bg-[#e88600] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              className="h-[48px] px-8 border border-[#ff9400] text-[#ff9400] text-[15px] font-semibold rounded-full hover:bg-[#fff8ee] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
