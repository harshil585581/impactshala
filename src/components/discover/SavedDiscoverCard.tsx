import { useState, useEffect } from "react";
import likeIcon from "../../assets/images/svg/like.svg";
import heartIcon from "../../assets/images/svg/heart.svg";
import congratulateIcon from "../../assets/images/svg/congratulate.svg";
import { toggleReaction, fetchDiscoverPost, type DiscoverItem } from "../../services/discoverService";
import type { SavedDiscoverSnapshot } from "../../services/savedService";
import CommentSection from "../CommentSection";
import ShareModal from "../ShareModal";

// ─── Saved Discover Card (same design as /discover page, used on /saved pages) ─

export default function SavedDiscoverCard({ post, onUnsave, onGetStarted }: {
  post: SavedDiscoverSnapshot;
  onUnsave: (id: string) => void;
  onGetStarted: (id: string) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [fullItem, setFullItem] = useState<DiscoverItem | null>(null);
  const [liked, setLiked] = useState(false);
  const [reactionCount, setReactionCount] = useState(post.reactions);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Fetch real liked state and full details on mount
  useEffect(() => {
    fetchDiscoverPost(post.id)
      .then(item => {
        setFullItem(item);
        setLiked(item.isLiked ?? false);
        setReactionCount(item.reactions);
        setCommentCount(item.comments);
      })
      .catch(() => {});
  }, [post.id]);

  function handleShowMore() {
    setShowMore(v => !v);
  }

  async function handleLike() {
    const next = !liked;
    setLiked(next);
    setReactionCount(c => c + (next ? 1 : -1));
    try {
      const res = await toggleReaction(post.id);
      setLiked(res.reacted);
      setReactionCount(res.count);
    } catch {
      setLiked(!next);
      setReactionCount(c => c + (next ? -1 : 1));
    }
  }

  return (
    <article className="bg-white rounded-2xl border border-border-default overflow-hidden">
      <div className="px-5 pt-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={post.userAvatarUrl || 'https://placehold.co/56x56/ff9400/ffffff'}
              alt={post.userName}
              className="w-14 h-14 rounded-full object-cover shrink-0"
            />
            <div>
              <p className="font-semibold text-text-dark text-base leading-tight">{post.userName}</p>
              <p className="text-text-muted text-sm">{post.userRole}</p>
              <div className="flex items-center gap-1 text-text-muted text-xs mt-0.5">
                <span>{post.time}</span>
                <span>•</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.5" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="#9ca3af" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Get Started + bookmark */}
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <button
              onClick={() => onGetStarted(post.id)}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors min-h-[44px] whitespace-nowrap"
            >
              Get Started
            </button>
            <button
              onClick={() => onUnsave(post.id)}
              aria-label="Remove bookmark"
              className="p-2 hover:bg-border-light rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg width="35" height="30" viewBox="0 0 24 24" fill="#f77f00" className="text-primary">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-text-dark font-bold text-lg mb-2">{post.title}</h3>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.badge && (
              <span className="px-3 py-1 bg-primary-light text-primary rounded-full text-xs font-medium whitespace-nowrap">
                {post.badge}
              </span>
            )}
            {post.tags
              .filter(t => t.trim().toLowerCase() !== post.badge?.trim().toLowerCase())
              .map(t => (
                <span key={t} className="px-3 py-1 bg-primary-light text-primary rounded-full text-xs font-medium whitespace-nowrap">
                  {t}
                </span>
              ))}
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
          <p className="text-text-medium text-sm"><span className="font-semibold">Mode :</span> <span className="font-normal">{post.mode}</span></p>
          <p className="text-text-medium text-sm"><span className="font-semibold">Payment :</span> <span className="font-normal">{post.payment}</span></p>
          <p className="text-text-medium text-sm"><span className="font-semibold">Target audience :</span> <span className="font-normal">{post.audience}</span></p>
          <p className="text-text-medium text-sm"><span className="font-semibold">Last date to apply :</span> <span className="font-normal">{post.lastDate}</span></p>
        </div>
      </div>

      {/* Cover image */}
      {post.imageUrl && (
        <img
          src={post.imageUrl} alt=""
          className="w-full h-[185px] object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      <div className="px-5 py-4">
        {/* Body text */}
        {fullItem?.body && (
          <p className={`text-text-medium text-sm mb-2 leading-relaxed ${showMore ? '' : 'line-clamp-2'}`}>
            {fullItem.body}
          </p>
        )}

        {/* Expanded details — same as /discover page */}
        {showMore && fullItem && (
          <div className="mt-3 space-y-4 border-t border-border-light pt-4 mb-3">
            {fullItem.eligibilityCriteria && fullItem.eligibilityCriteria.length > 0 && (
              <section>
                <h4 className="font-bold text-text-dark text-sm mb-1">Eligibility criteria</h4>
                <ul className="list-disc list-inside space-y-0.5">
                  {fullItem.eligibilityCriteria.map((c, i) => (
                    <li key={i} className="text-text-medium text-sm leading-relaxed">{c}</li>
                  ))}
                </ul>
              </section>
            )}
            {(fullItem.communicationLanguage || fullItem.levelOfParticipant || fullItem.educationalLevel || fullItem.eventOccurrence) && (
              <section>
                <h4 className="font-bold text-text-dark text-sm mb-2">Additional Details</h4>
                <div className="space-y-1">
                  {fullItem.communicationLanguage && <p className="text-text-medium text-sm"><span className="font-medium text-text-dark">Language : </span>{fullItem.communicationLanguage}</p>}
                  {fullItem.levelOfParticipant && <p className="text-text-medium text-sm"><span className="font-medium text-text-dark">Level of Participation : </span>{fullItem.levelOfParticipant}</p>}
                  {fullItem.educationalLevel && <p className="text-text-medium text-sm"><span className="font-medium text-text-dark">Educational Level : </span>{fullItem.educationalLevel}</p>}
                  {fullItem.eventOccurrence && (
                    <p className="text-text-medium text-sm">
                      <span className="font-medium text-text-dark">Type : </span>
                      {fullItem.eventOccurrence === 'one_day' ? 'One-Time Event' : fullItem.eventOccurrence === 'weekly' ? 'Weekly' : fullItem.eventOccurrence === 'custom_multi_day' ? 'Multi-Day' : fullItem.eventOccurrence}
                    </p>
                  )}
                </div>
              </section>
            )}
            {(fullItem.address || fullItem.onsiteVenue || fullItem.onlineAccess) && (
              <section>
                <h4 className="font-bold text-text-dark text-sm mb-2">Access Details</h4>
                <div className="space-y-1">
                  {(fullItem.address || fullItem.onsiteVenue) && <p className="text-text-medium text-sm"><span className="font-medium text-text-dark">Address : </span>{fullItem.address || fullItem.onsiteVenue}</p>}
                  {fullItem.onlineAccess && <p className="text-text-medium text-sm"><span className="font-medium text-text-dark">Link : </span>{fullItem.onlineAccess}</p>}
                </div>
              </section>
            )}
            {fullItem.description && (
              <section>
                <h4 className="font-bold text-text-dark text-sm mb-1">Description</h4>
                <p className="text-text-medium text-sm leading-relaxed">{fullItem.description}</p>
              </section>
            )}
          </div>
        )}

        {/* Show more toggle */}
        {fullItem?.body && (
          <button
            onClick={handleShowMore}
            className="text-primary text-sm font-medium hover:underline mb-3 block"
          >
            {showMore ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Reactions */}
        <div className="flex items-center justify-between text-sm text-text-muted mb-3">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              <img src={likeIcon} alt="like" className="w-5 h-5" />
              <img src={heartIcon} alt="heart" className="w-5 h-5" />
              <img src={congratulateIcon} alt="congratulate" className="w-5 h-5" />
            </div>
            <span>{reactionCount.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowComments(v => !v)}
            className="hover:underline hover:text-[#FF9400] transition-colors"
          >
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-around border-t border-border-light pt-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors py-1 px-2 min-h-[44px] ${liked ? 'text-primary' : 'text-text-muted hover:text-primary'}`}
          >
            {liked ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M1 21h4V9H1v12zm23-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L15.17 1 8.59 7.59C8.22 7.95 8 8.45 8 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91L24 10z" fill="#FF9400" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
            Like
          </button>
          <button
            onClick={() => setShowComments(v => !v)}
            className={`flex items-center gap-1.5 text-sm hover:text-primary transition-colors py-1 px-2 min-h-[44px] ${showComments ? 'text-primary' : 'text-text-muted'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Comment
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 text-text-muted text-sm hover:text-primary transition-colors py-1 px-2 min-h-[44px]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Share
          </button>
          <button
            onClick={() => onUnsave(post.id)}
            className="flex items-center gap-1.5 text-primary text-sm hover:text-orange-600 transition-colors py-1 px-2 min-h-[44px]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
            </svg>
            Saved
          </button>
        </div>
      </div>

      {/* Comment section — inside the card, same width */}
      {showComments && (
        <CommentSection
          postId={post.id}
          postTable="discover_posts"
          onCommentCountChange={setCommentCount}
        />
      )}

      {/* Share modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        postId={post.id}
        postTable="discover_posts"
        authorName={post.userName}
        authorAvatar={post.userAvatarUrl}
        postTitle={post.title}
        postBody=""
        postImageUrl={post.imageUrl || null}
      />
    </article>
  );
}
