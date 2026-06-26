import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import PostCard from "../components/PostCard";
import PostCardSkeleton from "../components/PostCardSkeleton";
import RightPanel from "../components/RightPanel";
import PhotoUploadModal from "../components/PhotoUploadModal";
import EventModal from "../components/EventModal";
import PollModal from "../components/PollModal";
import CreatePostModal from "../components/CreatePostModal";
import { fetchFeedPosts, fetchPostById, fetchLikedPostIds, fetchLikesCounts, fetchCommentCounts, togglePostLike, FEED_PAGE_SIZE } from "../services/postService";
import type { FeedPost, FeedFilter } from "../services/postService";
import { fetchSavedPostIds, savePost, unsavePost } from "../services/savedService";
import { useProfile } from "../hooks/useProfile";


function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "{}");
  } catch {
    return {};
  }
}

function UserAvatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return <img src={url} alt={name} className="w-11 h-11 rounded-full object-cover shrink-0" />;
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-11 h-11 rounded-full bg-[#FF9400] flex items-center justify-center text-white font-bold text-sm shrink-0">
      {initials || "?"}
    </div>
  );
}

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: "all", label: "All Posts" },
  { key: "media", label: "Media" },
  { key: "polls", label: "Polls & Questions" },
  { key: "event", label: "Event" },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [linkedPost, setLinkedPost] = useState<FeedPost | null>(null);
  const [linkedPostLikes, setLinkedPostLikes] = useState(0);
  const [linkedPostComments, setLinkedPostComments] = useState(0);
  const [linkedPostLoading, setLinkedPostLoading] = useState(false);

  // Load the linked post when ?post= is in the URL
  useEffect(() => {
    const postId = searchParams.get("post");
    if (!postId) { setLinkedPost(null); return; }
    setLinkedPostLoading(true);
    fetchPostById(postId)
      .then(async (post) => {
        setLinkedPost(post);
        if (post) {
          const [likes, comments] = await Promise.all([
            fetchLikesCounts([post.id]).catch(() => ({})),
            fetchCommentCounts([post.id]).catch(() => ({})),
          ]);
          setLinkedPostLikes((likes as Record<string, number>)[post.id] ?? 0);
          setLinkedPostComments((comments as Record<string, number>)[post.id] ?? 0);
        }
      })
      .finally(() => setLinkedPostLoading(false));
  }, [searchParams]);

  function closeLinkedPost() {
    setLinkedPost(null);
    setSearchParams(prev => { prev.delete("post"); return prev; });
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const { profile: liveProfile } = useProfile("me");
  const storedUser = getStoredUser();
  
  function formatName(f?: string, l?: string, org?: string) {
    const full = [f, l].filter(s => s && s !== "unknown").join(" ");
    return full || org || "User";
  }

  const userName = liveProfile
    ? formatName(liveProfile.firstName, liveProfile.lastName, liveProfile.orgName)
    : formatName(storedUser.first_name, storedUser.last_name, storedUser.org_name);

  const userAvatarUrl = liveProfile?.avatarUrl || storedUser.avatar_url;

  useEffect(() => {
    fetchSavedPostIds().then(setSavedPostIds).catch(() => {});
    fetchLikedPostIds().then(setLikedPostIds).catch(() => {});
  }, []);

  const handleLikeToggle = useCallback((postId: string, willLike: boolean) => {
    setLikedPostIds(prev => {
      const next = new Set(prev);
      if (willLike) next.add(postId); else next.delete(postId);
      return next;
    });
    setLikesCounts(prev => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] ?? 0) + (willLike ? 1 : -1)),
    }));
    togglePostLike(postId, willLike).catch(() => {
      // revert on error
      setLikedPostIds(prev => {
        const next = new Set(prev);
        if (willLike) next.delete(postId); else next.add(postId);
        return next;
      });
      setLikesCounts(prev => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] ?? 0) + (willLike ? -1 : 1)),
      }));
    });
  }, []);

  const handleSaveToggle = useCallback((postId: string, willSave: boolean) => {
    setSavedPostIds(prev => {
      const next = new Set(prev);
      if (willSave) next.add(postId); else next.delete(postId);
      return next;
    });
    if (willSave) savePost(postId).catch(() => {});
    else unsavePost(postId).catch(() => {});
  }, []);

  // Initial load / filter change
  useEffect(() => {
    let cancelled = false;
    setLoadingPosts(true);
    setFeedError(null);
    setPosts([]);
    setPage(0);
    setHasMore(true);

    fetchFeedPosts(activeFilter, 0)
      .then(async (data) => {
        if (cancelled) return;
        setPosts(data);
        setHasMore(data.length === FEED_PAGE_SIZE);
        const ids = data.map(p => p.id);
        const [counts, cCounts] = await Promise.all([
          fetchLikesCounts(ids).catch(() => ({})),
          fetchCommentCounts(ids).catch(() => ({})),
        ]);
        if (!cancelled) { setLikesCounts(counts); setCommentCounts(cCounts); }
      })
      .catch((err) => {
        if (!cancelled) {
          setFeedError(err.message ?? "Failed to load posts.");
          setHasMore(false); // stop infinite scroll retrying on error
        }
      })
      .finally(() => { if (!cancelled) setLoadingPosts(false); });
    return () => { cancelled = true; };
  }, [activeFilter, refreshKey]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await fetchFeedPosts(activeFilter, nextPage);
      setPosts(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === FEED_PAGE_SIZE);
      const ids = data.map(p => p.id);
      const [counts, cCounts] = await Promise.all([
        fetchLikesCounts(ids).catch(() => ({})),
        fetchCommentCounts(ids).catch(() => ({})),
      ]);
      setLikesCounts(prev => ({ ...prev, ...counts }));
      setCommentCounts(prev => ({ ...prev, ...cCounts }));
    } catch {
      // silently fail — user can scroll up and back down to retry
    } finally {
      setLoadingMore(false);
    }
  }, [activeFilter, page, loadingMore, hasMore]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);


  function closeAndRefresh(setter: (v: boolean) => void) {
    return () => {
      setter(false);
      setRefreshKey((k) => k + 1);
    };
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <CreatePostModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        userAvatar={userAvatarUrl}
        userName={userName}
        onVideoMode={() => setVideoModalOpen(true)}
        onPosted={() => setRefreshKey(k => k + 1)}
      />
      <PhotoUploadModal
        isOpen={photoModalOpen}
        onClose={closeAndRefresh(setPhotoModalOpen)}
        userAvatar={userAvatarUrl || ""}
        mode="photo"
      />
      <PhotoUploadModal
        isOpen={videoModalOpen}
        onClose={closeAndRefresh(setVideoModalOpen)}
        userAvatar={userAvatarUrl || ""}
        mode="video"
      />
      <EventModal
        isOpen={eventModalOpen}
        onClose={closeAndRefresh(setEventModalOpen)}
        userAvatar={userAvatarUrl || ""}
      />
      <PollModal
        isOpen={pollModalOpen}
        onClose={closeAndRefresh(setPollModalOpen)}
        userAvatar={userAvatarUrl || ""}
      />

      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">
          {/* Center Feed */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Create Post Card */}
            <div className="bg-white border border-[#f2f2f3] rounded-[17px] shadow-[0px_4px_2px_rgba(231,231,231,0.25)] px-5 py-4">
              <div className="flex items-center gap-3 mb-4">
                <UserAvatar name={userName} url={userAvatarUrl} />
                <button
                  onClick={() => setComposeOpen(true)}
                  className="flex-1 text-left px-4 py-2.5 rounded-full border border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af] text-sm font-medium hover:bg-[#f3f4f6] hover:border-[#f77f00] transition-colors"
                >
                  What do you want to talk about?
                </button>
              </div>
              <div className="flex items-center justify-around pt-2 border-t border-[#f2f2f3] flex-wrap gap-2">
                <button
                  onClick={() => setPhotoModalOpen(true)}
                  className="flex items-center gap-2 text-[#474d57] text-sm sm:text-base font-medium hover:text-[#FF9400] transition-colors py-1"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Photo
                </button>
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="flex items-center gap-2 text-[#474d57] text-sm sm:text-base font-medium hover:text-[#FF9400] transition-colors py-1"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
                  Video
                </button>
                <button
                  onClick={() => setEventModalOpen(true)}
                  className="flex items-center gap-2 text-[#605f5f] text-sm sm:text-base font-medium hover:text-[#FF9400] transition-colors py-1"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Event
                </button>
                <button
                  onClick={() => setPollModalOpen(true)}
                  className="flex items-center gap-2 text-[#474d57] text-sm sm:text-base font-medium hover:text-[#FF9400] transition-colors py-1"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="hidden sm:inline">Polls &amp; Questions</span>
                  <span className="sm:hidden">Polls</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`text-sm sm:text-base font-medium px-4 sm:px-6 py-2 rounded-full h-[38px] whitespace-nowrap shrink-0 transition-colors ${
                    activeFilter === f.key
                      ? "bg-[#FF9400] text-white"
                      : "bg-white border border-[#FF9400] text-[#FF9400] hover:bg-[#fff8ee]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Feed */}
            <div className="flex flex-col gap-5">
              {/* Initial shimmer skeletons */}
              {loadingPosts && [1, 2, 3].map(i => <PostCardSkeleton key={i} />)}

              {/* Error */}
              {!loadingPosts && feedError && (
                <div className="bg-white rounded-2xl border border-[#ececec] p-8 text-center flex flex-col items-center gap-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-400">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-[#18191c] text-sm font-semibold">Could not load posts</p>
                  <p className="text-[#9ca3af] text-xs">
                    {feedError.includes("fetch")
                      ? "Connection failed. Check your internet or try resuming your Supabase project."
                      : feedError}
                  </p>
                  <button
                    onClick={() => setRefreshKey(k => k + 1)}
                    className="mt-1 px-5 py-2 bg-[#FF9400] text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty */}
              {!loadingPosts && !feedError && posts.length === 0 && (
                <div className="bg-white rounded-2xl border border-[#ececec] p-8 text-center text-[#9ca3af] text-sm">
                  No posts yet. Be the first to share something!
                </div>
              )}

              {/* Posts */}
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isSaved={savedPostIds.has(post.id)}
                  onSaveToggle={handleSaveToggle}
                  isLiked={likedPostIds.has(post.id)}
                  likesCount={likesCounts[post.id] ?? 0}
                  onLikeToggle={handleLikeToggle}
                  commentsCount={commentCounts[post.id] ?? 0}
                  onCommentAdded={() => setCommentCounts(prev => ({ ...prev, [post.id]: (prev[post.id] ?? 0) + 1 }))}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} />

              {/* Load-more shimmer */}
              {loadingMore && [1, 2].map(i => <PostCardSkeleton key={`more-${i}`} />)}

              {/* End of feed */}
              {!loadingPosts && !hasMore && posts.length > 0 && (
                <p className="text-center text-[#9199a3] text-sm py-4">You're all caught up!</p>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="hidden xl:block w-[340px] shrink-0 self-start sticky top-[-155px]">
            <RightPanel />
          </div>
        </div>
      </div>

      {/* Linked post modal — opened from "View Post" in messages */}
      {(linkedPost || linkedPostLoading) && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={closeLinkedPost}
        >
          <div
            className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            {linkedPostLoading ? (
              <div className="bg-white rounded-2xl p-10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#FF9400] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : linkedPost ? (
              <>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={closeLinkedPost}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PostCard
                  post={linkedPost}
                  isLiked={likedPostIds.has(linkedPost.id)}
                  likesCount={linkedPostLikes}
                  onLikeToggle={handleLikeToggle}
                  isSaved={savedPostIds.has(linkedPost.id)}
                  onSaveToggle={handleSaveToggle}
                  commentsCount={linkedPostComments}
                  onCommentAdded={() => setLinkedPostComments(c => c + 1)}
                  inModal={true}
                />
              </>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center text-[#9ca3af] text-sm">
                Post not found or has been removed.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
