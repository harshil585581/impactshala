import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import EditProfileModal from '../../components/profile/EditProfileModal';
import ToastContainer from '../../components/ui/Toast';
import { useProfile } from '../../hooks/useProfile';
import { fetchPersonalAchievements } from '../../services/achievementService';
import type { PersonalAchievement } from '../../services/achievementService';
import AddPersonalAchievementModal from '../../components/profile/AddPersonalAchievementModal';
import AllAchievementsModal from '../../components/profile/AllAchievementsModal';
import { fetchUserPosts, fetchLikedPostIds, fetchLikesCounts, fetchCommentCounts, togglePostLike, type FeedPost } from '../../services/postService';
import { fetchSavedPostIds, savePost, unsavePost } from '../../services/savedService';
import PostDetailModal from '../../components/profile/PostDetailModal';
import {
  fetchCollaborativeAccomplishments,
  fetchCollaboratorAvatars,
} from '../../services/collaborativeAccomplishmentService';
import type { CollaborativeAccomplishment } from '../../services/collaborativeAccomplishmentService';
import AddCollaborativeAccomplishmentModal from '../../components/profile/AddCollaborativeAccomplishmentModal';
import CollaborativeAccomplishmentDetailModal from '../../components/profile/CollaborativeAccomplishmentDetailModal';
import cupSvg from '../../assets/images/svg/cup.svg';
import { fetchCommunityMembersCount } from '../../services/endorsementService';
import WriteReviewModal from '../../components/profile/WriteReviewModal';
import ReviewsPreviewModal from '../../components/profile/ReviewsPreviewModal';
import { fetchReviews, deleteReview, type Review } from '../../services/reviewService';

