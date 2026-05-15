import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import EditProfileModal from '../../components/profile/EditProfileModal';
import ToastContainer from '../../components/ui/Toast';
import { useProfile } from '../../hooks/useProfile';
import {
  fetchExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  formatPeriod,
} from '../../services/experienceService';
import type { Experience } from '../../services/experienceService';
import { fetchPersonalAchievements } from '../../services/achievementService';
import type { PersonalAchievement } from '../../services/achievementService';
import AddPersonalAchievementModal from '../../components/profile/AddPersonalAchievementModal';
import AchievementDetailModal from '../../components/profile/AchievementDetailModal';
import { fetchEducations, deleteEducation, formatEducationPeriod, formatEducationDegree } from '../../services/educationService';
import type { Education } from '../../services/educationService';
import AddEducationModal from '../../components/profile/AddEducationModal';
import { fetchUserPosts, type FeedPost } from '../../services/postService';
import {
  fetchCollaborativeAccomplishments,
  deleteCollaborativeAccomplishment,
} from '../../services/collaborativeAccomplishmentService';
import type { CollaborativeAccomplishment } from '../../services/collaborativeAccomplishmentService';
import AddCollaborativeAccomplishmentModal from '../../components/profile/AddCollaborativeAccomplishmentModal';
import CollaborativeAccomplishmentDetailModal from '../../components/profile/CollaborativeAccomplishmentDetailModal';

