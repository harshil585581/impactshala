import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import PostCard from '../../components/PostCard';
import PostCardSkeleton from '../../components/PostCardSkeleton';
import {
  fetchUserPosts,
  fetchLikedPostIds,
  fetchLikesCounts,
  fetchCommentCounts,
  togglePostLike,
  deletePost,
  type FeedPost,
} from '../../services/postService';
import { fetchSavedPostIds, savePost, unsavePost } from '../../services/savedService';

export default function UserPostsPage() {
  const { userId = 'me' } = useParams<{ userId?: string }>();
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const resolvedUserId = userId === 'me' ? storedUser.id : userId;
  const isOwn = userId === 'me' || resolvedUserId === storedUser.id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!resolvedUserId) return;
    setLoading(true);
    fetchUserPosts(resolvedUserId)
      .then(async (fetched) => {
        setPosts(fetched);
        if (fetched.length === 0) return;
        const ids = fetched.map((p) => p.id);
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
      .finally(() => setLoading(false));
  }, [resolvedUserId]);

  const handleLikeToggle = useCallback((postId: string, willLike: boolean) => {
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (willLike) next.add(postId); else next.delete(postId);
      return next;
    });
    setLikesCounts((prev) => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] ?? 0) + (willLike ? 1 : -1)),
    }));
    togglePostLike(postId, willLike).catch(() => {
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (willLike) next.delete(postId); else next.add(postId);
        return next;
      });
      setLikesCounts((prev) => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] ?? 0) + (willLike ? -1 : 1)),
      }));
    });
  }, []);

  const handleSaveToggle = useCallback((postId: string, willSave: boolean) => {
    setSavedPostIds((prev) => {
      const next = new Set(prev);
      if (willSave) next.add(postId); else next.delete(postId);
      return next;
    });
    if (willSave) savePost(postId).catch(() => {});
    else unsavePost(postId).catch(() => {});
  }, []);

  const handleDelete = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    deletePost(postId).catch(() => {
      // re-fetch on error is complex; just leave optimistic update
    });
  }, []);

  const profilePath = userId === 'me' ? '/profile/me' : `/profile/${userId}`;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(profilePath)}
            className="text-[#9199a3] hover:text-[#18191c] transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-[#18191c] text-lg font-semibold">All Posts</h1>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#f2f2f3] p-12 text-center">
            <p className="text-[#9199a3] text-sm">No posts yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isLiked={likedPostIds.has(post.id)}
                likesCount={likesCounts[post.id] ?? 0}
                onLikeToggle={handleLikeToggle}
                commentsCount={commentCounts[post.id] ?? 0}
                onCommentAdded={() =>
                  setCommentCounts((prev) => ({ ...prev, [post.id]: (prev[post.id] ?? 0) + 1 }))
                }
                isSaved={savedPostIds.has(post.id)}
                onSaveToggle={handleSaveToggle}
                onDelete={isOwn ? handleDelete : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
