import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import testImg from '../assets/images/test/tes.png';
import {
  fetchSavedCommunityPosts,
  fetchSavedDiscoverItems,
  unsavePost,
  unsaveDiscoverItem,
  type SavedDiscoverSnapshot,
} from '../services/savedService';
import type { FeedPost } from '../services/postService';

// ─── Static mock data (Learning & Employment have no save feature yet) ────────

const LEARNING_POSTS = [
  { id: '1', img: testImg, university: 'University of Mumbai, Mumbai', title: 'Bachelor of Business Administration (BBA) Accountancy', level: 'High School (Grade 11 to 12)', mode: 'Onsite (Bangalore)', fee: '2 LPA', duration: '3 Months', deadline: '16/9/2025' },
  { id: '2', img: testImg, university: 'University of Mumbai, Mumbai', title: 'Bachelor of Business Administration (BBA) Accountancy', level: 'High School (Grade 11 to 12)', mode: 'Onsite (Bangalore)', fee: '2 LPA', duration: '3 Months', deadline: '16/9/2025' },
];

const EMPLOYMENT_POSTS = [
  { id: '1', role: 'Product Manager', company: 'Accenture', location: 'Bangalore, Karnataka (Onsite)', exp: '0 – 2 Month', salary: '2 – 5 LPA', type: 'Full – Time', skills: ['Productivity', 'React', 'Management skill'], posted: '5 week Ago' },
  { id: '2', role: 'Product Manager', company: 'Accenture', location: 'Bangalore, Karnataka (Onsite)', exp: '0 – 2 Month', salary: '2 – 5 LPA', type: 'Full – Time', skills: ['Productivity', 'React', 'Management skill'], posted: '5 week Ago' },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

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
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return full || user.org_name || 'User';
}

function getUserRole(user: FeedPost['user']): string {
  if (!user) return '';
  if (user.user_type === 'organization') return user.org_type || 'Organization';
  const exp = user.experiences?.find(e => e.is_current) || user.experiences?.[0];
  if (exp) return `${exp.role} · ${exp.company}`;
  return [user.title, user.company].filter(Boolean).join(' · ');
}

