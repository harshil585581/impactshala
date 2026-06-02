import { useState, useEffect, useRef } from 'react';
import {
  fetchComments,
  createComment,
  deleteComment,
  getCurrentUserId,
  PAGE_SIZE,
  type PostComment,
} from '../services/commentService';

/* ── helpers ── */
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function displayName(user: PostComment['user']): string {
  if (!user) return 'User';
  return (
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.org_name ||
    'User'
  );
}

function roleLabel(user: PostComment['user']): string {
  if (!user) return '';
  const current =
    user.experiences?.find((e) => e.is_current) ?? user.experiences?.[0];
  if (current) return `${current.role} • ${current.company}`;
  if (user.title && user.company) return `${user.title} • ${user.company}`;
  if (user.title) return user.title;
  if (user.company) return user.company;
  return '';
}

/* ── avatar ── */
function CommentAvatar({
  name,
  url,
  size = 'md',
}: {
  name: string;
  url?: string | null;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs';
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${dim} rounded-full object-cover shrink-0`}
      />
    );
  }
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={`${dim} rounded-full bg-[#FF9400] flex items-center justify-center text-white font-bold shrink-0`}
    >
      {initials || '?'}
    </div>
  );
}

/* ── single comment row ── */
function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: PostComment;
  currentUserId: string;
  onDelete: (id: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const name = displayName(comment.user);
  const role = roleLabel(comment.user);
  const isOwn = comment.user_id === currentUserId;

  return (
    <div className="flex gap-3">
      <CommentAvatar name={name} url={comment.user?.avatar_url} />

      <div className="flex-1 min-w-0">
        {/* name row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="font-semibold text-[#18191c] text-sm leading-tight block truncate">
              {name}
            </span>
            {role && (
              <span className="text-[#666] text-xs leading-tight block">
                {role}
              </span>
            )}
          </div>
          <span className="text-[#9199a3] text-xs whitespace-nowrap shrink-0">
            {relativeTime(comment.created_at)}
          </span>
        </div>

        {/* body */}
        <p className="text-[#18191c] text-sm mt-1 leading-relaxed whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* actions */}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-0">
            <button className="text-[#5e6670] text-xs font-semibold hover:text-[#FF9400] transition-colors px-0">
              Like
            </button>
            <span className="text-[#c0c0c0] text-xs mx-2">|</span>
            <button className="text-[#5e6670] text-xs font-semibold hover:text-[#FF9400] transition-colors">
              Reply
            </button>
          </div>

          {/* right action: delete for own, like for others */}
          {isOwn ? (
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#9199a3] hover:text-red-400 transition-colors"
              aria-label="Delete comment"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Delete
            </button>
          ) : (
            <button
              onClick={() => setLiked((v) => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                liked ? 'text-[#FF9400]' : 'text-[#5e6670] hover:text-[#FF9400]'
              }`}
            >
              {liked ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M1 21h4V9H1v12zm23-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L15.17 1 8.59 7.59C8.22 7.95 8 8.45 8 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91L24 10z" fill="#FF9400" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              Like
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── main component ── */
type Props = {
  postId: string;
  postTable?: 'posts' | 'discover_posts';
  onCommentCountChange?: (count: number) => void;
};

export default function CommentSection({
  postId,
  postTable = 'posts',
  onCommentCountChange,
}: Props) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentUserId = getCurrentUserId();

  /* initial load */
  useEffect(() => {
    setInitialLoading(true);
    fetchComments(postId, postTable, 0)
      .then((data) => {
        setComments(data);
        setHasMore(data.length === PAGE_SIZE);
        onCommentCountChange?.(data.length);
      })
      .catch(() => setError('Failed to load comments.'))
      .finally(() => setInitialLoading(false));
  }, [postId, postTable]);

  /* auto-focus input */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await fetchComments(postId, postTable, nextPage);
      setComments((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError('Failed to load more comments.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSubmit() {
    const text = inputText.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const newComment = await createComment(postId, text, postTable);
      setComments((prev) => [...prev, newComment]);
      onCommentCountChange?.(comments.length + 1);
      setInputText('');
    } catch {
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId);
      const updated = comments.filter((c) => c.id !== commentId);
      setComments(updated);
      onCommentCountChange?.(updated.length);
    } catch {
      setError('Failed to delete comment.');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-[#ececec] bg-white px-4 py-3 flex flex-col gap-4">

      {/* ── Input row ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FF9400] flex items-center justify-center text-white font-bold text-xs shrink-0">
          Me
        </div>

        <div className="flex-1 flex items-center gap-2 bg-[#f5f5f5] border border-[#e8e8e8] rounded-full px-4 py-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment...."
            rows={1}
            className="flex-1 resize-none bg-transparent text-[#18191c] text-sm outline-none placeholder:text-[#9199a3] leading-[1.4]"
            style={{ minHeight: '22px', maxHeight: '80px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
            }}
          />

          {/* emoji icon */}
          <button
            type="button"
            className="text-[#9199a3] hover:text-[#FF9400] transition-colors shrink-0"
            aria-label="Emoji"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M8 14s1.5 2 4 2 4-2 4-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
            </svg>
          </button>

          {/* image attach icon */}
          <button
            type="button"
            className="text-[#9199a3] hover:text-[#FF9400] transition-colors shrink-0"
            aria-label="Attach image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path
                d="M21 15l-5-5L5 21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 10l2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* plus badge */}
              <circle cx="19" cy="5" r="4" fill="#FF9400" />
              <path
                d="M19 3v4M17 5h4"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="text-red-500 text-xs px-1 -mt-2">{error}</p>
      )}

      {/* ── Send button (visible when typing) ── */}
      {inputText.trim() && (
        <div className="flex justify-end -mt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#FF9400] text-white text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-50 hover:bg-[#e68500] transition-colors"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      )}

      {/* ── Comments list ── */}
      {initialLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 bg-gray-200 rounded w-28" />
                <div className="h-2.5 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-full mt-1" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[#9199a3] text-sm text-center py-1">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Load more ── */}
      {hasMore && !initialLoading && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="flex items-center gap-2 text-[#5e6670] text-sm font-medium hover:text-[#FF9400] transition-colors disabled:opacity-50 mt-1"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className={loadingMore ? 'animate-spin' : ''}
          >
            <path
              d="M4 4v5h5M20 20v-5h-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.49 9A9 9 0 005.64 5.64L4 10M3.51 15a9 9 0 0014.85 3.36L20 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {loadingMore ? 'Loading…' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}