const postImg1 = "https://placehold.co/400x300/f5f5f5/cccccc";
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_REVIEWS: any[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes('linkedin')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79zM6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68zm1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>;
  if (p.includes('github')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>;
  if (p.includes('behance')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.7zM19.34 13c-.104-1.336-1.02-1.893-1.97-1.893-1.04 0-1.856.63-2.01 1.893h3.98zM0 5h6.599c3.098 0 4.199 1.787 4.199 3.541 0 1.657-.895 2.652-2.099 3.151 1.441.35 2.739 1.426 2.739 3.338 0 2.531-1.978 3.97-5.098 3.97H0V5zm4.339 5.816c1.12 0 1.661-.465 1.661-1.278 0-.791-.51-1.197-1.575-1.197H3.35v2.475h.989zm.242 5.107c1.185 0 1.838-.526 1.838-1.489 0-.883-.577-1.408-1.855-1.408H3.35v2.897h1.231z"/></svg>;
  if (p.includes('twitter') || p.includes('x')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (p.includes('facebook')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>;
  if (p.includes('instagram')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= rating ? '#ff9400' : '#e4e5e8'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#f2f2f3] my-6" />;
}


function AddButton({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-[34px] h-[34px] rounded-full border border-[#e4e5e8] flex items-center justify-center text-[#9199a3] hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
    </button>
  );
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));
const EMP_TYPES = ['Full Time','Part Time','Self-employed','Freelance','Contract','Internship','Apprenticeship'];

function AddExperienceModal({ onClose, onSaved, experience }: { onClose: () => void; onSaved: () => void; experience?: Experience }) {
  const [title, setTitle] = useState(experience?.role ?? '');
  const [empType, setEmpType] = useState(experience?.emp_type ?? '');
  const [company, setCompany] = useState(experience?.company ?? '');
  const [current, setCurrent] = useState(experience?.is_current ?? false);
  const [startMonth, setStartMonth] = useState(experience?.start_month ?? '');
  const [startYear, setStartYear] = useState(experience?.start_year ?? '');
  const [endMonth, setEndMonth] = useState(experience?.end_month ?? '');
  const [endYear, setEndYear] = useState(experience?.end_year ?? '');
  const [location, setLocation] = useState(experience?.location ?? '');
  const [description, setDescription] = useState(experience?.description ?? '');
  const [skills, setSkills] = useState<string[]>(experience?.skills ?? []);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);

  const sel = 'w-full h-[44px] border border-[#e4e5e8] bg-white rounded-lg px-3 text-sm text-[#18191c] focus:outline-none focus:border-[#ff9400] appearance-none';
  const inp = 'w-full h-[44px] border border-[#e4e5e8] bg-white rounded-lg px-3 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400]';

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkill('');
    setShowSkillInput(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3] shrink-0">
          <h2 className="text-[#18191c] text-base font-semibold">{experience ? 'Edit Experience' : 'Add Experience'}</h2>
          <button onClick={onClose} className="text-[#9199a3] hover:text-[#18191c]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <p className="text-[#9199a3] text-xs">* indicates required</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Title <span className="text-red-500">*</span></label>
            <input className={inp} placeholder="Ex: Retail Sales Manager" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Employment Type <span className="text-red-500">*</span></label>
            <select className={sel} value={empType} onChange={(e) => setEmpType(e.target.value)}>
              <option value="">Ex: Full Time</option>
              {EMP_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Company or Organization <span className="text-red-500">*</span></label>
            <input className={inp} placeholder="Ex: Accenture" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={current} onChange={(e) => setCurrent(e.target.checked)} className="w-4 h-4 accent-[#ff9400]" />
            <span className="text-sm text-[#18191c]">Currently I am working on this role</span>
          </label>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Start Date <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <select className={sel} value={startMonth} onChange={(e) => setStartMonth(e.target.value)}>
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
              <select className={sel} value={startYear} onChange={(e) => setStartYear(e.target.value)}>
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {!current && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#18191c] font-medium">End Date</label>
              <div className="grid grid-cols-2 gap-3">
                <select className={sel} value={endMonth} onChange={(e) => setEndMonth(e.target.value)}>
                  <option value="">Month</option>
                  {MONTHS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <select className={sel} value={endYear} onChange={(e) => setEndYear(e.target.value)}>
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Location</label>
            <input className={inp} placeholder="Ex: Bangalore, India" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Description</label>
            <textarea rows={4} placeholder="List your major duties and successes" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000}
              className="w-full border border-[#e4e5e8] rounded-lg px-3 py-2.5 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] resize-none" />
            <p className="text-[#9199a3] text-xs text-right">{description.length}/1,000</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-[#18191c] font-medium">Skills</label>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1.5 bg-[#fff8ee] border border-[#ffd9a0] text-[#ff9400] text-xs px-3 py-1.5 rounded-full">
                  {s}
                  <button onClick={() => setSkills((p) => p.filter((x) => x !== s))} className="hover:text-red-500">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </span>
              ))}
            </div>
            
            {showSkillInput ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  className={`${inp} h-[36px] flex-1`}
                  placeholder="Type a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSkill();
                    if (e.key === 'Escape') setShowSkillInput(false);
                  }}
                  onBlur={() => {
                    if (!newSkill.trim()) setShowSkillInput(false);
                  }}
                />
                <button
                  onClick={handleAddSkill}
                  className="h-[36px] px-4 bg-[#ff9400] text-white text-xs font-semibold rounded-lg hover:bg-[#e68500] transition-colors"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSkillInput(true)}
                className="self-start h-[36px] px-5 border border-[#ff9400] text-[#ff9400] text-sm font-medium rounded-full hover:bg-[#fff6ed] transition-colors"
              >
                + Add Skill
              </button>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#f2f2f3] flex justify-end shrink-0">
          <button
            onClick={async () => {
              if (!title.trim() || !company.trim()) return;
              const data = {
                role: title.trim(),
                company: company.trim(),
                emp_type: empType || null,
                start_month: startMonth || null,
                start_year: startYear || null,
                end_month: current ? null : endMonth || null,
                end_year: current ? null : endYear || null,
                is_current: current,
                location: location.trim() || null,
                description: description.trim() || null,
                skills: skills.length > 0 ? skills : undefined,
              };
              if (experience) {
                await updateExperience(experience.id, data);
              } else {
                await createExperience(data);
              }
              onSaved();
              onClose();
            }}
            className="h-[40px] px-8 bg-[#ff9400] text-white text-sm font-semibold rounded-full hover:bg-[#e68500] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Badge icon for achievements ───────────────────────────────────────────────
function BadgeIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#ff9400] flex items-center justify-center shadow-md">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M8 21h8M12 17v4M7 4H4a2 2 0 00-2 2v2a4 4 0 004 4h.5M17 4h3a2 2 0 012 2v2a4 4 0 01-4 4h-.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 4h10v7a5 5 0 01-10 0V4z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { userId = 'me' } = useParams<{ userId?: string }>();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addExpOpen, setAddExpOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showAllExp, setShowAllExp] = useState(false);
  const [showAllEdu, setShowAllEdu] = useState(false);

  const { profile, loading, saving, toasts, removeToast, saveProfile, follow } = useProfile(userId);

  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isOwn = userId === 'me' || userId === storedUser.id;
  const resolvedUserId = userId === 'me' ? storedUser.id : userId;

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editExp, setEditExp] = useState<Experience | null>(null);
  const [achievements, setAchievements] = useState<PersonalAchievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<PersonalAchievement | null>(null);
  const [addAchievementOpen, setAddAchievementOpen] = useState(false);
  const [educations, setEducations] = useState<Education[]>([]);
  const [addEduOpen, setAddEduOpen] = useState(false);
  const [editEdu, setEditEdu] = useState<Education | null>(null);
  const [collabAccomplishments, setCollabAccomplishments] = useState<CollaborativeAccomplishment[]>([]);
  const [addCollabOpen, setAddCollabOpen] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<CollaborativeAccomplishment | null>(null);

  const loadExperiences = () => {
    if (!resolvedUserId) return;
    fetchExperiences(resolvedUserId).then(setExperiences).catch(() => {});
  };

  const loadAchievements = () => {
    if (!resolvedUserId) return;
    fetchPersonalAchievements(resolvedUserId).then(setAchievements).catch(() => {});
  };

  const loadEducations = () => {
    if (!resolvedUserId) return;
    fetchEducations(resolvedUserId).then(setEducations).catch(() => {});
  };

  const loadPosts = () => {
    if (!resolvedUserId) return;
    fetchUserPosts(resolvedUserId).then(setPosts).catch(() => {});
  };

  const loadCollabAccomplishments = () => {
    if (!resolvedUserId) return;
    fetchCollaborativeAccomplishments(resolvedUserId).then(setCollabAccomplishments).catch(() => {});
  };

  useEffect(() => { loadExperiences(); }, [resolvedUserId]);
  useEffect(() => { loadAchievements(); }, [resolvedUserId]);
  useEffect(() => { loadEducations(); }, [resolvedUserId]);
  useEffect(() => { loadPosts(); }, [resolvedUserId]);
  useEffect(() => { loadCollabAccomplishments(); }, [resolvedUserId]);

  const displayedExp = showAllExp ? experiences : experiences.slice(0, 2);
  const displayedEdu = showAllEdu ? educations : educations.slice(0, 2);

  const reachForTags = profile?.reachFor ?? [];
  const interests = profile?.skills ?? [];

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

              {/* Cover — own overflow-hidden keeps image clipped to card's rounded top corners */}
              <div className="relative w-full h-[170px] sm:h-[230px] bg-gradient-to-r from-[#5a3e2b] via-[#7a5c3e] to-[#4a3020] rounded-t-[14px] overflow-hidden">
                {profile?.coverUrl && (
                  <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                )}
                {/* White card overlay — inset left/right to match content padding below */}
                <div className="absolute bottom-0 left-6 right-6 sm:left-8 sm:right-8 h-10 bg-white rounded-t-[24px]" />
              </div>

              {/* Header — px matches the overlay left/right offset above */}
              <div className="px-6 sm:px-16 pt-0 pb-0">
                {/* Top row: avatar + name + social icons */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar — overlaps the banner */}
                    <div className="relative shrink-0 -mt-[90px]">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="avatar"
                          className="w-[120px] h-[120px] rounded-full object-cover border-4 border-white shadow-md" />
                      ) : (
                        <div className="w-[120px] h-[120px] rounded-full bg-[#ff9400] flex items-center justify-center border-4 border-white shadow-md">
                          <span className="text-white text-4xl font-bold">
                            {(profile?.firstName?.[0] ?? storedUser?.first_name?.[0] ?? '?').toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-3 right-3 w-4 h-4 bg-[#22c55e] rounded-full border-2 border-white" />
                    </div>

                    {/* Name / Info */}
                    <div className="flex flex-col gap-0.5 min-w-0 -mt-3 relative z-10">
                      <h1 className="text-[#18191c] text-xl font-bold leading-tight">
                        {profile ? `${profile.firstName} ${profile.lastName}`.trim() : `${storedUser.first_name ?? ''} ${storedUser.last_name ?? ''}`.trim() || storedUser.org_name || 'Your Name'}
                      </h1>
                      {(profile?.title || profile?.company || profile?.instituteName) && (
                        <p className="text-[#5e6670] text-sm">
                          {[profile?.title, profile?.company || profile?.instituteName].filter(Boolean).join(' · ')}
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

                  {/* Social icons — top right */}
                  {profile?.socialLinks && profile.socialLinks.length > 0 && (
                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end -mt-2 relative z-10">
                      {profile.socialLinks.map((link) => (
                        <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="text-[#9199a3] hover:text-[#18191c] transition-colors" title={link.platform}>
                          <SocialIcon platform={link.platform} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3 mb-1 flex-wrap" style={{paddingLeft:"10%"}}>
                  {isOwn ? (
                    <>
                      <button onClick={() => setEditOpen(true)}
                        className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f0eeff] text-[#6b50ff] text-xs font-semibold rounded-full hover:bg-[#e4dcff] transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                        Edit Profile
                      </button>
                      <button onClick={() => setAddSectionOpen(true)}
                        className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f0eeff] text-[#6b50ff] text-xs font-semibold rounded-full hover:bg-[#e4dcff] transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        Add Profile Section
                      </button>
                      <div className="relative">
                        <button onClick={() => setMoreMenuOpen((v) => !v)}
                          className="w-[34px] h-[34px] border border-[#e4e5e8] rounded-full flex items-center justify-center text-[#9199a3] hover:border-[#6b50ff] hover:text-[#6b50ff] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
                        </button>
                        {moreMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                            <div className="absolute left-0 top-[calc(100%+6px)] w-44 bg-white rounded-xl shadow-lg border border-[#f2f2f3] z-50 overflow-hidden py-1">
                              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#f8f8f8] text-left">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                                Share Profile
                              </button>
                              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#f8f8f8] text-left">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                                About My Profile
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <button className="h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
                        Add to Community
                      </button>
                      <button className="h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
                        Message
                      </button>
                      <button onClick={follow}
                        className="h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
                        {profile?.isFollowing ? 'Following' : '+ Follow'}
                      </button>
                      <button className="w-[34px] h-[34px] border border-[#e4e5e8] rounded-full flex items-center justify-center text-[#9199a3] hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-5 mb-1">
                  <div className="flex items-stretch border border-[#e4e5e8] rounded-xl overflow-hidden divide-x divide-[#e4e5e8] shadow-[0px_1px_4px_rgba(0,0,0,0.06)]">
                    {[
                      { label: 'Endorsements', value: '0' },
                      { label: 'Review', value: '0' },
                      { label: 'Achievements', value: String(achievements.length) },
                      { label: 'Community Members', value: '0' },
                    ].map((s) => (
                      <button
                        key={s.label}
                        className="flex-1 flex flex-col items-center justify-center py-3 px-2 hover:bg-[#fff8ee] transition-colors"
                      >
                        <span className="text-[#ff9400] text-xl font-bold leading-tight">{s.value}</span>
                        <span className="text-[#18191c] text-[11px] font-medium text-center mt-0.5">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 sm:px-16 py-6 flex flex-col">

                {/* Reach out */}
                <div>
                  <p className="text-[#18191c] text-sm font-semibold mb-3">Reach out to me for:</p>
                  {reachForTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {reachForTags.map((tag) => (
                        <span key={tag} className="bg-[#fff6ed] text-[#ff9400] text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#ffeacc]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {reachForTags.length === 0 && (
                    <p className="text-[#9199a3] text-sm">Not specified yet.</p>
                  )}
                </div>

                <Divider />

                {/* Interest / Additional Details / Portfolio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[#18191c] text-sm font-semibold mb-3">Interest</p>
                    <div className="flex flex-col gap-1.5">
                      {interests.length > 0 ? interests.map((item) => (
                        <span key={item} className="text-[#5e6670] text-sm">{item}</span>
                      )) : (
                        <p className="text-[#9199a3] text-sm">Not specified yet.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[#18191c] text-sm font-semibold mb-3">Additional Details</p>
                    <div className="flex flex-col gap-2.5">
                      {profile?.languages && (
                        <div className="flex items-start gap-2 text-[#5e6670] text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.8"/></svg>
                          <span><span className="text-[#18191c] font-medium">Languages</span><br />{profile.languages}</span>
                        </div>
                      )}
                      {profile?.website && (
                        <div className="flex items-start gap-2 text-[#5e6670] text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                          <span><span className="text-[#18191c] font-medium">Profile URL</span><br />
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#5e6670] hover:text-[#ff9400] hover:underline">
                              {profile.website.replace(/^https?:\/\//, '')}
                            </a>
                          </span>
                        </div>
                      )}
                      {!profile?.languages && !profile?.website && (
                        <p className="text-[#9199a3] text-sm">No additional details added yet.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[#18191c] text-sm font-semibold mb-3">Portfolio/Resume</p>
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
                      className={`relative w-[150px] h-[190px] group cursor-pointer overflow-hidden rounded-xl border border-[#e4e5e8] bg-white shadow-sm hover:shadow-md transition-all ${!profile?.resumeUrl ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {/* Blurred Resume Preview Image */}
                      <div className="absolute inset-0 bg-[#f8fafc]">
                        <img 
                          src="data:image/png;base64,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" 
                          alt="Resume Preview" 
                          className="w-full h-full object-cover blur-[1.5px] opacity-50 grayscale-[0.3]"
                        />
                        {/* Gradient overlay for better contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                      </div>

                      {/* Eye Icon in Middle */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-[#ff9400] transform group-hover:scale-110 transition-transform duration-300">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </div>
                      </div>

                      {/* Status indicator if no resume */}
                      {!profile?.resumeUrl && (
                        <div className="absolute inset-0 flex items-end justify-center pb-4">
                           <span className="text-[10px] text-[#9199a3] font-bold tracking-wider uppercase bg-white/90 px-2 py-0.5 rounded shadow-sm border border-[#e4e5e8]">No Resume</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Experiences */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">Experiences</h3>
                    {isOwn && <AddButton onClick={() => setAddExpOpen(true)} />}
                  </div>
                  {experiences.length === 0 && (
                    <p className="text-[#9199a3] text-sm">No experiences added yet.</p>
                  )}
                  <div className="flex flex-col gap-5">
                    {displayedExp.map((exp) => (
                      <div key={exp.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#f3f5f7] border border-[#e4e5e8] shrink-0 flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="#9199a3" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[#18191c] text-sm font-semibold">{exp.role}</p>
                              <p className="text-[#5e6670] text-xs mt-1.5">
                                <span className="font-bold text-[#18191c]">{exp.company}</span>
                                {[exp.emp_type, formatPeriod(exp)].filter(Boolean).map((text, i) => (
                                  <span key={i}> · {text}</span>
                                ))}
                              </p>
                              {exp.location && <p className="text-[#9199a3] text-xs mt-1.5">{exp.location}</p>}
                            </div>
                            {isOwn && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setEditExp(exp)}
                                  className="text-[#ff9400] hover:text-[#e68500] transition-colors p-1"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to delete this experience?')) {
                                      await deleteExperience(exp.id);
                                      loadExperiences();
                                    }
                                  }}
                                  className="text-[#ff9400] hover:text-red-500 transition-colors p-1"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                                </button>
                              </div>
                            )}
                          </div>
                          {exp.description && (
                            <p className="text-[#5e6670] text-xs mt-3 leading-relaxed">{exp.description}</p>
                          )}

                          {/* Skills tags */}
                          {exp.skills && exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {exp.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-4 py-1.5 rounded-full border border-[#ff9400] text-[#ff9400] text-xs font-medium bg-white hover:bg-[#fff8ee] transition-colors cursor-default"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {experiences.length > 2 && (
                    <button onClick={() => setShowAllExp((v) => !v)} className="mt-4 text-[#ff9400] text-sm font-medium hover:underline">
                      {showAllExp ? 'Show less' : `Show ${experiences.length - 2} more experiences`}
                    </button>
                  )}
                </div>

                <Divider />

                {/* Reviews */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">Reviews</h3>
                    <button className="text-[#ff9400] text-sm font-medium hover:underline">View All</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {MOCK_REVIEWS.length > 0 ? MOCK_REVIEWS.map((review) => (
                      <div key={review.id} className="border border-[#f2f2f3] rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[#18191c] text-sm font-semibold">{review.name}</p>
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="text-[#5e6670] text-xs leading-relaxed">{review.text}</p>
                      </div>
                    )) : (
                      <p className="text-[#9199a3] text-sm col-span-3">No reviews yet.</p>
                    )}
                  </div>
                </div>

                <Divider />

                {/* Personal Achievements */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[#18191c] text-base font-semibold">Personal Achievements</h3>
                    </div>
                    {isOwn && (
                      <button onClick={() => setAddAchievementOpen(true)} className="flex items-center gap-1 text-[#ff9400] text-sm font-medium hover:underline">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#ff9400" strokeWidth="2.5" strokeLinecap="round"/></svg>
                        View All
                      </button>
                    )}
                  </div>
                  {achievements.length === 0 && (
                    <p className="text-[#9199a3] text-sm">No personal achievements added yet.</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {achievements.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAchievement(a)}
                        className="border-2 border-[#ffd9a0] rounded-xl p-5 pt-6 relative bg-white hover:bg-[#fffaf4] transition-colors flex flex-col items-center text-center min-h-[130px] justify-center"
                      >
                        <div className="absolute top-2.5 right-2.5">
                          <BadgeIcon />
                        </div>
                        <p className="text-[#18191c] text-base font-bold leading-snug">{a.title}</p>
                        {a.achieved_date && (
                          <p className="text-[#9199a3] text-sm mt-2">
                            Achieved on: {new Date(a.achieved_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Collaborative Achievements */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">
                      Collaborative Achievements{' '}
                      <span className="text-[#9199a3] font-normal text-sm">({collabAccomplishments.length})</span>
                    </h3>
                    <div className="flex items-center gap-3">
                      {isOwn && (
                        <button
                          onClick={() => setAddCollabOpen(true)}
                          className="flex items-center gap-1 text-[#ff9400] text-sm font-medium hover:underline"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#ff9400" strokeWidth="2.5" strokeLinecap="round"/></svg>
                          View All
                        </button>
                      )}
                    </div>
                  </div>
                  {collabAccomplishments.length === 0 ? (
                    <p className="text-[#9199a3] text-sm">No collaborative achievements yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {collabAccomplishments.map(a => {
                        const collabs = a.collaborators ?? [];
                        const firstName = collabs[0]?.name ?? '';
                        const othersCount = collabs.length - 1;
                        const dateStr = [a.achieved_month, a.achieved_year].filter(Boolean).join(' ');
                        return (
                          <button
                            key={a.id}
                            onClick={() => setSelectedCollab(a)}
                            className="border-2 border-[#ffd9a0] rounded-xl p-5 pt-6 relative bg-white hover:bg-[#fffaf4] transition-colors flex flex-col items-center text-center min-h-[130px] justify-center"
                          >
                            <div className="absolute top-2.5 right-2.5">
                              <BadgeIcon />
                            </div>
                            <p className="text-[#18191c] text-base font-bold leading-snug" style={{marginTop:"12px"}}>{a.title}</p>
                            {collabs.length > 0 && (
                              <p className="text-[#5e6670] text-sm mt-2 leading-relaxed">
                                {firstName}
                                {othersCount > 0 && (
                                  <> and <span className="text-[#ff9400] font-semibold">{othersCount} others</span></>
                                )}
                              </p>
                            )}
                            {dateStr && (
                              <p className="text-[#9199a3] text-sm mt-0.5">Achieved on &nbsp;{dateStr}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Divider />

                {/* Educations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">Educations</h3>
                    {isOwn && <AddButton onClick={() => setAddEduOpen(true)} />}
                  </div>
                  {educations.length === 0 && (
                    <p className="text-[#9199a3] text-sm">No education added yet.</p>
                  )}
                  <div className="flex flex-col gap-5">
                    {displayedEdu.map((edu) => (
                      <div key={edu.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#f3f5f7] border border-[#e4e5e8] shrink-0 flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[#18191c] text-sm font-semibold">{edu.school}</p>
                              {formatEducationDegree(edu) && (
                                <p className="text-[#5e6670] text-xs mt-0.5">{formatEducationDegree(edu)}</p>
                              )}
                              {formatEducationPeriod(edu) && (
                                <p className="text-[#9199a3] text-xs mt-0.5">{formatEducationPeriod(edu)}</p>
                              )}
                              {edu.grade && (
                                <p className="text-[#9199a3] text-xs mt-0.5">Grade: {edu.grade}</p>
                              )}
                            </div>
                            {isOwn && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setEditEdu(edu)}
                                  className="text-[#ff9400] hover:text-[#e68500] transition-colors p-1"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button
                                  onClick={async () => { await deleteEducation(edu.id); loadEducations(); }}
                                  className="text-[#ff9400] hover:text-red-500 transition-colors p-1"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {educations.length > 2 && (
                    <button onClick={() => setShowAllEdu((v) => !v)} className="mt-4 text-[#ff9400] text-sm font-medium hover:underline">
                      {showAllEdu ? 'Show less' : `Show ${educations.length - 2} more educations`}
                    </button>
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
                          <div key={post.id} className="rounded-xl overflow-hidden border border-[#f2f2f3] cursor-pointer hover:shadow-md transition-shadow bg-white flex flex-col h-full">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            {[
              { label: 'Experience', onClick: () => { setAddSectionOpen(false); setAddExpOpen(true); } },
              { label: 'Education', onClick: () => { setAddSectionOpen(false); setAddEduOpen(true); } },
              { label: 'Personal Achievement', onClick: () => { setAddSectionOpen(false); setAddAchievementOpen(true); } },
              { label: 'Collaborative Accomplishment', onClick: () => { setAddSectionOpen(false); setAddCollabOpen(true); } },
            ].map(({ label, onClick }) => (
              <button key={label} onClick={onClick}
                className="w-full flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3] last:border-0 text-[#18191c] text-sm hover:bg-[#f8f8f8] text-left">
                {label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {(addExpOpen || editExp) && (
        <AddExperienceModal
          experience={editExp ?? undefined}
          onClose={() => { setAddExpOpen(false); setEditExp(null); }}
          onSaved={() => { loadExperiences(); setAddExpOpen(false); setEditExp(null); }}
        />
      )}

      {(addEduOpen || editEdu) && (
        <AddEducationModal
          education={editEdu ?? undefined}
          onClose={() => { setAddEduOpen(false); setEditEdu(null); }}
          onSaved={() => { loadEducations(); setAddEduOpen(false); setEditEdu(null); }}
        />
      )}

      {addAchievementOpen && (
        <AddPersonalAchievementModal
          onClose={() => setAddAchievementOpen(false)}
          onSaved={loadAchievements}
        />
      )}

      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
          onDeleted={loadAchievements}
          isOwn={isOwn}
        />
      )}

      {addCollabOpen && (
        <AddCollaborativeAccomplishmentModal
          onClose={() => setAddCollabOpen(false)}
          onSaved={loadCollabAccomplishments}
        />
      )}

      {selectedCollab && (
        <CollaborativeAccomplishmentDetailModal
          accomplishment={selectedCollab}
          onClose={() => setSelectedCollab(null)}
          onDeleted={loadCollabAccomplishments}
          isOwn={isOwn}
        />
      )}

      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          experiences={experiences}
          saving={saving}
          onSave={async (data) => { await saveProfile(data); setEditOpen(false); }}
          onClose={() => setEditOpen(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
