import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import {
  fetchSavedCommunityPosts,
  fetchSavedDiscoverItems,
  fetchSavedLearningCourses,
  fetchSavedEmploymentPostings,
  unsavePost,
  unsaveDiscoverItem,
  unsaveLearningCourse,
  unsaveEmploymentPosting,
  type SavedDiscoverSnapshot,
  type SavedLearningSnapshot,
} from '../services/savedService';
import {
  fetchLikedPostIds,
  fetchLikesCounts,
  fetchCommentCounts,
  togglePostLike,
  type FeedPost,
} from '../services/postService';
import {
  fetchSavedPostIds,
  savePost,
} from '../services/savedService';
import type { EmployerPosting } from '../services/employmentService';
import ApplyModal from '../components/discover/ApplyModal';
import PostDetailModal from '../components/profile/PostDetailModal';

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

function CommunityMiniCard({ post, onUnsave, onOpenPost }: { post: FeedPost; onUnsave: (id: string) => void; onOpenPost: (post: FeedPost) => void }) {
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
        {/* Right: unsave bookmark + 3-dot menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUnsave(post.id)}
            title="Remove from saved"
            className="text-[#f77f00] hover:opacity-75 transition-opacity"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
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
        <div
          className="bg-[#232246] rounded-xl overflow-hidden mb-3 cursor-pointer"
          onClick={() => onOpenPost(post)}
        >
          <img
            src={post.media_urls![0]}
            alt=""
            className="w-full h-[280px] object-cover block hover:opacity-90 transition-opacity"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Event cover */}
      {isEvent && post.cover_image_url && (
        <div
          className="bg-[#232246] rounded-xl overflow-hidden mb-3 cursor-pointer"
          onClick={() => onOpenPost(post)}
        >
          <img
            src={post.cover_image_url}
            alt=""
            className="w-full h-[280px] object-cover block hover:opacity-90 transition-opacity"
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

    </div>
  );
}

// ─── Discover Card ────────────────────────────────────────────────────────────

function DiscoverMiniCard({ post, onUnsave, onGetStarted, onOpenPost }: { post: SavedDiscoverSnapshot; onUnsave: (id: string) => void; onGetStarted: (id: string) => void; onOpenPost: (post: SavedDiscoverSnapshot) => void }) {

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
            <button onClick={() => onGetStarted(post.id)} className="bg-[#ff9400] text-white text-sm font-bold px-5 py-1.5 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap">
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
          <div
            className="w-full h-[280px] rounded-lg overflow-hidden cursor-pointer"
            onClick={() => onOpenPost(post)}
          >
            <img src={post.imageUrl} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Static mini cards ────────────────────────────────────────────────────────

function LearningMiniCard({ post, onUnsave, onGetStarted }: { post: SavedLearningSnapshot; onUnsave: (id: string) => void; onGetStarted: (id: string) => void }) {
  return (
    <div className="bg-white border border-[#c5c5c5] rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer">

      {/* Cover image */}
      <div className="w-full h-[200px] overflow-hidden shrink-0">
        {post.image ? (
          <img src={post.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#f3f2f1] flex items-center justify-center text-[#9ca3af] text-xs">No image</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">

        {/* University + Title row */}
        <div className="flex items-start justify-between gap-3">

          {/* Left: location + title */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#f77f00" strokeWidth="2"/>
                <circle cx="12" cy="9" r="2.5" stroke="#f77f00" strokeWidth="2"/>
              </svg>
              <span className="text-[#18191c] text-sm font-medium truncate">{post.university}</span>
            </div>
            <p className="text-[#18191c] text-base font-bold leading-snug">{post.title}</p>
          </div>

          {/* Right: buttons + bookmark */}
          <div className="flex items-start gap-2 shrink-0">
            <div className="flex flex-col gap-1.5">
              <button onClick={() => onGetStarted(post.id)} className="bg-[#f77f00] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap border border-white">
                Get Started
              </button>
              {post.brochureUrl && (
                <a href={post.brochureUrl} target="_blank" rel="noopener noreferrer"
                  className="border border-[#b4b4b4] text-[#18191c] text-xs font-medium px-3 py-1.5 rounded-full hover:border-[#f77f00] hover:text-[#f77f00] transition-colors whitespace-nowrap text-center">
                  Download Brochure
                </a>
              )}
            </div>
            <button
              onClick={() => onUnsave(post.id)}
              className="text-[#f77f00] hover:opacity-75 transition-opacity mt-0.5"
              aria-label="Unsave"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Info grid row 1 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-[#f77f00] text-xs">Academic level</p>
            <p className="text-[#18191c] text-sm font-medium">{post.level}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[#f77f00] text-xs">Mode</p>
            <p className="text-[#18191c] text-sm font-medium">{post.mode}</p>
          </div>
        </div>

        {/* Info grid row 2 */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-[#f77f00] text-xs">Course Fee</p>
            <p className="text-[#18191c] text-sm font-medium">{post.fee}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[#f77f00] text-xs">Duration</p>
            <p className="text-[#18191c] text-sm font-medium">{post.duration}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[#f77f00] text-xs">Application Deadline</p>
            <p className="text-[#18191c] text-sm font-medium">{post.deadline}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmploymentMiniCard({ post, onUnsave, onGetStarted }: { post: EmployerPosting; onUnsave: (id: string) => void; onGetStarted: (id: string) => void }) {
  const skills = post.preferred_skillsets
    ? post.preferred_skillsets.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-white border border-[#c5c5c5] rounded-xl p-6 flex flex-col gap-5 hover:shadow-md transition-shadow cursor-pointer min-h-[200px]">

      {/* Header: avatar + info + actions */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: avatar + job info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#18191c] shrink-0" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[#18191c] text-sm font-semibold leading-tight truncate">{post.job_title}</p>
            <p className="text-[#18191c] text-xs leading-tight">{post.org_name}</p>
            {post.work_mode && <p className="text-[#18191c] text-xs leading-tight">{post.work_mode}</p>}
          </div>
        </div>

        {/* Right: Get Started + unsave bookmark */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onGetStarted(post.id)} className="bg-[#f77f00] text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap border border-white">
            Get Started
          </button>
          <button
            onClick={() => onUnsave(post.id)}
            className="text-[#f77f00] hover:opacity-75 transition-opacity"
            aria-label="Unsave"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Career level · Salary · Type */}
      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs">
        {post.career_level && (
          <>
            <span className="text-[#f77f00] font-medium">Exp -</span>
            <span className="text-[#18191c] font-semibold">{post.career_level}</span>
            <span className="text-[#e0dedd] font-medium text-sm">|</span>
          </>
        )}
        {post.compensation && (
          <>
            <span className="text-[#f77f00] font-medium">Salary -</span>
            <span className="text-[#18191c] font-semibold">{post.compensation}</span>
            <span className="text-[#e0dedd] font-medium text-sm">|</span>
          </>
        )}
        {post.job_type && (
          <>
            <span className="text-[#f77f00] font-medium">Type -</span>
            <span className="text-[#18191c] font-semibold">{post.job_type}</span>
          </>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[#f77f00] text-xs font-medium">Skills -</span>
          {skills.map(s => (
            <span key={s} className="bg-[#f3f2f1] text-[#18191c] text-[11px] px-2 py-0.5 rounded-[3px]">{s}</span>
          ))}
        </div>
      )}

      {/* Footer: posted time + show more */}
      <div className="flex items-center justify-between pt-0.5 border-t border-[#f2f2f3]">
        <span className="text-[#6e6e6e] text-xs">{relativeTime(post.created_at)}</span>
        <button className="text-[#f77f00] text-xs font-medium hover:opacity-80 transition-opacity">Show more</button>
      </div>
    </div>
  );
}

// ─── Discover detail modal ────────────────────────────────────────────────────

function DiscoverDetailModal({ post, onClose, onUnsave }: { post: SavedDiscoverSnapshot; onClose: () => void; onUnsave: (id: string) => void }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.reactions);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] mt-6 mb-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
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

        {/* Card */}
        <div className="bg-white border border-[#c5c5c5] rounded-xl p-4 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start gap-2.5 w-full">
            <Avatar name={post.userName} url={post.userAvatarUrl} size={50} />
            <div className="flex flex-1 min-w-0 items-start gap-2">
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <p className="text-[#222] text-[15px] font-semibold leading-tight">{post.userName}</p>
                <p className="text-[#666] text-[12px]">{post.userRole}</p>
                <p className="text-[#787777] text-[12px]">{post.time}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="bg-[#f77f00] text-white text-[13px] font-semibold px-5 py-2 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap">
                  Get Started
                </button>
                <button onClick={() => { onUnsave(post.id); onClose(); }} title="Remove from saved" className="text-[#f77f00] hover:opacity-75 transition-opacity">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-[#222] text-[17px] font-semibold leading-snug">{post.title}</h3>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map(t => (
                <span key={t} className="bg-[#fff4e5] text-black text-[10.5px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap">{t}</span>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="flex flex-col gap-2 text-[12px]">
            <div className="flex gap-6">
              <div className="flex-1"><span className="text-[#18191c] font-normal">Mode : </span><span className="text-[#717171]">{post.mode}</span></div>
              <div className="flex-1"><span className="text-[#18191c] font-normal">Payment : </span><span className="text-[#717171]">{post.payment}</span></div>
            </div>
            <div className="flex gap-6">
              <div className="flex-1"><span className="text-[#18191c] font-normal">Target audience : </span><span className="text-[#717171]">{post.audience}</span></div>
              <div className="flex-1"><span className="text-[#18191c] font-normal">Last date : </span><span className="text-[#717171]">{post.lastDate}</span></div>
            </div>
          </div>

          {/* Image */}
          {post.imageUrl && (
            <div className="w-full rounded-[10px] overflow-hidden">
              <img src={post.imageUrl} alt="" className="w-full object-cover block" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-[9.5px] font-semibold">
            <div className="flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? '#ff4757' : 'none'} stroke={liked ? '#ff4757' : '#646464'} strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <span className="text-[#646464]">{likesCount.toLocaleString()}</span>
            </div>
            <span className="text-[#6f6f6f]">{post.comments} comments</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#f2f2f3]" />

          {/* Action bar */}
          <div className="flex items-center justify-around">
            <button
              onClick={() => { setLiked(v => !v); setLikesCount(n => n + (liked ? -1 : 1)); }}
              className={`flex items-center gap-1.5 text-[12px] font-medium py-1 px-3 rounded-md transition-colors ${liked ? 'text-[#f77f00]' : 'text-[#575555] hover:text-[#f77f00] hover:bg-[#fff8ee]'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
              </svg>
              Like
            </button>
            <button className="flex items-center gap-1.5 text-[12px] font-medium py-1 px-3 rounded-md text-[#575555] hover:text-[#f77f00] hover:bg-[#fff8ee] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Comment
            </button>
            <button className="flex items-center gap-1.5 text-[12px] font-medium py-1 px-3 rounded-md text-[#575555] hover:text-[#f77f00] hover:bg-[#fff8ee] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
              </svg>
              Share
            </button>
            <button onClick={() => { onUnsave(post.id); onClose(); }} className="flex items-center gap-1.5 text-[12px] font-medium py-1 px-3 rounded-md text-[#f77f00] hover:bg-[#fff8ee] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
              Saved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedPostsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applyPostId, setApplyPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [selectedDiscover, setSelectedDiscover] = useState<SavedDiscoverSnapshot | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);
  const [discoverPosts, setDiscoverPosts] = useState<SavedDiscoverSnapshot[]>([]);
  const [learningCourses, setLearningCourses] = useState<SavedLearningSnapshot[]>([]);
  const [employmentPostings, setEmploymentPostings] = useState<EmployerPosting[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [loadingLearning, setLoadingLearning] = useState(true);
  const [loadingEmployment, setLoadingEmployment] = useState(true);

  useEffect(() => {
    setLoadingCommunity(true);
    fetchSavedCommunityPosts()
      .then(async (posts) => {
        setCommunityPosts(posts);
        if (posts.length === 0) return;
        const ids = posts.map(p => p.id);
        const [liked, likesCts, commentCts, saved] = await Promise.all([
          fetchLikedPostIds().catch(() => new Set<string>()),
          fetchLikesCounts(ids).catch(() => ({} as Record<string, number>)),
          fetchCommentCounts(ids).catch(() => ({} as Record<string, number>)),
          fetchSavedPostIds().catch(() => new Set<string>()),
        ]);
        setLikedPostIds(liked);
        setLikesCounts(likesCts as Record<string, number>);
        setCommentCounts(commentCts as Record<string, number>);
        setSavedPostIds(saved);
      })
      .catch(() => {})
      .finally(() => setLoadingCommunity(false));

    setLoadingDiscover(true);
    fetchSavedDiscoverItems()
      .then(setDiscoverPosts)
      .catch(() => {})
      .finally(() => setLoadingDiscover(false));

    setLoadingLearning(true);
    fetchSavedLearningCourses()
      .then(setLearningCourses)
      .catch(() => {})
      .finally(() => setLoadingLearning(false));

    setLoadingEmployment(true);
    fetchSavedEmploymentPostings()
      .then(setEmploymentPostings)
      .catch(() => {})
      .finally(() => setLoadingEmployment(false));
  }, []);

  function handleCommunityUnsave(postId: string) {
    unsavePost(postId).catch(() => {});
    setCommunityPosts(prev => prev.filter(p => p.id !== postId));
  }

  function handlePostLikeToggle(postId: string, willLike: boolean) {
    setLikedPostIds(prev => { const next = new Set(prev); if (willLike) next.add(postId); else next.delete(postId); return next; });
    setLikesCounts(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 0) + (willLike ? 1 : -1)) }));
    togglePostLike(postId, willLike).catch(() => {});
  }

  function handlePostSaveToggle(postId: string, willSave: boolean) {
    setSavedPostIds(prev => { const next = new Set(prev); if (willSave) next.add(postId); else next.delete(postId); return next; });
    if (willSave) savePost(postId).catch(() => {}); else unsavePost(postId).catch(() => {});
  }

  function handleDiscoverUnsave(itemId: string) {
    unsaveDiscoverItem(itemId).catch(() => {});
    setDiscoverPosts(prev => prev.filter(p => p.id !== itemId));
  }

  function handleLearningUnsave(courseId: string) {
    unsaveLearningCourse(courseId).catch(() => {});
    setLearningCourses(prev => prev.filter(p => p.id !== courseId));
  }

  function handleEmploymentUnsave(postingId: string) {
    unsaveEmploymentPosting(postingId).catch(() => {});
    setEmploymentPostings(prev => prev.filter(p => p.id !== postingId));
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
                {communityPosts.slice(0, 4).map(p => (
                  <CommunityMiniCard key={p.id} post={p} onUnsave={handleCommunityUnsave} onOpenPost={setSelectedPost} />
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
                {discoverPosts.slice(0, 4).map(p => (
                  <DiscoverMiniCard key={p.id} post={p} onUnsave={handleDiscoverUnsave} onGetStarted={setApplyPostId} onOpenPost={setSelectedDiscover} />
                ))}
              </div>
            )}
          </section>

          {/* Learning Directory */}
          <section>
            <SectionHeader title="Learning Directory" count={learningCourses.length} onViewAll={() => navigate('/saved/learning')} />
            {loadingLearning ? (
              <LoadingState />
            ) : learningCourses.length === 0 ? (
              <EmptyState
                message="No saved courses"
                sub="Bookmark any course on the Learning Directory page and it will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {learningCourses.slice(0, 4).map(p => (
                  <LearningMiniCard key={p.id} post={p} onUnsave={handleLearningUnsave} onGetStarted={(id) => navigate(`/learning-directory?apply=${id}`)} />
                ))}
              </div>
            )}
          </section>

          {/* Employment Hub */}
          <section>
            <SectionHeader title="Employment Hub" count={employmentPostings.length} onViewAll={() => navigate('/saved/employment')} />
            {loadingEmployment ? (
              <LoadingState />
            ) : employmentPostings.length === 0 ? (
              <EmptyState
                message="No saved employment postings"
                sub="Bookmark any job posting on the Employment Hub page and it will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employmentPostings.slice(0, 4).map(p => (
                  <EmploymentMiniCard key={p.id} post={p} onUnsave={handleEmploymentUnsave} onGetStarted={(id) => navigate(`/employment-hub?apply=${id}`)} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      {applyPostId && (
        <ApplyModal
          postId={applyPostId}
          postTitle={discoverPosts.find(p => p.id === applyPostId)?.title}
          onClose={() => setApplyPostId(null)}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isLiked={likedPostIds.has(selectedPost.id)}
          likesCount={likesCounts[selectedPost.id] ?? 0}
          onLikeToggle={handlePostLikeToggle}
          isSaved={savedPostIds.has(selectedPost.id)}
          onSaveToggle={handlePostSaveToggle}
          commentsCount={commentCounts[selectedPost.id] ?? 0}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {selectedDiscover && (
        <DiscoverDetailModal
          post={selectedDiscover}
          onClose={() => setSelectedDiscover(null)}
          onUnsave={(id) => { handleDiscoverUnsave(id); setSelectedDiscover(null); }}
        />
      )}
    </div>
  );
}