const postImg1 = 'https://placehold.co/400x300/f5f5f5/cccccc';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── Add Industry Experience modal ────────────────────────────────────────────
function AddIndustryExperienceModal({
  currentIndustries,
  onClose,
  onSaved,
  editIndex,
}: {
  currentIndustries: { name: string; years?: string | number }[];
  onClose: () => void;
  onSaved: () => void;
  editIndex?: number;
}) {
  const editing = editIndex !== undefined;
  const [name, setName] = useState(editing ? String(currentIndustries[editIndex!]?.name ?? '') : '');
  const [years, setYears] = useState(editing ? String(currentIndustries[editIndex!]?.years ?? '') : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full border border-[#e4e5e8] bg-white rounded-full px-4 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] h-[48px]';

  async function handleSave() {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
      const newItem = { name: name.trim(), years: years.trim() || undefined };
      const updated = editing
        ? currentIndustries.map((item, idx) => idx === editIndex ? newItem : item)
        : [...currentIndustries, newItem];
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedUser.access_token ?? ''}` },
        body: JSON.stringify({ industries: updated }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail ?? 'Save failed'); }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[20px] w-full max-w-md shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 pt-7 pb-4">
          <h2 className="text-[#18191c] text-xl font-bold">{editing ? 'Edit' : 'Add'} Industry Experience</h2>
          <button onClick={onClose} className="text-[#18191c] hover:opacity-70 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="h-px bg-[#e4e5e8] mx-8" />
        <div className="px-8 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[#18191c] text-sm font-semibold">Industry / Domain Name *</label>
            <input className={inp} placeholder="Ex: Water Management" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#18191c] text-sm font-semibold">Years of Experience</label>
            <input className={inp} placeholder="Ex: 5" type="number" min="0" max="99" value={years} onChange={e => setYears(e.target.value)} />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
        <div className="px-8 py-5 flex justify-end border-t border-[#f2f2f3]">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="h-[44px] px-10 bg-[#ff9400] text-white text-sm font-bold rounded-full hover:bg-[#e68500] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes('linkedin')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79zM6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68zm1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>;
  if (p.includes('github')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>;
  if (p.includes('twitter') || p.includes('x')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
  if (p.includes('facebook')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>;
  if (p.includes('instagram')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= rating ? '#ff9400' : '#e4e5e8'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function Divider() { return <div className="h-px bg-[#f2f2f3] my-6" />; }

function AddButton({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-[34px] h-[34px] rounded-full border border-[#e4e5e8] flex items-center justify-center text-[#9199a3] hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicUtilitiesOrgProfilePage() {
  const { userId = 'me' } = useParams<{ userId?: string }>();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewsPreview, setShowReviewsPreview] = useState(false);
  const [showAllInd, setShowAllInd] = useState(false);
  const [addIndExpOpen, setAddIndExpOpen] = useState(false);
  const [editIndExpIndex, setEditIndExpIndex] = useState<number | null>(null);
  const [brochureUploading, setBrochureUploading] = useState(false);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  const { profile, loading, toasts, removeToast, saveProfile, follow, reload } = useProfile(userId);

  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isOwn = userId === 'me' || userId === storedUser.id;
  const resolvedUserId = userId === 'me' ? storedUser.id : userId;

  const [achievements, setAchievements] = useState<PersonalAchievement[]>([]);
  const [communityMembersCount, setCommunityMembersCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [addAchievementOpen, setAddAchievementOpen] = useState(false);
  const [collabAccomplishments, setCollabAccomplishments] = useState<CollaborativeAccomplishment[]>([]);
  const [collabAvatars, setCollabAvatars] = useState<Record<string, string>>({});
  const [addCollabOpen, setAddCollabOpen] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<CollaborativeAccomplishment | null>(null);

  const loadAchievements = () => {
    if (!resolvedUserId) return;
    fetchPersonalAchievements(resolvedUserId).then(setAchievements).catch(() => { });
  };
  const loadPosts = async () => {
    if (!resolvedUserId) return;
    try {
      const fetched = await fetchUserPosts(resolvedUserId);
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
    } catch {}
  };
  const handlePostLikeToggle = (postId: string, willLike: boolean) => {
    setLikedPostIds((prev) => { const next = new Set(prev); if (willLike) next.add(postId); else next.delete(postId); return next; });
    setLikesCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 0) + (willLike ? 1 : -1)) }));
    togglePostLike(postId, willLike).catch(() => {});
  };
  const handlePostSaveToggle = (postId: string, willSave: boolean) => {
    setSavedPostIds((prev) => { const next = new Set(prev); if (willSave) next.add(postId); else next.delete(postId); return next; });
    if (willSave) savePost(postId).catch(() => {}); else unsavePost(postId).catch(() => {});
  };
  const loadCollabAccomplishments = () => {
    if (!resolvedUserId) return;
    fetchCollaborativeAccomplishments(resolvedUserId).then(data => {
      setCollabAccomplishments(data);
      const ids = [...new Set(data.flatMap(a => (a.collaborators ?? []).map(c => c.id)))];
      fetchCollaboratorAvatars(ids).then(setCollabAvatars).catch(() => { });
    }).catch(() => { });
  };
  const loadReviews = () => {
    if (!resolvedUserId) return;
    fetchReviews(resolvedUserId).then(setReviews).catch(() => {});
  };

  useEffect(() => { loadAchievements(); }, [resolvedUserId]);
  useEffect(() => { loadPosts(); }, [resolvedUserId]);
  useEffect(() => { loadCollabAccomplishments(); }, [resolvedUserId]);
  useEffect(() => { loadReviews(); }, [resolvedUserId]);
  const handleDeleteReview = async () => {
    if (!resolvedUserId || !confirm('Delete your review?')) return;
    try { await deleteReview(resolvedUserId); loadReviews(); } catch {}
  };
  useEffect(() => {
    if (!resolvedUserId) return;
    fetchCommunityMembersCount(resolvedUserId).then(setCommunityMembersCount).catch(() => {});
  }, [resolvedUserId]);

  async function handleBrochureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBrochureUploading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? '{}');
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/api/upload/document`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.access_token ?? ''}` },
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      reload();
    } catch { /* ignore */ }
    finally { setBrochureUploading(false); }
  }

  const reachForTags = profile?.reachFor ?? [];

  // Subtitle: utility type (describe_as) under "Public Utilities"
  const utilityType = (profile as any)?.describeAs ?? '';
  const subtitleParts = [utilityType || 'Public Utilities'].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
          {loading ? (
            <div className="bg-white rounded-[14px] border border-[#f2f2f3] p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-[#f1f2f4]" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-5 w-40 bg-[#f1f2f4] rounded" />
                  <div className="h-4 w-56 bg-[#f1f2f4] rounded" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[14px] border border-[#f2f2f3] shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">

              {/* Cover */}
              <div className="relative w-full h-[170px] sm:h-[230px] bg-gradient-to-r from-[#1a2a4a] via-[#2d4a7a] to-[#1a2a4a] rounded-t-[14px] overflow-hidden">
                {profile?.coverUrl && (
                  <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-0 left-6 right-6 sm:left-8 sm:right-8 h-10 bg-white rounded-t-[24px]" />
              </div>

              {/* Header */}
              <div className="px-6 sm:px-16 pt-0 pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0 -mt-[18px]">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="avatar"
                          className="w-[120px] h-[120px] rounded-full object-cover border-4 border-white shadow-md" />
                      ) : (
                        <div className="w-[120px] h-[120px] rounded-full bg-[#ff9400] flex items-center justify-center border-4 border-white shadow-md">
                          <span className="text-white text-4xl font-bold">
                            {(profile?.orgName?.[0] ?? storedUser?.org_name?.[0] ?? '?').toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-3 right-3 w-4 h-4 bg-[#22c55e] rounded-full border-2 border-white" />
                    </div>

                    {/* Name / subtitle */}
                    <div className="flex flex-col gap-0.5 min-w-0 -mt-3 relative z-10">
                      <h1 className="text-[#18191c] text-xl font-bold leading-tight">
                        {profile
                          ? (profile.orgName || profile.firstName)
                          : storedUser.org_name || 'Your Organization'}
                      </h1>
                      {subtitleParts.length > 0 && (
                        <p className="text-[#5e6670] text-xs font-medium mt-0.5">
                          {subtitleParts.join(' · ')}
                        </p>
                      )}
                      {profile?.location && (
                        <p className="text-[#9199a3] text-xs">{profile.location}</p>
                      )}
                      {profile?.bio && (
                        <p className="text-[#5e6670] text-sm mt-1 leading-relaxed max-w-lg">{profile.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Social icons */}
                  {profile?.socialLinks && profile.socialLinks.length > 0 && (
                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end -mt-2 relative z-10">
                      {profile.socialLinks.map((link) => (
                        <a
                          key={link.platform}
                          href={link.url && !/^https?:\/\//i.test(link.url) ? `https://${link.url}` : link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#9199a3] hover:text-[#18191c] transition-colors"
                          title={link.platform}
                        >
                          <SocialIcon platform={link.platform} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3 mb-1 flex-wrap" style={{ paddingLeft: '13%' }}>
                  {isOwn ? (
                    <>
                      <button
                        onClick={() => setEditOpen(true)}
                        className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f0eeff] text-[#6b50ff] text-xs font-semibold rounded-full hover:bg-[#e4dcff] transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setAddSectionOpen(true)}
                        className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f0eeff] text-[#6b50ff] text-xs font-semibold rounded-full hover:bg-[#e4dcff] transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        Add Profile Section
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMoreMenuOpen((v) => !v)}
                          className="w-[34px] h-[34px] border border-[#e4e5e8] rounded-full flex items-center justify-center text-[#9199a3] hover:border-[#6b50ff] hover:text-[#6b50ff] transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /><circle cx="5" cy="12" r="1.5" /></svg>
                        </button>
                        {moreMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                            <div className="absolute left-0 top-[calc(100%+6px)] w-44 bg-white rounded-xl shadow-lg border border-[#f2f2f3] z-50 overflow-hidden py-1">
                              <button onClick={() => { setMoreMenuOpen(false); setShowShareModal(true); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#f8f8f8] text-left"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>Share Profile</button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <button className="h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">Add to Community</button>
                      <button className="h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">Message</button>
                      <button onClick={follow} className="h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
                        {profile?.isFollowing ? 'Following' : '+ Follow'}
                      </button>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-5 mb-1">
                  <div className="flex items-stretch border border-[#e4e5e8] rounded-xl overflow-hidden divide-x divide-[#e4e5e8] shadow-[0px_1px_4px_rgba(0,0,0,0.06)]">
                    {[
                      { label: 'Media Posts', value: String(posts.length) },
                      { label: 'Reviews', value: String(reviews.length) },
                      { label: 'Achievements', value: String(achievements.length) },
                      { label: 'Community Members', value: String(communityMembersCount) },
                    ].map((s) => (
                      <button key={s.label} className="flex-1 flex flex-col items-center justify-center py-3 px-2 hover:bg-[#fff8ee] transition-colors">
                        <span className="text-[#ff9400] text-xl font-bold leading-tight">{s.value}</span>
                        <span className="text-[#18191c] text-[11px] font-medium text-center mt-0.5">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 sm:px-16 py-6 flex flex-col">

                {/* Reach out to us for */}
                <div>
                  <p className="text-[#18191c] text-base font-bold mb-3">Reach out to us for:</p>
                  {reachForTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {reachForTags.map((tag) => (
                        <span key={tag} className="bg-[#fff6ed] text-[#ff9400] text-sm font-medium px-4 py-2 rounded-full border border-[#ffd9a0]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#9199a3] text-sm">Not specified yet.</p>
                  )}
                </div>

                <Divider />

                {/* 3-column: Service Offerings | Additional Details | Brochure */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Service Offerings */}
                  <div>
                    <p className="text-[#18191c] text-base font-bold mb-3">Service Offerings</p>
                    <div className="flex flex-col gap-1.5">
                      {(profile?.services ?? []).length > 0
                        ? (profile?.services ?? []).map((item) => (
                          <span key={item} className="text-[#5e6670] text-sm">{item}</span>
                        ))
                        : <p className="text-[#9199a3] text-sm">Not specified yet.</p>
                      }
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <p className="text-[#18191c] text-base font-bold mb-3">Additional Details</p>
                    <div className="flex flex-col gap-2.5">
                      {profile?.website && (
                        <div className="flex items-start gap-2 text-[#5e6670] text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                          <span>
                            <span className="text-[#18191c] font-medium">Website</span><br />
                            <a href={profile.website && !/^https?:\/\//i.test(profile.website) ? `https://${profile.website}` : profile.website} target="_blank" rel="noopener noreferrer" className="text-[#5e6670] hover:text-[#ff9400] hover:underline">
                              {profile.website.replace(/^https?:\/\//, '')}
                            </a>
                          </span>
                        </div>
                      )}
                      {profile?.phone && (
                        <div className="flex items-start gap-2 text-[#5e6670] text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                          <span>
                            <span className="text-[#18191c] font-medium">Phone</span><br />
                            {profile.phone}
                          </span>
                        </div>
                      )}
                      {!profile?.website && !profile?.phone && (
                        <p className="text-[#9199a3] text-sm">No additional details yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Brochure */}
                  <div>
                    <p className="text-[#18191c] text-base font-bold mb-3">Brochure</p>
                    <div className="flex flex-col gap-2 w-[150px]">
                      <div
                        onClick={async () => {
                          if (!profile?.resumeUrl) return;
                          try {
                            const user = JSON.parse(localStorage.getItem('user') ?? '{}');
                            const res = await fetch(`${API_URL}/api/profile/resume`, { headers: { Authorization: `Bearer ${user.access_token ?? ''}` } });
                            const data = await res.json();
                            if (data.url) window.open(data.url, '_blank');
                          } catch { /* ignore */ }
                        }}
                        className={`relative w-[150px] h-[190px] group overflow-hidden rounded-xl border border-[#e4e5e8] bg-white shadow-sm hover:shadow-md transition-all ${profile?.resumeUrl ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                      >
                        {(() => {
                          const url = profile?.resumeUrl;
                          if (!url) return (
                            <>
                              <div className="absolute inset-0 bg-[#f8fafc] flex items-center justify-center">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="opacity-20">
                                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#9199a3" strokeWidth="1.5" />
                                  <path d="M7 8h10M7 12h10M7 16h6" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </div>
                              <div className="absolute inset-0 flex items-end justify-center pb-4">
                                <span className="text-[10px] text-[#9199a3] font-bold tracking-wider uppercase bg-white/90 px-2 py-0.5 rounded shadow-sm border border-[#e4e5e8]">Not Uploaded</span>
                              </div>
                            </>
                          );
                          const ext = (url.split('?')[0].split('.').pop() ?? 'file').toLowerCase();
                          const colorMap: Record<string, [string, string]> = { pdf: ['#fff1f0', '#e53e3e'], doc: ['#eff6ff', '#2563eb'], docx: ['#eff6ff', '#2563eb'], ppt: ['#fff7ed', '#ea580c'], pptx: ['#fff7ed', '#ea580c'] };
                          const [bg, accent] = colorMap[ext] ?? ['#f0f4ff', '#6366f1'];
                          return (
                            <>
                              <div className="absolute inset-0" style={{ backgroundColor: bg }} />
                              <div className="absolute top-6 left-1/2 -translate-x-1/2">
                                <svg width="52" height="64" viewBox="0 0 52 64" fill="none">
                                  <path d="M2 0h30l18 18v42a2 2 0 01-2 2H2a2 2 0 01-2-2V2a2 2 0 012-2z" fill="white" stroke="#e8e8e8" strokeWidth="1" />
                                  <path d="M32 0l18 18H34a2 2 0 01-2-2V0z" fill={accent} fillOpacity="0.3" />
                                  <text x="26" y="45" textAnchor="middle" fill={accent} fontSize="11" fontWeight="800" fontFamily="system-ui,sans-serif">{ext.toUpperCase()}</text>
                                </svg>
                              </div>

                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center" style={{ color: accent }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                  </svg>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Industry Experience */}
                <div className="border border-[#e4e5e8] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4">
                    <h3 className="text-[#18191c] text-base font-semibold">Industry Experience</h3>
                    {isOwn && <AddButton onClick={() => setAddIndExpOpen(true)} />}
                  </div>
                  {(profile?.industries ?? []).length === 0 ? (
                    <div className="px-5 pb-4 border-t border-[#f2f2f3]">
                      <p className="text-[#9199a3] text-sm pt-3">No industry experience added yet.</p>
                    </div>
                  ) : (
                    <>
                      {(showAllInd
                        ? (profile?.industries ?? [])
                        : (profile?.industries ?? []).slice(0, 2)
                      ).map((ind, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-4 border-t border-[#f2f2f3]">
                          <div>
                            <p className="text-[#18191c] text-sm font-semibold">{ind.name}</p>
                            {ind.years && (
                              <p className="text-[#9199a3] text-xs mt-0.5">
                                {ind.years} year{Number(ind.years) !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          {isOwn && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => { setEditIndExpIndex(i); setAddIndExpOpen(true); }} className="text-[#ff9400] hover:text-[#e68500] transition-colors p-1">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                              <button onClick={async () => { const u = JSON.parse(localStorage.getItem('user') ?? '{}'); const list = (profile?.industries ?? []).filter((_, idx) => idx !== i); await fetch(`${API_URL}/api/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u.access_token ?? ''}` }, body: JSON.stringify({ industries: list }) }); reload(); }} className="text-[#9199a3] hover:text-red-500 transition-colors p-1">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {(profile?.industries ?? []).length > 2 && (
                        <div className="border-t border-[#f2f2f3] px-5 py-3 text-center">
                          <button
                            onClick={() => setShowAllInd((v) => !v)}
                            className="text-[#ff9400] text-sm font-medium hover:underline"
                          >
                            {showAllInd
                              ? 'Show less'
                              : `Show ${(profile?.industries ?? []).length - 2} more experience${(profile?.industries ?? []).length - 2 !== 1 ? 's' : ''}`}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Divider />

                {/* Credibility */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">Credibility</h3>
                    <button onClick={() => setShowReviewsPreview(true)} className="text-[#ff9400] text-sm font-medium hover:underline">View All</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {reviews.length > 0 ? reviews.slice(0, 3).map((review) => {
                      const reviewerName = review.reviewer
                        ? (
                            `${review.reviewer.first_name ?? ''} ${review.reviewer.last_name ?? ''}`.trim() ||
                            review.reviewer.org_name ||
                            'Anonymous'
                          )
                        : 'Anonymous';
                      return (
                        <div key={review.id} onClick={() => setShowReviewsPreview(true)} className="border border-[#f2f2f3] rounded-xl p-4 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-[#18191c] text-sm font-semibold">{reviewerName}</p>
                            <StarRating rating={review.rating} />
                          </div>
                          <p className="text-[#5e6670] text-xs leading-relaxed">{review.review_text}</p>
                        </div>
                      );
                    }) : (
                      <p className="text-[#9199a3] text-sm col-span-3">No reviews yet.</p>
                    )}
                  </div>
                  {!isOwn && (
                    <div className="flex justify-center gap-3 mt-4">
                      {reviews.some(r => r.reviewer_id === storedUser.id) ? (
                        <>
                          <button onClick={() => setShowReviewModal(true)} className="h-[40px] px-8 bg-[#ff9400] text-white text-sm font-semibold rounded-full hover:bg-[#e88600] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)]">Update Review</button>
                          <button onClick={handleDeleteReview} className="h-[40px] px-8 border border-red-400 text-red-500 text-sm font-semibold rounded-full hover:bg-red-50 transition-colors">Delete Review</button>
                        </>
                      ) : (
                        <button onClick={() => setShowReviewModal(true)} className="h-[40px] px-8 bg-[#ff9400] text-white text-sm font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)]">Write A Review</button>
                      )}
                    </div>
                  )}
                </div>

                <Divider />

                {/* My Achievements */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">My Achievements</h3>
                    {achievements.length > 0 && (
                      <button onClick={() => setShowAllAchievements(true)} className="text-[#ff9400] text-sm font-medium hover:underline">View All</button>
                    )}
                  </div>
                  {achievements.length === 0 ? (
                    <p className="text-[#9199a3] text-sm">No achievements added yet.</p>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                      {achievements.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setShowAllAchievements(true)}
                          className="border-2 border-[#ffd9a0] rounded-xl py-3 px-4 bg-white hover:bg-[#fffaf4] transition-colors flex flex-col items-center text-center shrink-0 w-[230px] min-h-[110px] justify-center gap-2"
                        >
                          <img src={cupSvg} alt="achievement" className="w-11 h-11 object-contain" />
                          <p className="text-[#18191c] text-sm font-semibold leading-snug line-clamp-2">{a.title}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Divider />

                {/* Collaborative Accomplishment */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">
                      Collaborative Accomplishment{' '}
                      <span className="text-[#9199a3] font-normal text-sm">({collabAccomplishments.length})</span>
                    </h3>
                    {collabAccomplishments.length > 0 && (
                      <button className="text-[#ff9400] text-sm font-medium hover:underline">View All</button>
                    )}
                  </div>
                  {collabAccomplishments.length === 0 ? (
                    <p className="text-[#9199a3] text-sm">No collaborative achievements yet.</p>
                  ) : (
                    <div className="relative">
                      <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar">
                        {collabAccomplishments.map(a => {
                          const collabs = a.collaborators ?? [];
                          const firstCollab = collabs[0];
                          const avatarInitial = firstCollab?.name?.charAt(0).toUpperCase() ?? '?';
                          const othersCount = collabs.length - 1;
                          return (
                            <button
                              key={a.id}
                              onClick={() => setSelectedCollab(a)}
                              className="border border-[#f2f2f3] rounded-2xl p-4 bg-white hover:bg-[#fffaf4] hover:border-[#ffd9a0] transition-all shrink-0 w-[260px] flex flex-row items-start gap-3 text-left"
                            >
                              {(() => {
                                const mediaImg = a.media_urls?.[0] ?? null;
                                const collabAvatar = firstCollab?.id ? collabAvatars[firstCollab.id] : null;
                                const imgSrc = mediaImg || collabAvatar;
                                return (
                                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff9400] to-[#ff7b00] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                                    {imgSrc ? (
                                      <img src={imgSrc} alt={firstCollab?.name} className="w-full h-full object-cover" />
                                    ) : firstCollab?.name ? (
                                      <span className="text-white font-bold text-lg">{avatarInitial}</span>
                                    ) : (
                                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="8" r="4" fill="white" />
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="white" />
                                      </svg>
                                    )}
                                  </div>
                                );
                              })()}
                              <div className="flex-1 min-w-0">
                                <p className="text-[#18191c] text-sm font-bold leading-snug truncate">
                                  {firstCollab?.name ?? 'Collaborator'}
                                  {othersCount > 0 && <span className="text-[#ff9400] font-semibold"> +{othersCount}</span>}
                                </p>
                                <p className="text-[#18191c] text-sm font-semibold mt-0.5 leading-snug line-clamp-1">{a.title}</p>
                                {a.description && (
                                  <p className="text-[#5e6670] text-xs mt-1 leading-relaxed line-clamp-2">{a.description}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {collabAccomplishments.slice(0, 5).map((_, i) => (
                          <div key={i} className={`h-1 rounded-full transition-all ${i === 0 ? 'w-6 bg-[#ff9400]' : 'w-2 bg-[#ffd9a0]'}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Divider />

                {/* Recent Posts */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">Recent Posts</h3>
                    <button className="text-[#ff9400] text-sm font-medium hover:underline">View All</button>
                  </div>
                  {posts.length === 0 ? (
                    <p className="text-[#9199a3] text-sm">No posts yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {posts.slice(0, 3).map((post) => {
                        const img = post.media_urls?.[0] || post.cover_image_url || postImg1;
                        const title = post.event_title || post.poll_question || post.question_text || post.content?.slice(0, 50) || 'Post';
                        const desc = post.content || post.event_description || '';
                        return (
                          <div key={post.id} onClick={() => setSelectedPost(post)} className="rounded-xl overflow-hidden border border-[#f2f2f3] cursor-pointer hover:shadow-md transition-shadow bg-white flex flex-col h-full">
                            <img src={img} alt={title} className="w-full h-[110px] object-cover bg-slate-50" />
                            <div className="p-3 flex-1 flex flex-col">
                              <p className="text-[#18191c] text-xs font-semibold leading-snug line-clamp-2">{title}</p>
                              {desc && <p className="text-[#9199a3] text-[10px] mt-1.5 leading-snug line-clamp-2">{desc}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add To Profile modal */}
      {addSectionOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAddSectionOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3]">
              <h2 className="text-[#18191c] text-base font-semibold">Add To Profile</h2>
              <button onClick={() => setAddSectionOpen(false)} className="text-[#9199a3] hover:text-[#18191c]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            {[
              { label: 'Industry Experience', onClick: () => { setAddSectionOpen(false); setAddIndExpOpen(true); } },
              { label: 'Personal Achievement', onClick: () => { setAddSectionOpen(false); setAddAchievementOpen(true); } },
              { label: 'Collaborative Accomplishment', onClick: () => { setAddSectionOpen(false); setAddCollabOpen(true); } },
              { label: 'Brochure', onClick: () => { setAddSectionOpen(false); brochureInputRef.current?.click(); } },
            ].map(({ label, onClick }) => (
              <button key={label} onClick={onClick}
                className="w-full flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3] last:border-0 text-[#18191c] text-sm hover:bg-[#f8f8f8] text-left">
                {label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            ))}
          </div>
        </div>
      )}
      <input ref={brochureInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="sr-only" onChange={handleBrochureUpload} disabled={brochureUploading} />

      {editOpen && (
        <EditProfileModal
          profile={profile!}
          experiences={[]}
          onClose={() => setEditOpen(false)}
          onSave={async (updates) => { await saveProfile(updates); setEditOpen(false); }}
          saving={false}
        />
      )}
      {addAchievementOpen && (
        <AddPersonalAchievementModal onClose={() => setAddAchievementOpen(false)} onSaved={loadAchievements} />
      )}
      {showAllAchievements && (
        <AllAchievementsModal achievements={achievements} onClose={() => setShowAllAchievements(false)} onDeleted={loadAchievements} isOwn={isOwn} />
      )}
      {addCollabOpen && (
        <AddCollaborativeAccomplishmentModal onClose={() => setAddCollabOpen(false)} onSaved={loadCollabAccomplishments} />
      )}
      {selectedCollab && (
        <CollaborativeAccomplishmentDetailModal accomplishment={selectedCollab} onClose={() => setSelectedCollab(null)} onDeleted={loadCollabAccomplishments} isOwn={isOwn} />
      )}
      {addIndExpOpen && (
        <AddIndustryExperienceModal
          currentIndustries={profile?.industries ?? []}
          onClose={() => { setAddIndExpOpen(false); setEditIndExpIndex(null); }}
          onSaved={() => { setAddIndExpOpen(false); setEditIndExpIndex(null); reload(); }}
          editIndex={editIndExpIndex ?? undefined}
        />
      )}

      {showReviewModal && profile && (
        <WriteReviewModal
          targetUserId={resolvedUserId}
          targetName={(profile.orgName || profile.firstName || '').trim() || 'this organization'}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={loadReviews}
          initialRating={reviews.find(r => r.reviewer_id === storedUser.id)?.rating}
          initialReviewText={reviews.find(r => r.reviewer_id === storedUser.id)?.review_text}
          initialMediaUrl={reviews.find(r => r.reviewer_id === storedUser.id)?.media_url}
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

      {showReviewsPreview && (
        <ReviewsPreviewModal
          reviews={reviews}
          onClose={() => setShowReviewsPreview(false)}
        />
      )}

      {showShareModal && profile && (() => {
        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, '0')}-${today.toLocaleString('en-GB', { month: 'long' })}-${today.getFullYear()}`;
        const profileUrl = `${window.location.origin}/profile/${resolvedUserId}`;
        const fullName = (profile.orgName || profile.firstName || '').trim();
        const roleCompany = [profile.title, profile.sector].filter(Boolean).join(' • ');
        const handle = `@${fullName.toLowerCase().replace(/\s+/g, '')}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}&margin=10`;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowShareModal(false); setCopyDone(false); setShowQR(false); }}>
            <div className="bg-white rounded-2xl w-full max-w-[340px] shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowQR((v) => !v)} className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                {showQR ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M5 12l7 7M5 12l7-7" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7v7H3V3zm1 1v5h5V4H4zm1 1h3v3H5V5zM14 3h7v7h-7V3zm1 1v5h5V4h-5zm1 1h3v3h-3V5zM3 14h7v7H3v-7zm1 1v5h5v-5H4zm1 1h3v3H5v-3zM14 14h2v2h-2v-2zm3 0h2v2h-2v-2zm-3 3h2v2h-2v-2zm3 0h2v2h-2v-2z" /></svg>}
              </button>
              {showQR ? (
                <div className="flex flex-col">
                  <div className="bg-gradient-to-br from-[#8b2fc9] via-[#d03a8c] to-[#ff6b35] h-[84px] flex flex-col items-center justify-center px-4 pt-2">
                    <p className="text-white text-base font-bold tracking-wide">Impactshaala</p>
                    <p className="text-white/80 text-xs mt-0.5">{fullName}</p>
                  </div>
                  <div className="flex flex-col items-center py-7 px-6 bg-white">
                    <div className="w-[230px] h-[230px] rounded-2xl overflow-hidden border border-[#f2f2f3] shadow-sm bg-white flex items-center justify-center">
                      <img src={qrUrl} alt="Profile QR Code" className="w-[220px] h-[220px]" />
                    </div>
                    <p className="text-[#9199a3] text-[11px] mt-3 text-center">Scan to view profile</p>
                  </div>
                  <div className="mx-5 mb-6 rounded-xl bg-gradient-to-r from-[#ff9400] to-[#ff6600] flex items-center justify-center py-3.5">
                    <p className="text-white text-sm font-bold tracking-wider">{handle}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative h-[110px] bg-gradient-to-br from-[#8b2fc9] via-[#d03a8c] to-[#ff6b35] overflow-visible">
                    {profile.coverUrl && <img src={profile.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                    <div className="absolute -bottom-[44px] left-1/2 -translate-x-1/2">
                      {profile.avatarUrl ? <img src={profile.avatarUrl} alt={fullName} className="w-[88px] h-[88px] rounded-full object-cover border-4 border-white shadow-lg" /> : <div className="w-[88px] h-[88px] rounded-full bg-[#ff9400] flex items-center justify-center border-4 border-white shadow-lg"><span className="text-white text-3xl font-bold">{(fullName[0] ?? '?').toUpperCase()}</span></div>}
                    </div>
                  </div>
                  <div className="pt-[54px] pb-6 px-6 flex flex-col items-center">
                    <h2 className="text-[#18191c] text-[20px] font-bold leading-tight text-center">{fullName || 'Profile'}</h2>
                    {roleCompany && <p className="text-[#5e6670] text-[13px] text-center mt-1">{roleCompany}</p>}
                    <div className="flex items-stretch w-full border border-[#e4e5e8] rounded-xl overflow-hidden divide-x divide-[#e4e5e8] mt-5 shadow-[0px_1px_4px_rgba(0,0,0,0.06)]">
                      {[{ label: 'Media Posts', value: String(posts.length) }, { label: 'Achievements', value: String(achievements.length) }, { label: 'Community', value: String(communityMembersCount) }].map((s) => (
                        <div key={s.label} className="flex-1 flex flex-col items-center py-3 px-1">
                          <span className="text-[#ff9400] text-[17px] font-bold leading-tight">{s.value}</span>
                          <span className="text-[#18191c] text-[10px] font-medium text-center mt-0.5 leading-snug">{s.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-full mt-5 bg-gradient-to-r from-[#ff9400] to-[#ff6600] rounded-xl p-3">
                      <div className="flex gap-2.5">
                        <button onClick={async () => { if (navigator.share) { try { await navigator.share({ title: `${fullName} on Impactshaala`, url: profileUrl }); } catch {} } else { await navigator.clipboard.writeText(profileUrl).catch(() => {}); setCopyDone(true); setTimeout(() => setCopyDone(false), 2000); } }} className="flex-1 bg-white rounded-lg flex flex-col items-center gap-2 py-3 text-[#5e6670] hover:text-[#ff9400] hover:bg-[#fff8ee] transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>
                          <span className="text-[11px] font-semibold">Share profile</span>
                        </button>
                        <button onClick={async () => { await navigator.clipboard.writeText(profileUrl).catch(() => {}); setCopyDone(true); setTimeout(() => setCopyDone(false), 2000); }} className="flex-1 bg-white rounded-lg flex flex-col items-center gap-2 py-3 text-[#5e6670] hover:text-[#ff9400] hover:bg-[#fff8ee] transition-colors">
                          {copyDone ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>}
                          <span className="text-[11px] font-semibold">{copyDone ? 'Copied!' : 'Copy link'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[#ff9400] text-[14px] font-semibold mt-4">{dateStr}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
