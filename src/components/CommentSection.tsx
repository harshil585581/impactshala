import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchComments,
  fetchReplies,
  fetchReplyCountsBatch,
  fetchCommentLikesBatch,
  toggleCommentLike,
  createComment,
  deleteComment,
  getCurrentUserId,
  PAGE_SIZE,
  type PostComment,
} from '../services/commentService';
import { searchMentionableUsers, type CommunityUser } from '../services/communityService';

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
  if (user.title && user.company) return `${user.title} • ${user.company}`;
  if (user.title) return user.title;
  if (user.company) return user.company;
  return '';
}

/* ── render comment text with colored @mentions ── */
function CommentText({ text }: { text: string }) {
  const parts = text.split(/(@\S+)/g);
  return (
    <p className="text-[#18191c] text-sm mt-1 leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="text-[#FF9400] font-semibold">{part}</span>
        ) : (
          part
        )
      )}
    </p>
  );
}

/* ── mention dropdown ── */
function MentionDropdown({
  users,
  loading,
  onSelect,
}: {
  users: CommunityUser[];
  loading: boolean;
  onSelect: (user: CommunityUser) => void;
}) {
  if (!loading && users.length === 0) return null;
  return (
    <div className="absolute bottom-full mb-1 left-0 w-[240px] bg-white border border-[#e5e5e5] rounded-xl shadow-xl z-50 overflow-hidden max-h-[200px] overflow-y-auto">
      {loading ? (
        <div className="px-4 py-3 text-xs text-[#9199a3]">Searching…</div>
      ) : (
        users.map((u) => (
          <button
            key={u.id}
            onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#fff3e0] transition-colors text-left"
          >
            {u.avatar_url ? (
              <img src={u.avatar_url} alt={u.name} loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#FF9400] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#18191c] truncate">{u.name}</p>
              {u.title && <p className="text-[10px] text-[#666] truncate">{u.title}</p>}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

/* ── emoji data ── */
const EMOJI_GROUPS = [
  { label: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱'] },
  { label: 'Gestures', emojis: ['👍','👎','👏','🙌','🤝','🙏','✊','👊','🤛','🤜','🤞','✌️','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','👋','🤚','🖐️','✋','🖖','💪','🦾','🤳'] },
  { label: 'Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🔥','⭐','✨','💫','🌟','💥','🎉','🎊','🎈','🎁'] },
  { label: 'Nature', emojis: ['🌸','🌹','🌺','🌻','🌼','🌷','💐','🌿','🍀','🌱','🌲','🌳','🌴','🍁','🍂','🍃','🌾','☘️','🌵','🎋','🎍','🌙','⭐','☀️','🌤️','⛅','🌦️','🌧️','🌈'] },
  { label: 'Food', emojis: ['🍕','🍔','🍟','🌭','🍿','🧂','🥓','🥚','🍳','🥞','🧇','🧆','🥙','🌮','🌯','🥗','🥘','🍲','🍜','🍝','🍠','🍢','🍣','🍤','🍙','🍚','🍛','🍥','🥮','🍡'] },
  { label: 'Activities', emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🥍','🏏','⛳','🏹','🎣','🤿','🥊','🥋','🎽','⛸️','🛷','🏋️','🤸','🤺','🏇','🧘','🏄'] },
];

function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [activeGroup, setActiveGroup] = useState(0);
  return (
    <div className="absolute bottom-full mb-2 right-0 w-[280px] bg-white border border-[#e5e5e5] rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="flex border-b border-[#f0f0f0] px-2 pt-2 gap-1 overflow-x-auto">
        {EMOJI_GROUPS.map((g, i) => (
          <button
            key={g.label}
            onMouseDown={(e) => { e.preventDefault(); setActiveGroup(i); }}
            className={`text-[11px] px-2 py-1 rounded-t-lg whitespace-nowrap font-medium transition-colors ${
              activeGroup === i ? 'bg-[#fff3e0] text-[#FF9400]' : 'text-[#666] hover:text-[#FF9400]'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="p-2 grid grid-cols-8 gap-0.5 max-h-[160px] overflow-y-auto">
        {EMOJI_GROUPS[activeGroup].emojis.map((emoji) => (
          <button
            key={emoji}
            onMouseDown={(e) => { e.preventDefault(); onSelect(emoji); }}
            className="text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#fff3e0] transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── avatar ── */
function CommentAvatar({ name, url, size = 'md' }: { name: string; url?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[9px]' : 'w-10 h-10 text-xs';
  if (url) return <img src={url} alt={name} loading="lazy" decoding="async" className={`${dim} rounded-full object-cover shrink-0`} />;
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`${dim} rounded-full bg-[#FF9400] flex items-center justify-center text-white font-bold shrink-0`}>
      {initials || '?'}
    </div>
  );
}

/* ── inline reply input ── */
function ReplyInput({
  toName,
  onSubmit,
  onCancel,
}: {
  toName: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(`@${toName.replace(/\s+/g, '_')} `);
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const el = ref.current;
    if (el) el.selectionStart = el.selectionEnd = el.value.length;
  }, []);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setReplyError('');
    try {
      await onSubmit(trimmed);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to post reply.';
      setReplyError(msg.includes('parent_id') ? 'Replies require a DB migration — run the SQL from setup.' : msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2.5 flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-[#FF9400] flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">
        Me
      </div>
      <div className="flex-1 bg-[#f5f5f5] border border-[#e8e8e8] rounded-2xl px-3 py-2">
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
            if (e.key === 'Escape') onCancel();
          }}
          placeholder={`Reply to ${toName}…`}
          rows={1}
          className="w-full resize-none bg-transparent text-sm text-[#18191c] outline-none placeholder:text-[#9199a3] leading-[1.4]"
          style={{ minHeight: '20px', maxHeight: '80px' }}
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
          }}
        />
        {replyError && (
          <p className="text-[10px] text-red-500 mt-1">{replyError}</p>
        )}
        <div className="flex justify-end gap-2 mt-1.5">
          <button
            onClick={onCancel}
            className="text-xs text-[#9199a3] hover:text-[#666] font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!text.trim() || submitting}
            className="bg-[#FF9400] text-white text-xs font-semibold px-3 py-1 rounded-full disabled:opacity-40 hover:bg-[#e68500] transition-colors"
          >
            {submitting ? 'Posting…' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── single comment (used for both top-level and replies) ── */
function CommentItem({
  comment,
  currentUserId,
  postId,
  postTable,
  initialReplyCount = 0,
  initialLiked = false,
  initialLikeCount = 0,
  onDelete,
  depth = 0,
}: {
  comment: PostComment;
  currentUserId: string;
  postId: string;
  postTable: 'posts' | 'discover_posts';
  initialReplyCount?: number;
  initialLiked?: boolean;
  initialLikeCount?: number;
  onDelete: (id: string) => void | Promise<void>;
  depth?: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replies, setReplies] = useState<PostComment[]>([]);
  const [replyCount, setReplyCount] = useState(initialReplyCount);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);

  const name = displayName(comment.user);
  const role = roleLabel(comment.user);
  const navigate = useNavigate();

  async function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    try {
      const res = await toggleCommentLike(comment.id, comment.user_id);
      setLiked(res.liked);
      setLikeCount(res.count);
    } catch {
      setLiked(!next);
      setLikeCount(c => c + (next ? -1 : 1));
    }
  }
  const isOwn = comment.user_id === currentUserId;
  const canNest = depth === 0; // only one level of nesting

  async function toggleReplies() {
    if (repliesVisible) { setRepliesVisible(false); return; }
    if (repliesLoaded) { setRepliesVisible(true); return; }
    setRepliesLoading(true);
    try {
      const data = await fetchReplies(comment.id);
      const { counts: lCounts, likedIds } = await fetchCommentLikesBatch(data.map(r => r.id));
      setReplies(data.map(r => ({ ...r, _likeCount: lCounts[r.id] ?? 0, _liked: likedIds.has(r.id) })));
      setReplyCount(data.length);
      setRepliesLoaded(true);
      setRepliesVisible(true);
    } finally {
      setRepliesLoading(false);
    }
  }

  async function submitReply(text: string) {
    const newReply = await createComment(postId, text, postTable, comment.id);
    setReplies(prev => [...prev, newReply]);
    setReplyCount(c => c + 1);
    setRepliesLoaded(true);
    setRepliesVisible(true);
    setReplyOpen(false);
  }

  const showRepliesBtn = canNest && (replyCount > 0);

  return (
    <div>
      <div className="flex gap-3">
        {/* avatar + thread line */}
        <div className="flex flex-col items-center shrink-0">
          <CommentAvatar name={name} url={comment.user?.avatar_url} size={depth > 0 ? 'sm' : 'md'} />
          {(repliesVisible || replyOpen) && canNest && (
            <div className="flex-1 w-[2px] bg-[#ececec] rounded-full mt-1" style={{ minHeight: 12 }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button
                onClick={() => navigate(`/profile/${comment.user_id}`)}
                className="font-semibold text-[#18191c] text-sm leading-tight block truncate hover:underline cursor-pointer text-left"
              >
                {name}
              </button>
              {role && <span className="text-[#666] text-xs leading-tight block">{role}</span>}
            </div>
            <span className="text-[#9199a3] text-xs whitespace-nowrap shrink-0">{relativeTime(comment.created_at)}</span>
          </div>

          {/* body */}
          <CommentText text={comment.content} />

          {/* actions row */}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs font-semibold transition-colors ${liked ? 'text-[#FF9400]' : 'text-[#5e6670] hover:text-[#FF9400]'}`}
              >
                {liked ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73V10z" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
                Like{likeCount > 0 && <span className="ml-0.5">{likeCount}</span>}
              </button>
              <span className="text-[#c0c0c0] text-xs mx-2">|</span>
              <button
                onClick={() => setReplyOpen(v => !v)}
                className={`text-xs font-semibold transition-colors ${replyOpen ? 'text-[#FF9400]' : 'text-[#5e6670] hover:text-[#FF9400]'}`}
              >
                Reply
              </button>
            </div>
            {isOwn && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs font-semibold text-[#9199a3] hover:text-red-400 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Delete
              </button>
            )}
          </div>

          {/* inline reply input */}
          {replyOpen && (
            <ReplyInput
              toName={name}
              onSubmit={submitReply}
              onCancel={() => setReplyOpen(false)}
            />
          )}

          {/* view / hide replies button */}
          {showRepliesBtn && (
            <button
              onClick={toggleReplies}
              disabled={repliesLoading}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#5e6670] hover:text-[#FF9400] transition-colors disabled:opacity-60"
            >
              {repliesLoading ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="animate-spin">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40" strokeDashoffset="14" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d={repliesVisible ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              )}
              {repliesVisible
                ? `Hide ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
                : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>
      </div>

      {/* nested replies */}
      {canNest && repliesVisible && replies.length > 0 && (
        <div className="ml-[52px] mt-3 flex flex-col gap-4 pl-3 border-l-2 border-[#f0f0f0]">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              postId={postId}
              postTable={postTable}
              initialLiked={(reply as PostComment & { _liked?: boolean })._liked ?? false}
              initialLikeCount={(reply as PostComment & { _likeCount?: number })._likeCount ?? 0}
              onDelete={async (id) => {
                await deleteComment(id);
                setReplies(prev => prev.filter(r => r.id !== id));
                setReplyCount(c => Math.max(0, c - 1));
              }}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── main component ── */
type Props = {
  postId: string;
  postTable?: 'posts' | 'discover_posts';
  onCommentCountChange?: (count: number) => void;
};

export default function CommentSection({ postId, postTable = 'posts', onCommentCountChange }: Props) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [replyCountMap, setReplyCountMap] = useState<Record<string, number>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<CommunityUser[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionStart, setMentionStart] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const currentUserId = getCurrentUserId();

  const insertEmoji = useCallback((emoji: string) => {
    const el = inputRef.current;
    if (!el) { setInputText(t => t + emoji); return; }
    const start = el.selectionStart ?? inputText.length;
    const end = el.selectionEnd ?? inputText.length;
    setInputText(inputText.slice(0, start) + emoji + inputText.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  }, [inputText]);

  useEffect(() => {
    if (!showEmoji) return;
    function outside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [showEmoji]);

  useEffect(() => {
    if (mentionQuery === null) { setMentionUsers([]); return; }
    setMentionLoading(true);
    const t = setTimeout(() => {
      searchMentionableUsers(mentionQuery || undefined)
        .then(res => setMentionUsers(res.users.slice(0, 6)))
        .catch(() => setMentionUsers([]))
        .finally(() => setMentionLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setInputText(val);
    const cursor = e.target.selectionStart ?? val.length;
    const match = val.slice(0, cursor).match(/@([\w]*)$/);
    if (match) { setMentionQuery(match[1]); setMentionStart(cursor - match[0].length); }
    else setMentionQuery(null);
  }

  function handleMentionSelect(user: CommunityUser) {
    const el = inputRef.current;
    const cursor = el?.selectionStart ?? inputText.length;
    const slug = user.name.replace(/\s+/g, '_');
    const mention = `@${slug} `;
    const next = inputText.slice(0, mentionStart) + mention + inputText.slice(cursor);
    setInputText(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = mentionStart + mention.length;
    });
  }

  /* initial load */
  useEffect(() => {
    setInitialLoading(true);
    fetchComments(postId, postTable, 0)
      .then(async data => {
        setComments(data);
        setHasMore(data.length === PAGE_SIZE);
        onCommentCountChange?.(data.length);
        // Batch-fetch reply counts + like data separately — failures here are non-fatal
        if (data.length) {
          const ids = data.map(c => c.id);
          try {
            const [counts, { counts: lCounts, likedIds }] = await Promise.all([
              fetchReplyCountsBatch(ids),
              fetchCommentLikesBatch(ids),
            ]);
            setReplyCountMap(counts);
            setLikeCountMap(lCounts ?? {});
            setLikedSet(likedIds ?? new Set());
          } catch { /* non-fatal */ }
        }
      })
      .catch((err: Error) => setError(err?.message || 'Failed to load comments.'))
      .finally(() => setInitialLoading(false));
  }, [postId, postTable]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function loadMore() {
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await fetchComments(postId, postTable, nextPage);
      setComments(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === PAGE_SIZE);
      if (data.length) {
        const ids = data.map(c => c.id);
        try {
          const [counts, { counts: lCounts, likedIds }] = await Promise.all([
            fetchReplyCountsBatch(ids),
            fetchCommentLikesBatch(ids),
          ]);
          setReplyCountMap(prev => ({ ...prev, ...counts }));
          setLikeCountMap(prev => ({ ...prev, ...(lCounts ?? {}) }));
          setLikedSet(prev => new Set([...prev, ...(likedIds ?? new Set())]));
        } catch { /* non-fatal */ }
      }
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
      setComments(prev => [...prev, newComment]);
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
      const updated = comments.filter(c => c.id !== commentId);
      setComments(updated);
      onCommentCountChange?.(updated.length);
    } catch {
      setError('Failed to delete comment.');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && e.key === 'Escape') { e.preventDefault(); setMentionQuery(null); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }

  return (
    <div className="border-t border-[#ececec] bg-white px-4 py-3 flex flex-col gap-4">

      {/* ── Main comment input ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FF9400] flex items-center justify-center text-white font-bold text-xs shrink-0">
          Me
        </div>
        <div className="flex-1 flex items-center gap-2 bg-[#f5f5f5] border border-[#e8e8e8] rounded-full px-4 py-2 relative">
          {/* mention dropdown */}
          <div className="absolute bottom-full left-0 w-full">
            {mentionQuery !== null && (
              <MentionDropdown users={mentionUsers} loading={mentionLoading} onSelect={handleMentionSelect} />
            )}
          </div>
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-[#18191c] text-sm outline-none placeholder:text-[#9199a3] leading-[1.4]"
            style={{ minHeight: '22px', maxHeight: '80px' }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
            }}
          />
          {/* emoji picker */}
          <div ref={emojiRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowEmoji(v => !v)}
              className={`transition-colors ${showEmoji ? 'text-[#FF9400]' : 'text-[#9199a3] hover:text-[#FF9400]'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="9" cy="10" r="1" fill="currentColor" />
                <circle cx="15" cy="10" r="1" fill="currentColor" />
              </svg>
            </button>
            {showEmoji && <EmojiPicker onSelect={insertEmoji} />}
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-xs px-1 -mt-2">{error}</p>}

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
          {[1, 2].map(i => (
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
        <p className="text-[#9199a3] text-sm text-center py-1">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-5">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              postId={postId}
              postTable={postTable}
              initialReplyCount={replyCountMap[comment.id] ?? 0}
              initialLiked={likedSet.has(comment.id)}
              initialLikeCount={likeCountMap[comment.id] ?? 0}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={loadingMore ? 'animate-spin' : ''}>
            <path d="M4 4v5h5M20 20v-5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 9A9 9 0 005.64 5.64L4 10M3.51 15a9 9 0 0014.85 3.36L20 14"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {loadingMore ? 'Loading…' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}
