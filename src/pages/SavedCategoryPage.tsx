import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import likeIcon from '../assets/images/svg/like.svg';
import heartIcon from '../assets/images/svg/heart.svg';
import congratulateIcon from '../assets/images/svg/congratulate.svg';
import {
  fetchSavedDiscoverItems,
  fetchSavedCommunityPosts,
  unsaveDiscoverItem,
  unsavePost,
  type SavedDiscoverSnapshot,
} from '../services/savedService';
import type { FeedPost } from '../services/postService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getDisplayName(user: FeedPost['user']): string {
  if (!user) return 'User';
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.org_name || 'User';
}

function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  if (url) return <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full bg-[#ff9400] flex items-center justify-center shrink-0 text-white font-bold" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function SavedBadge({ onUnsave }: { onUnsave: () => void }) {
  return (
    <button onClick={onUnsave} title="Remove from saved" className="text-[#22c55e] hover:text-red-400 transition-colors shrink-0">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#e5e7eb] rounded-2xl">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-3">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[#6b7280] font-semibold text-base">{message}</p>
      <p className="text-[#9199a3] text-sm mt-1">{sub}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden animate-pulse">
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3.5 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
      <div className="h-[180px] bg-gray-100" />
    </div>
  );
}

// ─── Discover Card (matches Figma 303593:49846) ───────────────────────────────

