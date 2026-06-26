import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import RightPanel from '../components/RightPanel';
import PostCard from '../components/PostCard';
import { searchGlobal, type SearchUser } from '../services/searchService';
import type { FeedPost } from '../services/postService';
import {
  fetchLikedPostIds,
  fetchLikesCounts,
  fetchCommentCounts,
  togglePostLike,
} from '../services/postService';
import { fetchSavedPostIds, savePost, unsavePost } from '../services/savedService';

type Tab = 'all' | 'people' | 'posts';

function Avatar({ name, url, size = 48 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  if (url) return <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full bg-[#f77f00] flex items-center justify-center text-white font-bold shrink-0" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f2f2f3] rounded ${className}`} />;
}

function PeopleSkeletons() {
  return (
    <div className="divide-y divide-[#f2f2f3]">
      {[0, 1, 2].map(i => (
        <div key={i} className="flex items-center gap-4 py-4 px-5">
          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function PostCardSkeletons() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-[#f2f2f3] p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function PersonRow({ user, onView }: { user: SearchUser; onView: (id: string) => void }) {
  return (
    <div
      onClick={() => onView(user.id)}
      className="flex items-center gap-4 py-4 px-5 hover:bg-[#f9fafb] transition-colors cursor-pointer"
    >
      <Avatar name={user.name} url={user.avatar_url} size={52} />
      <div className="flex-1 min-w-0">
        <p className="text-[#18191c] font-semibold text-[15px] truncate">{user.name}</p>
        {user.title && <p className="text-[#6b7280] text-sm truncate">{user.title}</p>}
      </div>
      <span className="shrink-0 border border-[#f77f00] text-[#f77f00] text-sm font-semibold px-4 py-1.5 rounded-full">
        View Profile
      </span>
    </div>
  );
}

export default function SearchResultsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [tab, setTab] = useState<Tab>('all');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsFallback, setPostsFallback] = useState(false);
  const [loading, setLoading] = useState(false);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setTab('all');
    if (!query.trim()) { setUsers([]); setPosts([]); return; }
    setLoading(true);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    searchGlobal(query)
      .then(async res => {
        setUsers(res.users);
        setPosts(res.posts);
        setPostsFallback(res.postsFallback);

        if (res.posts.length > 0) {
          const ids = res.posts.map(p => p.id);
          const [liked, counts, comments, saved] = await Promise.all([
            fetchLikedPostIds().catch(() => new Set<string>()),
            fetchLikesCounts(ids).catch(() => ({} as Record<string, number>)),
            fetchCommentCounts(ids).catch(() => ({} as Record<string, number>)),
            fetchSavedPostIds().catch(() => new Set<string>()),
          ]);
          setLikedIds(liked);
          setLikesCounts(counts as Record<string, number>);
          setCommentCounts(comments as Record<string, number>);
          setSavedIds(saved);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  function handleLikeToggle(postId: string, liked: boolean) {
    setLikedIds(prev => { const n = new Set(prev); liked ? n.add(postId) : n.delete(postId); return n; });
    setLikesCounts(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 0) + (liked ? 1 : -1)) }));
    togglePostLike(postId, liked).catch(() => {});
  }

  function handleSaveToggle(postId: string, saved: boolean) {
    setSavedIds(prev => { const n = new Set(prev); saved ? n.add(postId) : n.delete(postId); return n; });
    (saved ? savePost(postId) : unsavePost(postId)).catch(() => {});
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: users.length + posts.length },
    { id: 'people', label: 'People', count: users.length },
    { id: 'posts', label: 'Posts', count: posts.length },
  ];

  const showUsers = tab === 'all' || tab === 'people';
  const showPosts = tab === 'all' || tab === 'posts';
  const noResults = !loading && users.length === 0 && posts.length === 0 && query.trim();

  const visiblePosts = tab === 'all' ? posts.slice(0, 5) : posts;

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">
          <div className="flex-1 min-w-0">

          {query && (
            <p className="text-[#6b7280] text-sm mb-4">
              {loading
                ? 'Searching…'
                : <span className="text-[#18191c]">Results for <span className="font-semibold">"{query}"</span></span>
              }
            </p>
          )}

          {/* Tabs — sticky below topbar */}
          {query && (
            <div className="sticky top-[64px] sm:top-[72px] lg:top-[78px] z-20 flex gap-1 mb-5 bg-white rounded-2xl border border-[#f2f2f3] p-1 shadow-sm">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                    tab === t.id ? 'bg-[#f77f00] text-white' : 'text-[#6b7280] hover:text-[#18191c] hover:bg-[#f9fafb]'
                  }`}
                >
                  {t.label}
                  {!loading && t.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      tab === t.id ? 'bg-white/20 text-white' : 'bg-[#f2f2f3] text-[#6b7280]'
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Empty states */}
          {!query && (
            <div className="bg-white rounded-2xl border border-[#f2f2f3] p-12 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 text-[#d1d5db]">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[#18191c] font-semibold text-base mb-1">Search Impactshaala</p>
              <p className="text-[#6b7280] text-sm">Find people and posts</p>
            </div>
          )}

          {noResults && (
            <div className="bg-white rounded-2xl border border-[#f2f2f3] p-12 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 text-[#d1d5db]">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[#18191c] font-semibold text-base mb-1">No results found</p>
              <p className="text-[#6b7280] text-sm">Try different keywords</p>
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* People */}
            {showUsers && (
              loading ? (
                <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">
                  <p className="px-5 pt-4 pb-2 text-[#18191c] font-bold text-base">People</p>
                  <PeopleSkeletons />
                </div>
              ) : users.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <p className="text-[#18191c] font-bold text-base">People</p>
                    {tab === 'all' && users.length > 3 && (
                      <button onClick={() => setTab('people')} className="text-[#f77f00] text-sm font-medium hover:underline">
                        See all {users.length}
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-[#f2f2f3]">
                    {(tab === 'all' ? users.slice(0, 3) : users).map(u => (
                      <PersonRow key={u.id} user={u} onView={id => navigate(`/profile/${id}`)} />
                    ))}
                  </div>
                </div>
              ) : null
            )}

            {/* Posts */}
            {showPosts && (
              loading ? (
                <>
                  {tab !== 'all' && postsFallback === false && (
                    <p className="text-[#6b7280] text-sm font-medium">Posts</p>
                  )}
                  <PostCardSkeletons />
                </>
              ) : posts.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#18191c] font-bold text-base">Posts</p>
                      {postsFallback && (
                        <p className="text-[#9ca3af] text-xs mt-0.5">Showing recent posts — no exact matches found</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {visiblePosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        isLiked={likedIds.has(post.id)}
                        likesCount={likesCounts[post.id] ?? 0}
                        onLikeToggle={handleLikeToggle}
                        commentsCount={commentCounts[post.id] ?? 0}
                        isSaved={savedIds.has(post.id)}
                        onSaveToggle={handleSaveToggle}
                      />
                    ))}
                  </div>
                </>
              ) : null
            )}
          </div>

          </div>

          {/* Right sidebar — same as home page */}
          <div className="hidden xl:block w-[340px] shrink-0 self-start sticky top-[-155px]">
            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
