import { useState, useRef, useEffect } from 'react';
import { createPhotoPost } from '../services/postService';
import type { PostVisibility } from '../services/postService';
import { VisibleToDropdown } from './VisibleToDropdown';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userAvatar?: string | null;
  userName: string;
  onVideoMode: () => void;
  onPosted: () => void;
};

export default function CreatePostModal({
  isOpen, onClose, userAvatar, userName,
  onVideoMode, onPosted,
}: Props) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textRef.current?.focus(), 80);
    } else {
      setContent('');
      setImages([]);
      setPreviews([]);
      setError(null);
      setPosting(false);
    }
  }, [isOpen]);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newImages = [...images, ...valid].slice(0, 9);
    setImages(newImages);
    setPreviews(newImages.map(f => URL.createObjectURL(f)));
  }

  function removeImage(i: number) {
    const next = images.filter((_, idx) => idx !== i);
    setImages(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  }

  async function handlePost() {
    if (!content.trim() && images.length === 0) return;
    setPosting(true);
    setError(null);
    try {
      await createPhotoPost({ files: images, content: content.trim(), visibility });
      onPosted();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  function handleModeSwitch(fn: () => void) {
    onClose();
    setTimeout(fn, 50);
  }

  const initials = userName.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  const canPost = (content.trim().length > 0 || images.length > 0) && !posting;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[680px] flex flex-col max-h-[85vh] min-h-[420px]" style={{ clipPath: 'none' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f2f3]">
          <h2 className="text-[#18191c] font-bold text-lg">Create a post</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#6b7280] transition-colors p-1 rounded-full hover:bg-[#f2f2f3]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Author row — outside scroll so dropdown isn't clipped */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-12 h-12 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#FF9400] flex items-center justify-center text-white font-bold text-base shrink-0">
                {initials}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[#18191c] font-semibold text-sm">{userName}</span>
              <VisibleToDropdown value={visibility} onChange={setVisibility} openUp={false} />
            </div>
        </div>

        {/* Scrollable content below author row */}
        <div className="flex-1 overflow-y-auto">
          {/* Textarea */}
          <div className="px-5 pb-2">
            <textarea
              ref={textRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What do you want to talk about?"
              className="w-full resize-none text-[#18191c] text-base placeholder-[#9ca3af] focus:outline-none min-h-[120px]"
              rows={5}
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
          </div>

          {/* Image previews */}
          {previews.length > 0 && (
            <div className={`px-5 pb-4 grid gap-2 ${previews.length === 1 ? 'grid-cols-1' : previews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {previews.map((src, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden bg-[#f2f2f3] aspect-square">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="px-5 pb-3 text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer toolbar */}
        <div className="border-t border-[#f2f2f3] px-4 py-3 flex items-center gap-1">
          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />

          {/* Photo */}
          <button
            onClick={() => fileRef.current?.click()}
            title="Add photo"
            className="flex items-center gap-1.5 text-[#474d57] hover:text-[#f77f00] hover:bg-[#fff8ee] transition-colors px-3 py-2 rounded-xl text-sm font-medium"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden sm:inline">Photo</span>
          </button>

          {/* Video */}
          <button
            onClick={() => handleModeSwitch(onVideoMode)}
            title="Add video"
            className="flex items-center gap-1.5 text-[#474d57] hover:text-[#f77f00] hover:bg-[#fff8ee] transition-colors px-3 py-2 rounded-xl text-sm font-medium"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span className="hidden sm:inline">Video</span>
          </button>

          {/* Post button */}
          <button
            onClick={handlePost}
            disabled={!canPost}
            className={`ml-auto px-6 py-2 rounded-full text-sm font-bold transition-all ${
              canPost
                ? 'bg-[#f77f00] text-white hover:bg-[#e06e00] active:scale-95'
                : 'bg-[#f2f2f3] text-[#9ca3af] cursor-not-allowed'
            }`}
          >
            {posting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Posting…
              </span>
            ) : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