function DiscoverCard({ post, onUnsave }: { post: SavedDiscoverSnapshot; onUnsave: (id: string) => void }) {
  const [showMore, setShowMore] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div className="bg-white border border-[#c5c5c5] rounded-xl p-4 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-start gap-2.5 w-full">
        <Avatar name={post.userName} url={post.userAvatarUrl} size={50} />

        <div className="flex flex-1 min-w-0 items-start gap-2">
          {/* Name / role / time */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <p className="text-[#222] text-[15px] font-semibold leading-tight">{post.userName}</p>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[#666] text-[12px]">{post.userRole}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#787777] text-[12px]">{post.time}</span>
              <span className="w-[4px] h-[4px] rounded-full bg-[#787777] shrink-0" />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#787777" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
              </svg>
            </div>
          </div>

          {/* Get Started + bookmark */}
          <div className="flex items-center gap-1 shrink-0">
            <button className="bg-[#f77f00] text-white text-[13px] font-semibold px-5 py-2 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap">
              Get Started
            </button>
            <button
              onClick={() => onUnsave(post.id)}
              title="Remove from saved"
              className="w-[40px] h-[40px] flex items-center justify-center text-[#f77f00] hover:text-red-400 transition-colors"
            >
              <svg width="26" height="28" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Title ── */}
      <h3 className="text-[#222] text-[17px] font-semibold leading-snug">{post.title}</h3>

      {/* ── Tags ── */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map(t => (
            <span key={t} className="bg-[#fff4e5] text-black text-[10.5px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap">{t}</span>
          ))}
        </div>
      )}

      {/* ── Details grid ── */}
      <div className="flex flex-col gap-2 text-[12px]">
        <div className="flex gap-6">
          <div className="flex-1"><span className="text-[#18191c] font-normal">Mode : </span><span className="text-[#717171]">{post.mode}</span></div>
          <div className="flex-1"><span className="text-[#18191c] font-normal">Payment : </span><span className="text-[#717171]">{post.payment}</span></div>
        </div>
        <div className="flex gap-6">
          <div className="flex-1"><span className="text-[#18191c] font-normal">Target audience : </span><span className="text-[#717171]">{post.audience}</span></div>
          <div className="flex-1"><span className="text-[#18191c] font-normal">Last date to apply : </span><span className="text-[#717171]">{post.lastDate}</span></div>
        </div>
      </div>

      {/* ── Image ── */}
      {post.imageUrl && (
        <div className="w-full h-[115px] rounded-[5px] overflow-hidden">
          <img
            src={post.imageUrl} alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* ── Show more ── */}
      <button
        onClick={() => setShowMore(v => !v)}
        className="text-[#f77f00] text-[13.5px] font-normal text-left hover:underline"
      >
        {showMore ? 'Show less' : 'Show more'}
      </button>

      {/* ── Reactions + comments ── */}
      <div className="flex items-center justify-between text-[9.5px] font-semibold">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <img src={likeIcon} alt="like" className="w-[17px] h-[17px]" />
            <img src={heartIcon} alt="heart" className="w-[17px] h-[17px]" />
            <img src={congratulateIcon} alt="congratulate" className="w-[17px] h-[17px]" />
          </div>
          <span className="text-[#646464]">{post.reactions.toLocaleString()}</span>
        </div>
        <span className="text-[#6f6f6f]">{post.comments} comments</span>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-[#f2f2f3] -mx-4" />

      {/* ── Action bar ── */}
      <div className="flex items-center justify-around -mx-1">
        {[
          {
            label: 'Like',
            icon: (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
              </svg>
            ),
            onClick: () => setLiked(v => !v),
            active: liked,
          },
          {
            label: 'Comment',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            ),
          },
          {
            label: 'Share',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
              </svg>
            ),
          },
          {
            label: 'Save',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            ),
            onClick: () => onUnsave(post.id),
          },
        ].map(({ label, icon, onClick, active }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex items-center gap-1.5 text-[10.5px] font-medium py-1 px-2 rounded-md transition-colors ${active ? 'text-[#f77f00]' : 'text-[#575555] hover:text-[#f77f00] hover:bg-[#fff8ee]'}`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

    </div>
  );
}

// ─── Community Card ───────────────────────────────────────────────────────────

function CommunityCard({ post, onUnsave }: { post: FeedPost; onUnsave: (id: string) => void }) {
  const [liked, setLiked] = useState(false);
  const name = getDisplayName(post.user);
  const isPoll = post.post_type === 'poll' && post.poll_options && post.poll_options.length > 0;
  const hasMedia = post.media_urls && post.media_urls.length > 0;

  return (
    <div className="bg-white border border-[#f2f2f3] rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={name} url={post.user?.avatar_url} size={44} />
          <div>
            <p className="text-[#18191c] text-sm font-bold leading-tight">{name}</p>
            <p className="text-[#9199a3] text-xs">{relativeTime(post.created_at)}</p>
          </div>
        </div>
        <SavedBadge onUnsave={() => onUnsave(post.id)} />
      </div>

      {post.content && <p className="text-[#18191c] text-sm leading-relaxed">{post.content}</p>}
      {isPoll && post.poll_question && <p className="text-[#18191c] text-sm font-medium">{post.poll_question}</p>}

      {hasMedia && !isPoll && (
        <img src={post.media_urls![0]} alt="" className="w-full h-[200px] object-cover rounded-xl" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}
      {isPoll && post.poll_options && (
        <div className="flex flex-col gap-2">
          {post.poll_options.map(opt => (
            <div key={opt} className="bg-[#fff6ed] rounded-lg px-3 py-2 text-sm text-[#18191c]">{opt}</div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-1 border-t border-[#f2f2f3]">
        <button onClick={() => setLiked(v => !v)} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-[#ff4757]' : 'text-[#9199a3] hover:text-[#ff4757]'}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? '#ff4757' : 'none'} stroke={liked ? '#ff4757' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          Like
        </button>
        <button className="flex items-center gap-1.5 text-sm text-[#9199a3] hover:text-[#f77f00] transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
          Comment
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { title: string }> = {
  community: { title: 'My Community Posts' },
  discover:  { title: 'Saved Discover Posts' },
  learning:  { title: 'Learning Directory' },
  employment:{ title: 'Employment Hub' },
};

export default function SavedCategoryPage() {
  const { category = 'discover' } = useParams<{ category: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [discoverPosts, setDiscoverPosts] = useState<SavedDiscoverSnapshot[]>([]);
  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const meta = CATEGORY_META[category] ?? CATEGORY_META.discover;

  useEffect(() => {
    setLoading(true);
    if (category === 'discover') {
      fetchSavedDiscoverItems()
        .then(setDiscoverPosts)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (category === 'community') {
      fetchSavedCommunityPosts()
        .then(setCommunityPosts)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [category]);

  function handleDiscoverUnsave(id: string) {
    unsaveDiscoverItem(id).catch(() => {});
    setDiscoverPosts(prev => prev.filter(p => p.id !== id));
  }

  function handleCommunityUnsave(id: string) {
    unsavePost(id).catch(() => {});
    setCommunityPosts(prev => prev.filter(p => p.id !== id));
  }

  function renderContent() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (category === 'discover') {
      if (discoverPosts.length === 0) {
        return (
          <div className="grid grid-cols-1">
            <EmptyState
              message="No saved discover posts"
              sub="Bookmark any opportunity on the Discover page and it will appear here."
            />
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {discoverPosts.map(p => (
            <DiscoverCard key={p.id} post={p} onUnsave={handleDiscoverUnsave} />
          ))}
        </div>
      );
    }

    if (category === 'community') {
      if (communityPosts.length === 0) {
        return (
          <div className="grid grid-cols-1">
            <EmptyState
              message="No saved community posts"
              sub='Click "Save" on any home feed post and it will appear here.'
            />
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {communityPosts.map(p => (
            <CommunityCard key={p.id} post={p} onUnsave={handleCommunityUnsave} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1">
        <EmptyState message="Coming soon" sub="This category will be available soon." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">

          {/* Back */}
          <button
            onClick={() => navigate('/saved')}
            className="flex items-center gap-3 text-[#565555] text-base font-medium hover:text-[#18191c] transition-colors mb-5"
          >
            <svg width="9" height="17" viewBox="0 0 9 17" fill="none">
              <path d="M8 1L1 8.5L8 16" stroke="#565555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Saved
          </button>

          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-black text-2xl font-medium tracking-[0.48px]">{meta.title}</h1>
            {!loading && category === 'discover' && discoverPosts.length > 0 && (
              <span className="bg-[#fff6ed] text-[#ff9400] text-sm font-semibold px-2.5 py-0.5 rounded-full">
                {discoverPosts.length}
              </span>
            )}
            {!loading && category === 'community' && communityPosts.length > 0 && (
              <span className="bg-[#fff6ed] text-[#ff9400] text-sm font-semibold px-2.5 py-0.5 rounded-full">
                {communityPosts.length}
              </span>
            )}
          </div>

          {renderContent()}

        </div>
      </div>
    </div>
  );
}
