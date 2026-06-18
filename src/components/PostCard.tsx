import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FeedPost } from '../services/postService';
import { fetchPollData, voteOnPoll, unvoteOnPoll } from '../services/postService';
import likeIcon        from '../assets/images/svg/like.svg';
import heartIcon       from '../assets/images/svg/heart.svg';
import congratulateIcon from '../assets/images/svg/congratulate.svg';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
function GlobeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-40"><circle cx="12" cy="12" r="10" stroke="#9199a3" strokeWidth="1.5"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getDisplayName(user: FeedPost['user']): string {
  if (!user) return 'User';
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return fullName || user.org_name || 'User';
}

function formatEventDate(date: string | null, time: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!time) return dateStr;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${dateStr} · ${hour12}:${m} ${ampm}`;
}

function UserAvatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return <img src={url} alt={name} className="w-11 h-11 rounded-full object-cover shrink-0" />;
  }
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-11 h-11 rounded-full bg-[#FF9400] flex items-center justify-center text-white font-bold text-sm shrink-0">
      {initials || '?'}
    </div>
  );
}

export default function PostCard({
  post,
  isSaved = false,
  onSaveToggle,
  isLiked = false,
  likesCount = 0,
  onLikeToggle,
  commentsCount = 0,
  onCommentAdded,
  inModal = false,
  onDelete,
}: {
  post: FeedPost;
  isSaved?: boolean;
  onSaveToggle?: (postId: string, saved: boolean) => void;
  isLiked?: boolean;
  likesCount?: number;
  onLikeToggle?: (postId: string, liked: boolean) => void;
  commentsCount?: number;
  onCommentAdded?: () => void;
  inModal?: boolean;
  onDelete?: (postId: string) => void;
}) {
  const [pollVoteCounts, setPollVoteCounts] = useState<Record<number, number>>({});
  const [pollUserVote, setPollUserVote] = useState<number | null>(null);
  const [pollTotalVotes, setPollTotalVotes] = useState(0);
  const [pollHasVoted, setPollHasVoted] = useState(false);
  const [pollLoading, setPollLoading] = useState(false);

  useEffect(() => {
    if (post.post_type !== 'poll') return;
    fetchPollData(post.id).then(({ voteCounts, userVote, totalVotes }) => {
      setPollVoteCounts(voteCounts);
      setPollUserVote(userVote);
      setPollTotalVotes(totalVotes);
      setPollHasVoted(userVote !== null);
    }).catch(() => {});
  }, [post.id, post.post_type]);

  async function handlePollVote(optionIndex: number) {
    if (pollLoading) return;
    setPollLoading(true);

    const prevVote = pollUserVote;
    const prevHasVoted = pollHasVoted;

    if (pollHasVoted && pollUserVote === optionIndex) {
      // Remove vote
      setPollUserVote(null);
      setPollHasVoted(false);
      setPollVoteCounts(prev => ({ ...prev, [optionIndex]: Math.max(0, (prev[optionIndex] ?? 1) - 1) }));
      setPollTotalVotes(prev => Math.max(0, prev - 1));
      try {
        await unvoteOnPoll(post.id);
      } catch {
        setPollUserVote(prevVote);
        setPollHasVoted(prevHasVoted);
        setPollVoteCounts(prev => ({ ...prev, [optionIndex]: (prev[optionIndex] ?? 0) + 1 }));
        setPollTotalVotes(prev => prev + 1);
      }
    } else if (pollHasVoted && pollUserVote !== null) {
      // Switch vote
      const oldIdx = pollUserVote;
      setPollUserVote(optionIndex);
      setPollVoteCounts(prev => ({
        ...prev,
        [oldIdx]: Math.max(0, (prev[oldIdx] ?? 1) - 1),
        [optionIndex]: (prev[optionIndex] ?? 0) + 1,
      }));
      try {
        await voteOnPoll(post.id, optionIndex);
      } catch {
        setPollUserVote(prevVote);
        setPollVoteCounts(prev => ({
          ...prev,
          [oldIdx]: (prev[oldIdx] ?? 0) + 1,
          [optionIndex]: Math.max(0, (prev[optionIndex] ?? 1) - 1),
        }));
      }
    } else {
      // New vote
      setPollUserVote(optionIndex);
      setPollHasVoted(true);
      setPollVoteCounts(prev => ({ ...prev, [optionIndex]: (prev[optionIndex] ?? 0) + 1 }));
      setPollTotalVotes(prev => prev + 1);
      try {
        await voteOnPoll(post.id, optionIndex);
      } catch {
        setPollUserVote(null);
        setPollHasVoted(false);
        setPollVoteCounts(prev => ({ ...prev, [optionIndex]: Math.max(0, (prev[optionIndex] ?? 1) - 1) }));
        setPollTotalVotes(prev => Math.max(0, prev - 1));
      }
    }

    setPollLoading(false);
  }

  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(isSaved);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(commentsCount);
  useEffect(() => { setCommentCount(commentsCount); }, [commentsCount]);
  const [showShare, setShowShare] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const navigate = useNavigate();
  const storedUserId = (() => { try { return JSON.parse(localStorage.getItem('user') ?? '{}').id; } catch { return null; } })();
  const isOwnPost = !!onDelete || (!!post.user?.id && post.user.id === storedUserId);

  const name = getDisplayName(post.user);

  function toggleSave() {
    const next = !saved;
    setSaved(next);
    onSaveToggle?.(post.id, next);
  }

  return (
    <div className="bg-white border border-[#ececec] rounded-2xl shadow-[0px_1px_1px_rgba(0,0,0,0.05)] overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => post.user?.id && navigate(`/profile/${post.user.id}`)} className="shrink-0 focus:outline-none">
            <UserAvatar name={name} url={post.user?.avatar_url} />
          </button>
          <div className="flex flex-col">
            <button onClick={() => post.user?.id && navigate(`/profile/${post.user.id}`)} className="font-bold text-[#18191c] text-base leading-tight text-left hover:underline focus:outline-none">{name}</button>
            {post.user && (
              <div className="flex items-center gap-1.5 text-[#5e6670] text-xs mt-0.5">
                {(() => {
                  if (post.user.user_type === 'organization') {
                    return <span className="capitalize">{post.user.org_type || 'Organization'}</span>;
                  }
                  
                  const current = post.user.experiences?.find(e => e.is_current) || post.user.experiences?.[0];
                  if (current) {
                    return (
                      <>
                        <span className="truncate">{current.role}</span>
                        <span className="opacity-60">·</span>
                        <span className="truncate">{current.company}</span>
                      </>
                    );
                  }
                  
                  if (post.user.title || post.user.company) {
                    return (
                      <>
                        {post.user.title && <span className="truncate">{post.user.title}</span>}
                        {post.user.title && post.user.company && <span className="opacity-60">·</span>}
                        {post.user.company && <span className="truncate">{post.user.company}</span>}
                      </>
                    );
                  }
                  
                  return null;
                })()}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[#9199a3] text-xs">{relativeTime(post.created_at)}</span>
              <span className="text-[#9199a3] text-xs">·</span>
              <GlobeIcon />
            </div>
          </div>
        </div>
        {isOwnPost && onDelete ? (
          confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9199a3]">Delete?</span>
              <button
                onClick={() => { onDelete(post.id); setConfirmDelete(false); }}
                className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg font-medium"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-[#18191c] bg-[#f2f2f3] hover:bg-[#e8e8e8] px-2.5 py-1 rounded-lg font-medium"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[#9199a3] hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
              title="Delete post"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </button>
          )
        ) : !isOwnPost ? (
          <button className="text-[#FF9400] text-sm font-semibold flex items-center gap-1 hover:opacity-80">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#FF9400" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Follow
          </button>
        ) : null}
      </div>

      {/* Photo */}
      {post.post_type === 'photo' && (
        <>
          {post.content && (
            <div className="px-6 pb-3">
              <p className="text-[#222] text-base leading-relaxed">{post.content}</p>
            </div>
          )}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className={`px-4 pb-3 grid gap-1 ${post.media_urls.length > 1 ? 'grid-cols-2' : ''}`}>
              {post.media_urls.slice(0, 4).map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt=""
                    className={`w-full object-cover rounded-lg ${post.media_urls!.length === 1 ? 'max-h-[420px]' : 'h-[200px]'}`}
                  />
                  {i === 3 && post.media_urls!.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                      +{post.media_urls!.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Video */}
      {post.post_type === 'video' && (
        <>
          {post.content && (
            <div className="px-6 pb-3">
              <p className="text-[#222] text-base leading-relaxed">{post.content}</p>
            </div>
          )}
          {post.media_urls?.[0] && (
            <div className="px-4 pb-3">
              <video src={post.media_urls[0]} controls className="w-full rounded-lg max-h-[420px] bg-black" />
            </div>
          )}
        </>
      )}

      {/* Event */}
      {post.post_type === 'event' && (
        <div className="px-4 pb-4">
          {post.cover_image_url && (
            <img src={post.cover_image_url} alt="" className="w-full h-[200px] object-cover rounded-xl mb-3" />
          )}
          <div className="border border-[#e5e7eb] rounded-xl p-4 flex flex-col gap-2.5">
            <span className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full ${post.event_type === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'}`}>
              {post.event_type === 'online' ? 'Online' : 'In Person'}
            </span>
            {post.event_title && (
              <h3 className="font-bold text-[#18191c] text-base leading-snug">{post.event_title}</h3>
            )}
            {(post.start_date || post.start_time) && (
              <div className="flex items-center gap-1.5 text-[#6b7280] text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6b7280" strokeWidth="1.5"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {formatEventDate(post.start_date, post.start_time)}
                {post.end_date && ` – ${formatEventDate(post.end_date, post.end_time)}`}
              </div>
            )}
            {post.event_location && (
              <div className="flex items-center gap-1.5 text-[#6b7280] text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#6b7280" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" stroke="#6b7280" strokeWidth="1.5"/>
                </svg>
                {post.event_location}
              </div>
            )}
            {post.event_description && (
              <p className="text-[#6b7280] text-sm leading-relaxed line-clamp-3">{post.event_description}</p>
            )}
            {post.registration_link && (
              <a
                href={post.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start mt-1 bg-[#FF9400] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#e68500] transition-colors"
              >
                Register
              </a>
            )}
          </div>
        </div>
      )}

      {/* Poll */}
      {post.post_type === 'poll' && (
        <div className="px-6 pb-4">
          {post.poll_question && (
            <p className="text-[#222] text-base font-semibold leading-snug mb-3">{post.poll_question}</p>
          )}
          {post.poll_options && (
            <div className="flex flex-col gap-2">
              {post.poll_options.map((opt, i) => {
                const count = pollVoteCounts[i] ?? 0;
                const pct = pollTotalVotes > 0 ? Math.round((count / pollTotalVotes) * 100) : 0;
                const isVoted = pollUserVote === i;

                if (pollHasVoted || pollUserVote !== null) {
                  return (
                    <button
                      key={i}
                      onClick={() => handlePollVote(i)}
                      disabled={pollLoading}
                      className="relative w-full rounded-lg overflow-hidden text-left transition-opacity disabled:opacity-60"
                      style={{ border: `1.5px solid ${isVoted ? '#FF9400' : '#e0e0e0'}` }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: isVoted ? '#fff8ee' : '#f5f5f5' }}
                      />
                      <div className="relative flex items-center justify-between px-4 py-2.5">
                        <span className={`text-sm flex items-center gap-1.5 ${isVoted ? 'font-semibold text-[#FF9400]' : 'font-medium text-[#333]'}`}>
                          {isVoted && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="#FF9400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {opt}
                        </span>
                        <span className={`text-sm font-bold ml-4 shrink-0 ${isVoted ? 'text-[#FF9400]' : 'text-[#888]'}`}>{pct}%</span>
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={() => handlePollVote(i)}
                    disabled={pollLoading}
                    className="w-full text-left border rounded-lg px-4 py-2.5 text-sm font-medium transition-all border-[#e0e0e0] text-[#333] hover:border-[#FF9400] hover:bg-[#fff8ee] disabled:opacity-50"
                  >
                    {opt}
                  </button>
                );
              })}
              <p className="text-[#888] text-xs mt-1">
                {pollHasVoted
                  ? `You voted · ${pollTotalVotes} vote${pollTotalVotes !== 1 ? 's' : ''}`
                  : `${pollTotalVotes > 0 ? `${pollTotalVotes} vote${pollTotalVotes !== 1 ? 's' : ''} · ` : ''}${post.poll_options.length} options`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Question */}
      {post.post_type === 'question' && (
        <div className="px-6 pb-4">
          <div className="bg-[#fff8ee] border border-[#ffd9a0] rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" stroke="#FF9400" strokeWidth="1.5"/>
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="#FF9400" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="17" r="0.8" fill="#FF9400"/>
              </svg>
              <p className="text-[#18191c] text-base font-semibold leading-snug">{post.question_text}</p>
            </div>
            <button className="mt-3 ml-7 text-[#FF9400] text-sm font-semibold hover:opacity-80 transition-opacity">
              Answer this question
            </button>
          </div>
        </div>
      )}

      {/* Reactions count */}
      <div className="px-6 py-2 flex items-center justify-between border-t border-[#f2f2f3]">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <img src={likeIcon} alt="like" className="w-5 h-5" />
            <img src={heartIcon} alt="heart" className="w-5 h-5" />
            <img src={congratulateIcon} alt="congratulate" className="w-5 h-5" />
          </div>
          <span className="text-[#646464] text-sm">{likesCount}</span>
        </div>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="text-[#6f6f6f] text-sm hover:underline hover:text-[#FF9400] transition-colors"
        >
          {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-around border-t border-[#f2f2f3]">
        <button
          onClick={() => {
            const next = !liked;
            setLiked(next);
            onLikeToggle?.(post.id, next);
          }}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${liked ? 'text-[#FF9400]' : 'text-[#575555] hover:bg-gray-50'}`}
        >
          {liked ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M1 21h4V9H1v12zm23-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L15.17 1 8.59 7.59C8.22 7.95 8 8.45 8 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91L24 10z" fill="#FF9400" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          )}
          Like
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${showComments ? 'text-[#FF9400]' : 'text-[#575555] hover:bg-gray-50'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Comment
        </button>
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 text-[#575555] text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Share
        </button>
        <button
          onClick={toggleSave}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${saved ? 'text-[#FF9400]' : 'text-[#575555] hover:bg-gray-50'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Comment section */}
      {showComments && (
        <div className={inModal ? "max-h-[320px] overflow-y-auto" : undefined}>
          <CommentSection
            postId={post.id}
            postTable="posts"
            onCommentCountChange={(n) => {
              if (n > commentCount) onCommentAdded?.();
              setCommentCount(n);
            }}
          />
        </div>
      )}

      {/* Share modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        postId={post.id}
        postTable="posts"
        authorName={name}
        authorAvatar={post.user?.avatar_url}
        postTitle={post.event_title || post.poll_question || post.question_text || post.content?.slice(0, 80) || ''}
        postBody={post.content?.slice(0, 200) || post.event_description?.slice(0, 200) || ''}
        postImageUrl={post.media_urls?.[0] || post.cover_image_url || null}
      />
    </div>
  );
}
