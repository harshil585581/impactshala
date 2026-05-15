import { useState } from 'react';
import type { FeedPost } from '../services/postService';

function ThumbsUpIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="#4a90d9"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" fill="#5a9ce8"/></svg>;
}
function HeartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="#e74c3c"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
}
function ClapIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="#f39c12"><path d="M12 2a1 1 0 011 1v8h4a2 2 0 012 2v2a6 6 0 01-6 6H9a6 6 0 01-6-6v-4a1 1 0 011-1h2V5a1 1 0 012 0v5h2V3a1 1 0 011-1z"/></svg>;
}
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

export default function PostCard({ post }: { post: FeedPost }) {
  const [voted, setVoted] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const name = getDisplayName(post.user);

  return (
    <div className="bg-white border border-[#ececec] rounded-2xl shadow-[0px_1px_1px_rgba(0,0,0,0.05)] overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={name} url={post.user?.avatar_url} />
          <div className="flex flex-col">
            <span className="font-bold text-[#18191c] text-base leading-tight block">{name}</span>
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
        <button className="text-[#FF9400] text-sm font-semibold flex items-center gap-1 hover:opacity-80">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#FF9400" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Follow
        </button>
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
              {post.poll_options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setVoted(voted === i ? null : i)}
                  className={`w-full text-left border rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    voted === i
                      ? 'border-[#FF9400] bg-[#fff8ee] text-[#FF9400]'
                      : 'border-[#e0e0e0] text-[#333] hover:border-[#FF9400] hover:bg-[#fff8ee]'
                  }`}
                >
                  {opt}
                </button>
              ))}
              <p className="text-[#888] text-xs mt-1">
                {voted !== null ? 'You voted · ' : ''}{post.poll_options.length} options
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
          <div className="flex">
            <ThumbsUpIcon />
            <span className="-ml-1"><HeartIcon /></span>
            <span className="-ml-1"><ClapIcon /></span>
          </div>
          <span className="text-[#646464] text-sm">{liked ? 1 : 0}</span>
        </div>
        <span className="text-[#6f6f6f] text-sm">0 comments</span>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-around border-t border-[#f2f2f3]">
        <button
          onClick={() => setLiked(v => !v)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${liked ? 'text-[#FF9400]' : 'text-[#575555] hover:bg-gray-50'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Like
        </button>
        <button className="flex items-center gap-1.5 text-[#575555] text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Comment
        </button>
        <button className="flex items-center gap-1.5 text-[#575555] text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Share
        </button>
        <button
          onClick={() => setSaved(v => !v)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${saved ? 'text-[#FF9400]' : 'text-[#575555] hover:bg-gray-50'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Save
        </button>
      </div>
    </div>
  );
}
