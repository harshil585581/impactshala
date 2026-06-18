import PostCard from '../PostCard';
import type { FeedPost } from '../../services/postService';

interface Props {
  post: FeedPost;
  isLiked: boolean;
  likesCount: number;
  onLikeToggle: (postId: string, liked: boolean) => void;
  isSaved: boolean;
  onSaveToggle: (postId: string, saved: boolean) => void;
  commentsCount: number;
  onClose: () => void;
}

export default function PostDetailModal({
  post, isLiked, likesCount, onLikeToggle, isSaved, onSaveToggle, commentsCount, onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] mt-6 mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md text-[#9199a3] hover:text-[#18191c] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <PostCard
          post={post}
          isLiked={isLiked}
          likesCount={likesCount}
          onLikeToggle={onLikeToggle}
          isSaved={isSaved}
          onSaveToggle={onSaveToggle}
          commentsCount={commentsCount}
          inModal={true}
        />
      </div>
    </div>
  );
}
