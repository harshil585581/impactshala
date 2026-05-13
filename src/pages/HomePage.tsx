import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import PostCard from "../components/PostCard";
import RightPanel from "../components/RightPanel";
import PhotoUploadModal from "../components/PhotoUploadModal";
import EventModal from "../components/EventModal";
import PollModal from "../components/PollModal";
import { fetchFeedPosts } from "../services/postService";
import type { FeedPost, FeedFilter } from "../services/postService";
import { useProfile } from "../hooks/useProfile";

const photoIcon =
  "https://www.figma.com/api/mcp/asset/c696f684-d3f3-4907-b008-73ed5cba4a1a";
const videoIcon =
  "https://www.figma.com/api/mcp/asset/9d704024-5c9b-4ffa-98a4-721c38438562";
const calendarIcon =
  "https://www.figma.com/api/mcp/asset/48f6342c-cac0-4bf5-9852-32a8e961d946";
const pollIcon =
  "https://www.figma.com/api/mcp/asset/0725c9c3-1452-4a15-9b96-ef174d64e430";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { profile: liveProfile } = useProfile("me");
  const storedUser = getStoredUser();
  
  const userName = liveProfile
    ? [liveProfile.firstName, liveProfile.lastName].filter(Boolean).join(" ") || liveProfile.orgName
    : [storedUser.first_name, storedUser.last_name].filter(Boolean).join(" ") || storedUser.org_name || "You";

  const userAvatarUrl = liveProfile?.avatarUrl || storedUser.avatar_url;

  useEffect(() => {
    let cancelled = false;
    setLoadingPosts(true);
    setFeedError(null);
    fetchFeedPosts(activeFilter)
      .then((data) => { if (!cancelled) setPosts(data); })
      .catch((err) => { if (!cancelled) setFeedError(err.message ?? "Failed to load posts."); })
      .finally(() => { if (!cancelled) setLoadingPosts(false); });
    return () => { cancelled = true; };
  }, [activeFilter, refreshKey]);

  function closeAndRefresh(setter: (v: boolean) => void) {
    return () => {
      setter(false);
      setRefreshKey((k) => k + 1);
    };
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <PhotoUploadModal
        isOpen={photoModalOpen}
        onClose={closeAndRefresh(setPhotoModalOpen)}
        userAvatar=""
        mode="photo"
      />
      <PhotoUploadModal
        isOpen={videoModalOpen}
        onClose={closeAndRefresh(setVideoModalOpen)}
        userAvatar=""
        mode="video"
      />
      <EventModal
        isOpen={eventModalOpen}
        onClose={closeAndRefresh(setEventModalOpen)}
        userAvatar=""
      />
      <PollModal
        isOpen={pollModalOpen}
        onClose={closeAndRefresh(setPollModalOpen)}
        userAvatar=""
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
                <div className="flex-1 bg-white border border-[#f2f2f3] rounded-full px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-[#474d57] text-base font-medium">
                    Start a post
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-around pt-2 border-t border-[#f2f2f3] flex-wrap gap-2">
                <button
                  onClick={() => setPhotoModalOpen(true)}
                  className="flex items-center gap-2 text-[#474d57] text-sm sm:text-base font-medium hover:text-[#FF9400] transition-colors py-1"
                >
                  <img src={photoIcon} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
                  Photo
                </button>
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="flex items-center gap-2 text-[#474d57] text-sm sm:text-base font-medium hover:text-[#FF9400] transition-colors py-1"
                >
                  <img src={videoIcon} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
                  Video
                </button>
                <button
                  onClick={() => setEventModalOpen(true)}
                  className="flex items-center gap-2 text-[#605f5f] text-sm sm:text-base font-medium hover:text-[#FF9400] transition-colors py-1"
                >
                  <img src={calendarIcon} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span className="hidden sm:inline">Event</span>
                  <span className="sm:hidden">Event</span>
                </button>
                <button
                  onClick={() => setPollModalOpen(true)}
                  className="flex items-center gap-2 text-[#474d57] text-sm sm:text-base font-medium hover:text-[#FF9400] transition-colors py-1"
                >
                  <img src={pollIcon} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
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
              {loadingPosts && (
                <div className="bg-white rounded-2xl border border-[#ececec] p-8 text-center text-[#9ca3af] text-sm">
                  Loading posts…
                </div>
              )}

              {!loadingPosts && feedError && (
                <div className="bg-white rounded-2xl border border-[#ececec] p-8 text-center text-red-400 text-sm">
                  {feedError}
                </div>
              )}

              {!loadingPosts && !feedError && posts.length === 0 && (
                <div className="bg-white rounded-2xl border border-[#ececec] p-8 text-center text-[#9ca3af] text-sm">
                  No posts yet. Be the first to share something!
                </div>
              )}

              {!loadingPosts && posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="hidden xl:block w-[340px] shrink-0">
            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