function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  if (url) return <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full bg-[#ff9400] flex items-center justify-center shrink-0 text-white font-bold" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function SectionHeader({ title, count, onViewAll }: { title: string; count: number; onViewAll: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-[#18191c] text-xl font-bold">{title}</h2>
        {count > 0 && (
          <span className="bg-[#fff6ed] text-[#ff9400] text-xs font-semibold px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      <button
        onClick={onViewAll}
        className="h-[36px] px-5 border border-[#ff9400] text-[#ff9400] text-sm font-semibold rounded-lg hover:bg-[#fff8ee] transition-colors"
      >
        View all
      </button>
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center border-2 border-dashed border-[#e5e7eb] rounded-2xl">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-3">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[#6b7280] text-[15px] font-semibold">{message}</p>
      <p className="text-[#9199a3] text-sm mt-1">{sub}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-[#f2f2f3] p-4 animate-pulse flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-2.5 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-[120px] bg-gray-100 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ─── Community Post Card ──────────────────────────────────────────────────────

function CommunityMiniCard({ post, onUnsave }: { post: FeedPost; onUnsave: (id: string) => void }) {
  const [liked, setLiked] = useState(false);
  const [voted, setVoted] = useState<number | null>(null);

  const name = getDisplayName(post.user);
  const time = relativeTime(post.created_at);
  const isPoll = post.post_type === 'poll' && post.poll_options && post.poll_options.length > 0;
  const hasMedia = post.media_urls && post.media_urls.length > 0;
  const isEvent = post.post_type === 'event';

  return (
    <div className="bg-white border border-[#ececec] shadow-[0px_1px_4px_rgba(0,0,0,0.07)] rounded-2xl px-4 pt-4 pb-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Left: avatar + name + time */}
        <div className="flex items-center gap-3">
          <Avatar name={name} url={post.user?.avatar_url} size={44} />
          <div>
            <p className="text-[#18191c] text-[15px] font-bold leading-snug">{name}</p>
            <p className="text-[#9199a3] text-[13px] leading-tight">{time}</p>
          </div>
        </div>
        {/* Right: add-person (orange) + 3-dot menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUnsave(post.id)}
            title="Remove from saved"
            className="text-[#f77f00] hover:opacity-75 transition-opacity"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </button>
          <button className="text-[#9199a3] hover:text-[#374151] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Text content */}
      {post.content && (
        <p className="text-[#18191c] text-[14px] leading-relaxed">{post.content}</p>
      )}

      {/* Poll question */}
      {isPoll && post.poll_question && (
        <p className="text-[#18191c] text-[14px] font-medium">{post.poll_question}</p>
      )}

      {/* Poll options */}
      {isPoll && post.poll_options && (
        <div className="flex flex-col gap-2">
          {post.poll_options.map((opt, i) => (
            <button
              key={opt}
              onClick={() => setVoted(voted === null ? i : voted)}
              disabled={voted !== null}
              className={`relative h-10 rounded-lg overflow-hidden text-left ${voted === null ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
            >
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${voted === i ? 'bg-[#ffd5a0]' : 'bg-[#fff6ed]'}`}
                style={{ width: voted !== null ? (voted === i ? '65%' : '30%') : '100%' }}
              />
              <div className={`absolute inset-0 rounded-lg border ${voted === i ? 'border-[#f77f00]' : 'border-transparent'}`} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#18191c] relative z-10">{opt}</span>
            </button>
          ))}
        </div>
      )}

      {/* Media image — no side padding, fills card width */}
      {hasMedia && !isPoll && (
        <div className="bg-[#232246] rounded-xl overflow-hidden">
          <img
            src={post.media_urls![0]}
            alt=""
            className="w-full h-[200px] object-cover block"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Event cover */}
      {isEvent && post.cover_image_url && (
        <div className="bg-[#232246] rounded-xl overflow-hidden">
          <img
            src={post.cover_image_url}
            alt=""
            className="w-full h-[200px] object-cover block"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Event info */}
      {isEvent && (
        <div className="bg-[#fff6ed] rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
          {post.event_title && <p className="text-[#18191c] text-[13px] font-semibold">{post.event_title}</p>}
          {post.start_date && (
            <p className="text-[#9199a3] text-[12px]">
              {post.start_date}{post.start_time ? ` · ${post.start_time}` : ''}
            </p>
          )}
          {post.event_location && <p className="text-[#9199a3] text-[12px]">{post.event_location}</p>}
        </div>
      )}

      {/* Footer: Like + Comment */}
      <div className="flex items-center gap-5 py-3 border-t border-[#f0f0f0] mt-auto">
        <button
          onClick={() => setLiked(v => !v)}
          className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${liked ? 'text-[#ff4757]' : 'text-[#9199a3] hover:text-[#ff4757]'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? '#ff4757' : 'none'} stroke={liked ? '#ff4757' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          Like
        </button>
        <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#9199a3] hover:text-[#f77f00] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Comment
        </button>
      </div>
    </div>
  );
}

// ─── Discover Card ────────────────────────────────────────────────────────────

function DiscoverMiniCard({ post, onUnsave }: { post: SavedDiscoverSnapshot; onUnsave: (id: string) => void }) {

  return (
    <div className="border border-[#f2f2f3] rounded-2xl bg-white hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Avatar name={post.userName} url={post.userAvatarUrl} />
            <div className="min-w-0">
              <p className="text-[#18191c] text-sm font-bold leading-tight">{post.userName}</p>
              <p className="text-[#5e6670] text-xs leading-tight">{post.userRole}</p>
              <p className="text-[#9199a3] text-xs mt-0.5">{post.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button className="bg-[#ff9400] text-white text-sm font-bold px-5 py-1.5 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap">
              Get Started
            </button>
            <button onClick={() => onUnsave(post.id)} title="Remove from saved" className="text-[#ff9400] hover:text-red-400 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-[#18191c] text-base font-bold leading-snug">{post.title}</p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map(t => (
              <span key={t} className="text-xs bg-[#fff6ed] border border-[#ffd5a0] rounded-full px-3 py-1 text-[#ff9400] font-medium">{t}</span>
            ))}
          </div>
        )}

        <div className="h-px bg-[#f2f2f2]" />

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div><span className="text-[#18191c] font-medium">Mode : </span><span className="text-[#5e6670]">{post.mode}</span></div>
          <div><span className="text-[#18191c] font-medium">Payment : </span><span className="text-[#5e6670]">{post.payment}</span></div>
          <div><span className="text-[#18191c] font-medium">Audience : </span><span className="text-[#5e6670]">{post.audience}</span></div>
          <div><span className="text-[#18191c] font-medium">Last date : </span><span className="text-[#5e6670]">{post.lastDate}</span></div>
        </div>
      </div>

      {post.imageUrl && (
        <div className="px-3 pb-3">
          <div className="w-full h-[155px] rounded-lg overflow-hidden">
            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Static mini cards ────────────────────────────────────────────────────────

function LearningMiniCard({ post }: { post: typeof LEARNING_POSTS[0] }) {
  return (
    <div className="rounded-[16px] bg-white border border-[#f0f0f0] shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col overflow-hidden">
      <div className="px-3 pt-3 shrink-0"><div className="w-full h-[155px] overflow-hidden rounded-md"><img src={post.img} alt="" className="w-full h-full object-cover" /></div></div>
      <div className="px-4 pt-3 pb-4 flex flex-col gap-2.5">
        <div className="flex gap-3 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-1 min-w-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#ff9400" strokeWidth="2"/><circle cx="12" cy="9" r="2.5" stroke="#ff9400" strokeWidth="2"/></svg>
              <span className="text-[#5e6670] text-[12px] truncate">{post.university}</span>
            </div>
            <p className="text-[#18191c] text-[15px] font-bold leading-snug">{post.title}</p>
          </div>
          <div className="flex flex-col gap-2 shrink-0 w-[150px]">
            <div className="flex items-center gap-1.5">
              <button className="flex-1 bg-[#ff9400] text-white text-[13px] font-bold py-2 rounded-full hover:bg-[#e68500] transition-colors">Get Started</button>
              <button className="text-[#ff9400] shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg></button>
            </div>
            <button className="w-[calc(100%-28px)] border border-[#d0d0d0] text-[#5e6670] text-[10px] font-medium py-1.5 rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">Download Brochure</button>
          </div>
        </div>
        <div className="h-px bg-[#f2f2f2]" />
        <div className="grid grid-cols-2 gap-x-4">
          <div><p className="text-[#ff9400] text-[11px] font-semibold">Academic level</p><p className="text-[#18191c] text-[13px] mt-0.5">{post.level}</p></div>
          <div><p className="text-[#ff9400] text-[11px] font-semibold">Mode</p><p className="text-[#18191c] text-[13px] mt-0.5">{post.mode}</p></div>
        </div>
      </div>
    </div>
  );
}

function EmploymentMiniCard({ post }: { post: typeof EMPLOYMENT_POSTS[0] }) {
  return (
    <div className="border border-[#e4e5e8] rounded-2xl p-4 bg-white hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#18191c] shrink-0" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[#18191c] text-sm font-bold leading-tight">{post.role}</p>
            <p className="text-[#5e6670] text-xs">{post.company}</p>
            <p className="text-[#5e6670] text-xs">{post.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="h-[30px] px-3 bg-[#ff9400] text-white text-xs font-bold rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap">Get Started</button>
        </div>
      </div>
      <div className="h-px bg-[#f2f2f3]" />
      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs">
        <span><span className="text-[#ff9400] font-medium">Exp - </span><span className="text-[#18191c] font-semibold">{post.exp}</span></span>
        <span className="text-[#d0d3d8]">|</span>
        <span><span className="text-[#ff9400] font-medium">Salary - </span><span className="text-[#18191c] font-semibold">{post.salary}</span></span>
        <span className="text-[#d0d3d8]">|</span>
        <span><span className="text-[#ff9400] font-medium">Type - </span><span className="text-[#18191c] font-semibold">{post.type}</span></span>
      </div>
      <div className="flex items-center flex-wrap gap-1.5">
        <span className="text-[#ff9400] text-xs font-medium">Skills -</span>
        {post.skills.map(s => <span key={s} className="text-xs border border-[#e4e5e8] rounded-full px-2.5 py-0.5 text-[#18191c]">{s}</span>)}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedPostsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);
  const [discoverPosts, setDiscoverPosts] = useState<SavedDiscoverSnapshot[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(true);

  useEffect(() => {
    setLoadingCommunity(true);
    fetchSavedCommunityPosts()
      .then(setCommunityPosts)
      .catch(() => {})
      .finally(() => setLoadingCommunity(false));

    setLoadingDiscover(true);
    fetchSavedDiscoverItems()
      .then(setDiscoverPosts)
      .catch(() => {})
      .finally(() => setLoadingDiscover(false));
  }, []);

  function handleCommunityUnsave(postId: string) {
    unsavePost(postId).catch(() => {});
    setCommunityPosts(prev => prev.filter(p => p.id !== postId));
  }

  function handleDiscoverUnsave(itemId: string) {
    unsaveDiscoverItem(itemId).catch(() => {});
    setDiscoverPosts(prev => prev.filter(p => p.id !== itemId));
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-16">

          {/* My Community Post */}
          <section>
            <SectionHeader
              title="My Community Post"
              count={communityPosts.length}
              onViewAll={() => navigate('/saved/community')}
            />
            {loadingCommunity ? (
              <LoadingState />
            ) : communityPosts.length === 0 ? (
              <EmptyState
                message="No saved community posts"
                sub='Click "Save" on any home feed post and it will appear here.'
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {communityPosts.map(p => (
                  <CommunityMiniCard key={p.id} post={p} onUnsave={handleCommunityUnsave} />
                ))}
              </div>
            )}
          </section>

          {/* Discover */}
          <section>
            <SectionHeader
              title="Discover"
              count={discoverPosts.length}
              onViewAll={() => navigate('/saved/discover')}
            />
            {loadingDiscover ? (
              <LoadingState />
            ) : discoverPosts.length === 0 ? (
              <EmptyState
                message="No saved discover posts"
                sub="Bookmark any opportunity on the Discover page and it will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {discoverPosts.map(p => (
                  <DiscoverMiniCard key={p.id} post={p} onUnsave={handleDiscoverUnsave} />
                ))}
              </div>
            )}
          </section>

          {/* Learning Directory */}
          <section>
            <SectionHeader title="Learning Directory" count={0} onViewAll={() => navigate('/saved/learning')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LEARNING_POSTS.map(p => <LearningMiniCard key={p.id} post={p} />)}
            </div>
          </section>

          {/* Employment Hub */}
          <section>
            <SectionHeader title="Employment Hub" count={0} onViewAll={() => navigate('/saved/employment')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EMPLOYMENT_POSTS.map(p => <EmploymentMiniCard key={p.id} post={p} />)}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
