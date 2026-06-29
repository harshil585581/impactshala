import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { fetchUserPosts, deletePost, fetchLikedPostIds, fetchLikesCounts, fetchCommentCounts, togglePostLike, type FeedPost } from '../../services/postService';
import { fetchSavedPostIds, savePost, unsavePost } from '../../services/savedService';
import PostDetailModal from '../../components/profile/PostDetailModal';
import {
  fetchCollaborativeAccomplishments,
} from '../../services/collaborativeAccomplishmentService';
import type { CollaborativeAccomplishment } from '../../services/collaborativeAccomplishmentService';
import AddCollaborativeAccomplishmentModal from '../../components/profile/AddCollaborativeAccomplishmentModal';
import CollaborativeAccomplishmentDetailModal from '../../components/profile/CollaborativeAccomplishmentDetailModal';
import { getFreshToken } from '../../lib/authToken';
import {
  fetchConnections,
  fetchSentRequests,
  sendConnectionRequest,
  rejectOrCancelRequest,
  removeConnection,
  fetchProfileCommunityMembers,
  type ProfileMember,
} from '../../services/communityService';
import { blockUser, unblockUser, fetchIsBlocked } from '../../services/blockService';
import {
  fetchEndorsementCount,
  fetchIsEndorsed,
  toggleEndorsement,
  fetchCommunityMembersCount,
} from '../../services/endorsementService';
import WriteReviewModal from '../../components/profile/WriteReviewModal';
import ReviewsPreviewModal from '../../components/profile/ReviewsPreviewModal';
import { fetchReviews, deleteReview, checkCanReview, type Review } from '../../services/reviewService';
const postImg1 = 'https://placehold.co/400x300/f5f5f5/cccccc';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';


function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes('linkedin')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79zM6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68zm1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>;
  if (p.includes('github')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>;
  if (p.includes('behance')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.7zM19.34 13c-.104-1.336-1.02-1.893-1.97-1.893-1.04 0-1.856.63-2.01 1.893h3.98zM0 5h6.599c3.098 0 4.199 1.787 4.199 3.541 0 1.657-.895 2.652-2.099 3.151 1.441.35 2.739 1.426 2.739 3.338 0 2.531-1.978 3.97-5.098 3.97H0V5zm4.339 5.816c1.12 0 1.661-.465 1.661-1.278 0-.791-.51-1.197-1.575-1.197H3.35v2.475h.989zm.242 5.107c1.185 0 1.838-.526 1.838-1.489 0-.883-.577-1.408-1.855-1.408H3.35v2.897h1.231z" /></svg>;
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

function Divider() {
  return <div className="h-px bg-[#f2f2f3] my-6" />;
}

function AddButton({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-[34px] h-[34px] rounded-full border border-[#e4e5e8] flex items-center justify-center text-[#9199a3] hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
    </button>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));
const EMP_TYPES = ['Full Time', 'Part Time', 'Self-employed', 'Freelance', 'Contract', 'Internship', 'Apprenticeship'];

function SimpleSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative w-full">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full h-[44px] border border-[#e4e5e8] rounded-full px-3 bg-white flex items-center justify-between text-sm focus:outline-none focus:border-[#ff9400] transition-colors">
        <span className={value ? 'text-[#18191c]' : 'text-[#9199a3]'}>{value || placeholder || 'Select...'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="#9199a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#d6d6d6] rounded-[8px] shadow-lg max-h-[220px] overflow-y-auto">
          {options.map(opt => {
            const selected = opt === value;
            return (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className={`flex items-center px-[8px] py-[2px] cursor-pointer ${selected ? 'border-l-4 border-[#ff9400]' : ''}`}>
                <div className="flex items-center px-[8px] py-[12px] w-full">
                  <span className={`text-[12px] leading-normal flex-1 ${selected ? 'text-[#ff9400]' : 'text-[#6b6b6b]'}`}>{opt}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setNewSkill('');
    setShowSkillInput(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3] shrink-0">
          <h2 className="text-[#18191c] text-base font-semibold">{experience ? 'Edit Experience' : 'Add Experience'}</h2>
          <button onClick={onClose} className="text-[#9199a3] hover:text-[#18191c]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
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
            <SimpleSelect value={empType} onChange={setEmpType} options={EMP_TYPES} placeholder="Ex: Full Time" />
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
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </span>
              ))}
            </div>
            {showSkillInput ? (
              <div className="flex items-center gap-2 mt-1">
                <input autoFocus className={`${inp} h-[36px] flex-1`} placeholder="Type a skill..."
                  value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill(); if (e.key === 'Escape') setShowSkillInput(false); }}
                  onBlur={() => { if (!newSkill.trim()) setShowSkillInput(false); }} />
                <button onClick={handleAddSkill} className="h-[36px] px-4 bg-[#ff9400] text-white text-xs font-semibold rounded-lg hover:bg-[#e68500] transition-colors">Add</button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowSkillInput(true)}
                className="self-start h-[36px] px-5 border border-[#ff9400] text-[#ff9400] text-sm font-medium rounded-full hover:bg-[#fff6ed] transition-colors">
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
                role: title.trim(), company: company.trim(), emp_type: empType || null,
                start_month: startMonth || null, start_year: startYear || null,
                end_month: current ? null : endMonth || null, end_year: current ? null : endYear || null,
                is_current: current, location: location.trim() || null,
                description: description.trim() || null, skills: skills.length > 0 ? skills : undefined,
              };
              if (experience) { await updateExperience(experience.id, data); } else { await createExperience(data); }
              onSaved(); onClose();
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

type MemberFilter = 'all' | 'individual' | 'organization';

function CommunityMembersModal({ profileUserId, onClose }: { profileUserId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MemberFilter>('all');
  const [members, setMembers] = useState<ProfileMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [restricted, setRestricted] = useState(false);

  useEffect(() => {
    setLoading(true);
    const userType = filter === 'all' ? undefined : filter;
    fetchProfileCommunityMembers(profileUserId, search || undefined, userType)
      .then(r => { setMembers(r.members); setRestricted(r.restricted); })
      .catch(() => { setMembers([]); setRestricted(false); })
      .finally(() => setLoading(false));
  }, [profileUserId, search, filter]);

  const filterTabs: { key: MemberFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'individual', label: 'People' },
    { key: 'organization', label: 'Organizations' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[15px] w-full max-w-lg shadow-xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d7d7d7]">
          <h2 className="text-base font-semibold text-[#262626]">Community Members</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#575555] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9199a3]" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#d7d7d7] rounded-full focus:outline-none focus:border-[#f77f00] bg-[#f9f9f9]"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-5 pb-3">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filter === tab.key
                  ? 'bg-[#f77f00] text-white border-[#f77f00]'
                  : 'bg-white text-[#575555] border-[#d7d7d7] hover:border-[#f77f00] hover:text-[#f77f00]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 divide-y divide-[#f0f0f0]">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#f77f00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : restricted ? (
            <div className="flex flex-col items-center py-10 text-[#9199a3]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-2 opacity-40">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-medium text-[#575555]">Community list is private</span>
              <span className="text-xs mt-1">Only community members can view this list</span>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-[#9199a3]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-2 opacity-40">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-sm">No members found</span>
            </div>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                onClick={() => { navigate(`/profile/${member.id}`); onClose(); }}
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-[#fff8ee] -mx-5 px-5 transition-colors"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[#f0f0f0]">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#ffeacc] text-[#f77f00] text-base font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#18191c] truncate">{member.name}</p>
                  {(member.title || member.company) && (
                    <p className="text-xs text-[#575555] truncate">
                      {[member.title, member.company].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <span className="inline-block mt-0.5 text-[10px] text-[#9199a3] bg-[#f5f5f5] px-2 py-0.5 rounded-full">
                    {member.user_type === 'organization' ? 'Organization' : 'Individual'}
                  </span>
                </div>

                {/* Arrow */}
                <svg className="text-[#d7d7d7] flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BadgeIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#ff9400] flex items-center justify-center shadow-md">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M8 21h8M12 17v4M7 4H4a2 2 0 00-2 2v2a4 4 0 004 4h.5M17 4h3a2 2 0 012 2v2a4 4 0 01-4 4h-.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 4h10v7a5 5 0 01-10 0V4z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function ProfilePage() {
  const { userId = 'me' } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addExpOpen, setAddExpOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showAllExp, setShowAllExp] = useState(false);
  const [showAllEdu, setShowAllEdu] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [showAllCollab, setShowAllCollab] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewsPreview, setShowReviewsPreview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copyDone, setCopyDone] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isEndorsed, setIsEndorsed] = useState(false);
  const [endorsementCount, setEndorsementCount] = useState(0);
  const [communityMembersCount, setCommunityMembersCount] = useState(0);
  const [endorseLoading, setEndorseLoading] = useState(false);
  const [communityStatus, setCommunityStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [viewerMoreOpen, setViewerMoreOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteToastVisible, setMuteToastVisible] = useState(false);
  const [blockDoneToast, setBlockDoneToast] = useState(false);
  const [unblockDoneToast, setUnblockDoneToast] = useState(false);
  const [reportDoneToast, setReportDoneToast] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  const { profile, loading, saving, toasts, removeToast, saveProfile } = useProfile(userId);

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
    fetchExperiences(resolvedUserId).then(setExperiences).catch(() => { });
  };

  const loadAchievements = () => {
    if (!resolvedUserId) return;
    fetchPersonalAchievements(resolvedUserId).then(setAchievements).catch(() => { });
  };

  const loadEducations = () => {
    if (!resolvedUserId) return;
    fetchEducations(resolvedUserId).then(setEducations).catch(() => { });
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
    fetchCollaborativeAccomplishments(resolvedUserId).then(setCollabAccomplishments).catch(() => { });
  };

  useEffect(() => { loadExperiences(); }, [resolvedUserId]);
  useEffect(() => { loadAchievements(); }, [resolvedUserId]);
  useEffect(() => { loadEducations(); }, [resolvedUserId]);
  useEffect(() => { loadPosts(); }, [resolvedUserId]);
  useEffect(() => { loadCollabAccomplishments(); }, [resolvedUserId]);

  const loadReviews = () => {
    if (!resolvedUserId) return;
    fetchReviews(resolvedUserId).then(setReviews).catch(() => {});
  };
  useEffect(() => { loadReviews(); }, [resolvedUserId]);
  const handleDeleteReview = async () => {
    if (!resolvedUserId || !confirm('Delete your review?')) return;
    try { await deleteReview(resolvedUserId); loadReviews(); } catch {}
  };

  useEffect(() => {
    if (!resolvedUserId) return;
    Promise.all([
      fetchEndorsementCount(resolvedUserId).catch(() => 0),
      isOwn ? Promise.resolve(false) : fetchIsEndorsed(resolvedUserId).catch(() => false),
      fetchCommunityMembersCount(resolvedUserId).catch(() => 0),
    ]).then(([count, endorsed, memberCount]) => {
      setEndorsementCount(count);
      setCommunityMembersCount(memberCount);
      if (!isOwn) setIsEndorsed(endorsed);
    });
  }, [resolvedUserId, isOwn]);

  useEffect(() => {
    if (isOwn || !resolvedUserId) return;
    fetchIsBlocked(resolvedUserId).then(setIsBlocked).catch(() => {});
    checkCanReview(resolvedUserId).then(r => setCanReview(r.allowed)).catch(() => setCanReview(false));
  }, [isOwn, resolvedUserId]);

  useEffect(() => {
    if (isOwn || !resolvedUserId) return;
    setCommunityStatus('none');
    setPendingRequestId(null);
    Promise.all([
      fetchConnections().catch(() => ({ connections: [] as any[] })),
      fetchSentRequests().catch(() => ({ requests: [] as any[] })),
    ]).then(([connData, sentData]) => {
      const isConnected = connData.connections.some((c: any) => c.id === resolvedUserId);
      if (isConnected) { setCommunityStatus('connected'); return; }
      const pending = sentData.requests.find((r: any) => r.id === resolvedUserId);
      if (pending) { setCommunityStatus('pending'); setPendingRequestId(pending.request_id); }
    }).catch(() => {});
  }, [isOwn, resolvedUserId]);

  const handleEndorse = async () => {
    if (endorseLoading || !resolvedUserId) return;
    const next = !isEndorsed;
    setIsEndorsed(next);
    setEndorsementCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setEndorseLoading(true);
    try {
      await toggleEndorsement(resolvedUserId, next);
    } catch {
      setIsEndorsed(!next);
      setEndorsementCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setEndorseLoading(false);
    }
  };

  const handleCommunityAction = async () => {
    if (communityLoading || !resolvedUserId) return;
    setCommunityLoading(true);
    try {
      if (communityStatus === 'none') {
        await sendConnectionRequest(resolvedUserId);
        setCommunityStatus('pending');
      } else if (communityStatus === 'pending' && pendingRequestId) {
        await rejectOrCancelRequest(pendingRequestId);
        setCommunityStatus('none');
        setPendingRequestId(null);
      } else if (communityStatus === 'connected') {
        await removeConnection(resolvedUserId);
        setCommunityStatus('none');
      }
    } catch { /* silently ignore */ }
    finally { setCommunityLoading(false); }
  };

  const handleRemoveFromCommunity = async () => {
    if (communityLoading || !resolvedUserId) return;
    setCommunityLoading(true);
    try {
      await removeConnection(resolvedUserId);
      setCommunityStatus('none');
      setPendingRequestId(null);
    } catch {}
    finally { setCommunityLoading(false); }
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    setMuteToastVisible(true);
    setTimeout(() => setMuteToastVisible(false), 3000);
  };

  const handleBlockConfirm = async () => {
    setShowBlockConfirm(false);
    if (resolvedUserId) {
      try { await blockUser(resolvedUserId); } catch {}
    }
    setIsBlocked(true);
    setBlockDoneToast(true);
    setTimeout(() => setBlockDoneToast(false), 3000);
  };

  const handleUnblock = async () => {
    if (resolvedUserId) {
      try { await unblockUser(resolvedUserId); } catch {}
    }
    setIsBlocked(false);
    setUnblockDoneToast(true);
    setTimeout(() => setUnblockDoneToast(false), 3000);
  };

  const handleReportSubmit = () => {
    setShowReportModal(false);
    setReportDoneToast(true);
    setTimeout(() => setReportDoneToast(false), 3000);
  };

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

              {/* Cover */}
              <div className="relative w-full h-[170px] sm:h-[230px] bg-gradient-to-r from-[#5a3e2b] via-[#7a5c3e] to-[#4a3020] rounded-t-[14px] overflow-hidden">
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
                        {profile
                          ? `${profile.firstName} ${profile.lastName}`.trim()
                          : `${storedUser.first_name ?? ''} ${storedUser.last_name ?? ''}`.trim() || 'Your Name'}
                      </h1>
                      {(profile?.title || profile?.company || profile?.instituteName) && (
                        <p className="text-[#5e6670] text-sm">
                          {[profile?.title, profile?.company || profile?.instituteName].filter(Boolean).join(' Â· ')}
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
                        <a key={link.platform} href={link.url && !/^https?:\/\//i.test(link.url) ? `https://${link.url}` : link.url} target="_blank" rel="noopener noreferrer"
                          className="text-[#9199a3] hover:text-[#18191c] transition-colors" title={link.platform}>
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
                      <button onClick={() => setEditOpen(true)}
                        className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f0eeff] text-[#6b50ff] text-xs font-semibold rounded-full hover:bg-[#e4dcff] transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                        Edit Profile
                      </button>
                      <button onClick={() => setAddSectionOpen(true)}
                        className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f0eeff] text-[#6b50ff] text-xs font-semibold rounded-full hover:bg-[#e4dcff] transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        Add Profile Section
                      </button>
                      <div className="relative">
                        <button onClick={() => setMoreMenuOpen((v) => !v)}
                          className="w-[34px] h-[34px] border border-[#e4e5e8] rounded-full flex items-center justify-center text-[#9199a3] hover:border-[#6b50ff] hover:text-[#6b50ff] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /><circle cx="5" cy="12" r="1.5" /></svg>
                        </button>
                        {moreMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                            <div className="absolute left-0 top-[calc(100%+6px)] w-44 bg-white rounded-xl shadow-lg border border-[#f2f2f3] z-50 overflow-hidden py-1">
                              <button onClick={() => { setMoreMenuOpen(false); setShowShareModal(true); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#f8f8f8] text-left">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>
                                Share Profile
                              </button>
                              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#f8f8f8] text-left">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                                About My Profile
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Community button — state-driven */}
                      <button
                        onClick={handleCommunityAction}
                        disabled={communityLoading}
                        className={`flex items-center gap-1.5 h-[36px] px-4 text-xs font-semibold rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          communityStatus === 'connected'
                            ? 'bg-[rgba(167,85,255,0.18)] text-[#6656cd] hover:bg-red-50 hover:text-red-600'
                            : communityStatus === 'pending'
                            ? 'bg-[rgba(167,85,255,0.06)] text-[#9199a3] border border-[#e4e5e8] hover:bg-red-50 hover:text-red-500'
                            : 'bg-[rgba(167,85,255,0.1)] text-[#6656cd] hover:bg-[rgba(167,85,255,0.18)]'
                        }`}
                      >
                        {communityStatus === 'connected' ? (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                            Remove from Community
                          </>
                        ) : communityStatus === 'pending' ? (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                            </svg>
                            Request Sent
                          </>
                        ) : (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <line x1="19" y1="8" x2="19" y2="14" />
                              <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                            Add To Community
                          </>
                        )}
                      </button>

                      {/* Message — purple pill, navigates to messages */}
                      <button
                        onClick={() => navigate('/messages')}
                        className="flex items-center gap-1.5 h-[36px] px-4 bg-[rgba(167,85,255,0.1)] text-[#6656cd] text-xs font-semibold rounded-full hover:bg-[rgba(167,85,255,0.18)] transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        Message
                      </button>

                      {/* Endorse — orange pill */}
                      <button
                        onClick={handleEndorse}
                        disabled={endorseLoading}
                        className={`flex items-center gap-1.5 h-[36px] px-4 text-xs font-semibold rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          isEndorsed
                            ? 'bg-[#f77f00] text-white hover:bg-[#e06e00]'
                            : 'bg-[#ffeacc] text-[#f77f00] hover:bg-[#ffd9a0]'
                        }`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill={isEndorsed ? 'white' : 'none'} stroke={isEndorsed ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="6" />
                          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                        </svg>
                        {isEndorsed ? 'Endorsed' : 'Endorse'}
                      </button>

                      {/* Three dots with dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setViewerMoreOpen((v) => !v)}
                          className="w-[36px] h-[36px] rounded-full border border-[#e4e5e8] flex items-center justify-center text-[#9199a3] hover:bg-[#f3f4f6] hover:border-[#9199a3] transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                          </svg>
                        </button>
                        {viewerMoreOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setViewerMoreOpen(false)} />
                            <div className="absolute left-0 top-[calc(100%+6px)] w-[196px] bg-white border border-[#d6d6d6] rounded-[8px] shadow-lg z-50 py-[2px] overflow-hidden">
                              {[
                                { label: isBlocked ? 'Unblock' : 'Block', danger: true, onClick: () => { setViewerMoreOpen(false); isBlocked ? handleUnblock() : setShowBlockConfirm(true); } },
                                { label: 'Report', danger: true, onClick: () => { setViewerMoreOpen(false); setShowReportModal(true); } },
                                { label: isMuted ? 'Unmute' : 'Mute', danger: false, onClick: () => { setViewerMoreOpen(false); handleMuteToggle(); } },
                                { label: 'Remove from community', danger: false, onClick: () => { setViewerMoreOpen(false); handleRemoveFromCommunity(); } },
                              ].map(({ label, danger, onClick }) => (
                                <button
                                  key={label}
                                  onClick={onClick}
                                  className={`w-full flex items-center px-[16px] py-[12px] text-[14px] font-medium text-left hover:bg-[#f8f8f8] transition-colors ${
                                    danger ? 'text-[#c00f0c]' : 'text-[#6b6b6b]'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-5 mb-1">
                  <div className="flex items-stretch border border-[#e4e5e8] rounded-xl overflow-hidden divide-x divide-[#e4e5e8] shadow-[0px_1px_4px_rgba(0,0,0,0.06)]">
                    {[
                      { label: 'Endorsements', value: String(endorsementCount) },
                      { label: 'Review', value: String(reviews.length) },
                      { label: 'Achievements', value: String(achievements.length) },
                      { label: 'Community Members', value: String(communityMembersCount) },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={() => { if (s.label === 'Community Members') setShowCommunityModal(true); }}
                        className={`flex-1 flex flex-col items-center justify-center py-3 px-2 hover:bg-[#fff8ee] transition-colors ${s.label === 'Community Members' ? 'cursor-pointer' : ''}`}
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
                  {reachForTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {reachForTags.map((tag) => (
                        <span key={tag} className="bg-[#fff6ed] text-[#ff9400] text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#ffeacc]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#9199a3] text-sm">Not specified yet.</p>
                  )}
                </div>

                <Divider />

                {/* 3-column section */}
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
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.8" /></svg>
                          <span><span className="text-[#18191c] font-medium">Languages</span><br />{profile.languages}</span>
                        </div>
                      )}
                      {profile?.website && (
                        <div className="flex items-start gap-2 text-[#5e6670] text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                          <span><span className="text-[#18191c] font-medium">Profile URL</span><br />
                            <a href={!/^https?:\/\//i.test(profile.website) ? `https://${profile.website}` : profile.website} target="_blank" rel="noopener noreferrer" className="text-[#5e6670] hover:text-[#ff9400] hover:underline">
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
                    <p className="text-[#18191c] text-sm font-semibold mb-3">Portfolio / Resume</p>
                    <div className="w-[150px] rounded-xl border border-[#e4e5e8] bg-white shadow-sm overflow-hidden">
                      <div className="w-full h-[120px] bg-[#fff4e5] flex items-center justify-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#ff9400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="14 2 14 8 20 8" stroke="#ff9400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="16" y1="13" x2="8" y2="13" stroke="#ff9400" strokeWidth="1.8" strokeLinecap="round"/>
                          <line x1="16" y1="17" x2="8" y2="17" stroke="#ff9400" strokeWidth="1.8" strokeLinecap="round"/>
                          <polyline points="10 9 9 9 8 9" stroke="#ff9400" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="flex border-t border-[#f2f2f3]">
                        <button
                          onClick={async () => {
                            if (!profile?.resumeUrl) return;
                            try {
                              const token = await getFreshToken();
                              const res = await fetch(`${API_URL}/api/profile/resume`, { headers: { Authorization: `Bearer ${token}` } });
                              const data = await res.json();
                              if (data.url) window.open(data.url, '_blank');
                              else if (profile.resumeUrl) window.open(profile.resumeUrl, '_blank');
                            } catch {
                              if (profile?.resumeUrl) window.open(profile.resumeUrl, '_blank');
                            }
                          }}
                          disabled={!profile?.resumeUrl}
                          className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[#ff9400] hover:bg-[#fff4e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          <span className="text-[10px] font-medium">View</span>
                        </button>
                      </div>
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
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="#9199a3" strokeWidth="1.5" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[#18191c] text-sm font-semibold">{exp.role}</p>
                              <p className="text-[#5e6670] text-xs mt-1.5">
                                <span className="font-bold text-[#18191c]">{exp.company}</span>
                                {[exp.emp_type, formatPeriod(exp)].filter(Boolean).map((text, i) => (
                                  <span key={i}> Â· {text}</span>
                                ))}
                              </p>
                              {exp.location && <p className="text-[#9199a3] text-xs mt-1.5">{exp.location}</p>}
                            </div>
                            {isOwn && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => setEditExp(exp)} className="text-[#ff9400] hover:text-[#e68500] transition-colors p-1">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                <button onClick={async () => { if (window.confirm('Delete this experience?')) { await deleteExperience(exp.id); loadExperiences(); } }} className="text-[#ff9400] hover:text-red-500 transition-colors p-1">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                                </button>
                              </div>
                            )}
                          </div>
                          {exp.description && (
                            <p className="text-[#5e6670] text-xs mt-3 leading-relaxed">{exp.description}</p>
                          )}
                          {exp.skills && exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {exp.skills.map((skill, i) => (
                                <span key={i} className="px-4 py-1.5 rounded-full border border-[#ff9400] text-[#ff9400] text-xs font-medium bg-white hover:bg-[#fff8ee] transition-colors cursor-default">
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
                        canReview && (
                          <button
                            onClick={() => setShowReviewModal(true)}
                            className="h-[40px] px-8 bg-[#ff9400] text-white text-sm font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)]"
                          >
                            Write A Review
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                <Divider />

                {/* Personal Achievements */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">Personal Achievements</h3>
                    <button onClick={() => setShowAllAchievements(true)} className="text-[#ff9400] text-sm font-medium hover:underline">View All</button>
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
                    <button onClick={() => setShowAllCollab(true)} className="text-[#ff9400] text-sm font-medium hover:underline">View All</button>
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
                            <p className="text-[#18191c] text-base font-bold leading-snug" style={{ marginTop: '12px' }}>{a.title}</p>
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
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                                <button onClick={() => setEditEdu(edu)} className="text-[#ff9400] hover:text-[#e68500] transition-colors p-1">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                <button onClick={async () => { await deleteEducation(edu.id); loadEducations(); }} className="text-[#ff9400] hover:text-red-500 transition-colors p-1">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
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
                    <button onClick={() => navigate(`/profile/${userId}/posts`)} className="text-[#ff9400] text-sm font-medium hover:underline">View All</button>
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

      {/* Community Members Modal */}
      {showCommunityModal && resolvedUserId && (
        <CommunityMembersModal profileUserId={resolvedUserId} onClose={() => setShowCommunityModal(false)} />
      )}

      {/* Block Confirm Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowBlockConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#18191c] text-base font-bold mb-2">
              Block {profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'this user'}?
            </h2>
            <p className="text-[#5e6670] text-sm mb-6 leading-relaxed">
              They won't be able to see your profile or find your content on Impactshaala. They won't be notified that you blocked them.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="h-[38px] px-5 border border-[#e4e5e8] rounded-full text-sm text-[#5e6670] hover:bg-[#f8f8f8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockConfirm}
                className="h-[38px] px-5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3]">
              <h2 className="text-[#18191c] text-base font-semibold">Report</h2>
              <button onClick={() => setShowReportModal(false)} className="text-[#9199a3] hover:text-[#18191c]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-[#5e6670] text-sm mb-3">Why are you reporting this profile?</p>
              {['Harassment or bullying', 'Spam', 'Inappropriate content', 'Fake profile', 'Other'].map((reason) => (
                <button
                  key={reason}
                  onClick={handleReportSubmit}
                  className="w-full flex items-center justify-between py-3 border-b border-[#f2f2f3] last:border-0 text-sm text-[#18191c] hover:text-[#ff9400] transition-colors text-left"
                >
                  {reason}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating toasts */}
      {muteToastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#18191c] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 pointer-events-none">
          {isMuted ? 'User muted' : 'User unmuted'}
        </div>
      )}
      {blockDoneToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#18191c] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 pointer-events-none">
          User blocked
        </div>
      )}
      {unblockDoneToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#18191c] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 pointer-events-none">
          User unblocked
        </div>
      )}
      {reportDoneToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#18191c] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 pointer-events-none">
          Report submitted. Thank you.
        </div>
      )}

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
              { label: 'Experience', onClick: () => { setAddSectionOpen(false); setAddExpOpen(true); } },
              { label: 'Education', onClick: () => { setAddSectionOpen(false); setAddEduOpen(true); } },
              { label: 'Personal Achievement', onClick: () => { setAddSectionOpen(false); setAddAchievementOpen(true); } },
              { label: 'Collaborative Accomplishment', onClick: () => { setAddSectionOpen(false); setAddCollabOpen(true); } },
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

      {showAllAchievements && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAllAchievements(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3]">
              <h2 className="text-[#18191c] text-base font-semibold">Personal Achievements</h2>
              <div className="flex items-center gap-3">
                {isOwn && (
                  <button
                    onClick={() => { setShowAllAchievements(false); setAddAchievementOpen(true); }}
                    className="flex items-center gap-1 text-[#ff9400] text-sm font-medium hover:underline"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#ff9400" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    Add
                  </button>
                )}
                <button onClick={() => setShowAllAchievements(false)} className="text-[#9199a3] hover:text-[#18191c]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {achievements.length === 0 ? (
                <p className="text-[#9199a3] text-sm text-center py-8">No personal achievements added yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {achievements.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setShowAllAchievements(false); setSelectedAchievement(a); }}
                      className="border-2 border-[#ffd9a0] rounded-xl p-5 pt-6 relative bg-white hover:bg-[#fffaf4] transition-colors flex flex-col items-center text-center min-h-[130px] justify-center"
                    >
                      <div className="absolute top-2.5 right-2.5"><BadgeIcon /></div>
                      <p className="text-[#18191c] text-base font-bold leading-snug">{a.title}</p>
                      {a.achieved_date && (
                        <p className="text-[#9199a3] text-sm mt-2">
                          Achieved on: {new Date(a.achieved_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAllCollab && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAllCollab(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3]">
              <h2 className="text-[#18191c] text-base font-semibold">Collaborative Achievements</h2>
              <div className="flex items-center gap-3">
                {isOwn && (
                  <button
                    onClick={() => { setShowAllCollab(false); setAddCollabOpen(true); }}
                    className="flex items-center gap-1 text-[#ff9400] text-sm font-medium hover:underline"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#ff9400" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    Add
                  </button>
                )}
                <button onClick={() => setShowAllCollab(false)} className="text-[#9199a3] hover:text-[#18191c]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {collabAccomplishments.length === 0 ? (
                <p className="text-[#9199a3] text-sm text-center py-8">No collaborative achievements yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {collabAccomplishments.map((a) => {
                    const collabs = a.collaborators ?? [];
                    const firstName = collabs[0]?.name ?? '';
                    const othersCount = collabs.length - 1;
                    const dateStr = [a.achieved_month, a.achieved_year].filter(Boolean).join(' ');
                    return (
                      <button
                        key={a.id}
                        onClick={() => { setShowAllCollab(false); setSelectedCollab(a); }}
                        className="border-2 border-[#ffd9a0] rounded-xl p-5 pt-6 relative bg-white hover:bg-[#fffaf4] transition-colors flex flex-col items-center text-center min-h-[130px] justify-center"
                      >
                        <div className="absolute top-2.5 right-2.5"><BadgeIcon /></div>
                        <p className="text-[#18191c] text-base font-bold leading-snug" style={{ marginTop: '12px' }}>{a.title}</p>
                        {collabs.length > 0 && (
                          <p className="text-[#5e6670] text-sm mt-2 leading-relaxed">
                            {firstName}
                            {othersCount > 0 && (
                              <> and <span className="text-[#ff9400] font-semibold">{othersCount} others</span></>
                            )}
                          </p>
                        )}
                        {dateStr && <p className="text-[#9199a3] text-sm mt-0.5">Achieved on &nbsp;{dateStr}</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAllPosts && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setShowAllPosts(false); setDeletingPostId(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3]">
              <h2 className="text-[#18191c] text-base font-semibold">All Posts</h2>
              <button onClick={() => { setShowAllPosts(false); setDeletingPostId(null); }} className="text-[#9199a3] hover:text-[#18191c]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {posts.length === 0 ? (
                <p className="text-[#9199a3] text-sm text-center py-8">No posts yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {posts.map((post) => {
                    const img = post.media_urls?.[0] || post.cover_image_url || postImg1;
                    const title = post.event_title || post.poll_question || post.question_text || post.content?.slice(0, 80) || 'Post';
                    const desc = post.content || post.event_description || '';
                    const isConfirming = deletingPostId === post.id;
                    return (
                      <div key={post.id} className="flex gap-4 rounded-xl border border-[#f2f2f3] overflow-hidden bg-white hover:shadow-md transition-shadow">
                        <img src={img} alt={title} className="w-24 h-20 object-cover flex-shrink-0 bg-slate-50" />
                        <div className="py-3 pr-3 flex items-center flex-1 min-w-0 gap-3">
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-[#18191c] text-sm font-semibold leading-snug line-clamp-2">{title}</p>
                            {desc && <p className="text-[#9199a3] text-xs mt-1.5 leading-snug line-clamp-2">{desc}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isConfirming ? (
                              <>
                                <span className="text-xs text-[#9199a3]">Delete?</span>
                                <button
                                  onClick={async () => {
                                    await deletePost(post.id);
                                    setPosts((prev) => prev.filter((p) => p.id !== post.id));
                                    setDeletingPostId(null);
                                  }}
                                  className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg font-medium"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setDeletingPostId(null)}
                                  className="text-xs text-[#18191c] bg-[#f2f2f3] hover:bg-[#e8e8e8] px-2.5 py-1 rounded-lg font-medium"
                                >
                                  No
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setDeletingPostId(post.id)}
                                className="text-[#9199a3] hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                title="Delete post"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                </svg>
                              </button>
                            )}
                          </div>
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

      {/* Write Review Modal */}
      {showReviewModal && profile && (
        <WriteReviewModal
          targetUserId={resolvedUserId}
          targetName={`${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'this user'}
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

      {/* Share Profile Modal */}
      {showShareModal && profile && (() => {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = today.toLocaleString('en-GB', { month: 'long' });
        const year = today.getFullYear();
        const dateStr = `${day}-${month}-${year}`;
        const profileUrl = `${window.location.origin}/profile/${resolvedUserId}`;
        const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
        const roleCompany = [profile.title, profile.company || profile.instituteName].filter(Boolean).join(' • ');
        const handle = `@${(profile.firstName ?? '').toLowerCase()}${(profile.lastName ?? '').toLowerCase()}`.replace(/\s+/g, '');
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}&margin=10`;
        return (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => { setShowShareModal(false); setCopyDone(false); setShowQR(false); }}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-[340px] shadow-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* QR toggle button — top-right corner, always visible */}
              <button
                onClick={() => setShowQR((v) => !v)}
                className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                title={showQR ? 'Back to share card' : 'Show QR code'}
              >
                {showQR ? (
                  /* back arrow when QR is open */
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M5 12l7 7M5 12l7-7" />
                  </svg>
                ) : (
                  /* QR icon when share card is open */
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zm1 1h3v3H5V5zM14 3h7v7h-7V3zm1 1v5h5V4h-5zm1 1h3v3h-3V5zM3 14h7v7H3v-7zm1 1v5h5v-5H4zm1 1h3v3H5v-3zM14 14h2v2h-2v-2zm3 0h2v2h-2v-2zm-3 3h2v2h-2v-2zm3 0h2v2h-2v-2z" />
                  </svg>
                )}
              </button>

              {showQR ? (
                /* ── QR Code View ── */
                <div className="flex flex-col">
                  {/* Gradient header */}
                  <div className="bg-gradient-to-br from-[#8b2fc9] via-[#d03a8c] to-[#ff6b35] h-[84px] flex flex-col items-center justify-center px-4 pt-2">
                    <p className="text-white text-base font-bold tracking-wide">Impactshaala</p>
                    <p className="text-white/80 text-xs mt-0.5">{fullName}</p>
                  </div>

                  {/* QR code */}
                  <div className="flex flex-col items-center py-7 px-6 bg-white">
                    <div className="w-[230px] h-[230px] rounded-2xl overflow-hidden border border-[#f2f2f3] shadow-sm bg-white flex items-center justify-center">
                      <img
                        src={qrUrl}
                        alt="Profile QR Code"
                        className="w-[220px] h-[220px]"
                      />
                    </div>
                    <p className="text-[#9199a3] text-[11px] mt-3 text-center">Scan to view profile</p>
                  </div>

                  {/* Handle strip */}
                  <div className="mx-5 mb-6 rounded-xl bg-gradient-to-r from-[#ff9400] to-[#ff6600] flex items-center justify-center py-3.5">
                    <p className="text-white text-sm font-bold tracking-wider">{handle}</p>
                  </div>
                </div>
              ) : (
                /* ── Share Card View ── */
                <>
                  {/* Gradient cover */}
                  <div className="relative h-[110px] bg-gradient-to-br from-[#8b2fc9] via-[#d03a8c] to-[#ff6b35] overflow-visible">
                    {profile.coverUrl && (
                      <img src={profile.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}
                    <div className="absolute -bottom-[44px] left-1/2 -translate-x-1/2">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={fullName}
                          className="w-[88px] h-[88px] rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-[88px] h-[88px] rounded-full bg-[#ff9400] flex items-center justify-center border-4 border-white shadow-lg">
                          <span className="text-white text-3xl font-bold">
                            {(profile.firstName?.[0] ?? '?').toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="pt-[54px] pb-6 px-6 flex flex-col items-center">
                    <h2 className="text-[#18191c] text-[20px] font-bold leading-tight text-center">{fullName || 'Profile'}</h2>
                    {roleCompany && (
                      <p className="text-[#5e6670] text-[13px] text-center mt-1">{roleCompany}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-stretch w-full border border-[#e4e5e8] rounded-xl overflow-hidden divide-x divide-[#e4e5e8] mt-5 shadow-[0px_1px_4px_rgba(0,0,0,0.06)]">
                      {[
                        { label: 'Endorsements', value: String(endorsementCount) },
                        { label: 'Reviews', value: String(reviews.length) },
                        { label: 'Achievement', value: String(achievements.length) },
                      ].map((s) => (
                        <div key={s.label} className="flex-1 flex flex-col items-center py-3 px-1">
                          <span className="text-[#ff9400] text-[17px] font-bold leading-tight">{s.value}</span>
                          <span className="text-[#18191c] text-[10px] font-medium text-center mt-0.5 leading-snug">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons on orange gradient */}
                    <div className="w-full mt-5 bg-gradient-to-r from-[#ff9400] to-[#ff6600] rounded-xl p-3">
                      <div className="flex gap-2.5">
                        <button
                          onClick={async () => {
                            if (navigator.share) {
                              try { await navigator.share({ title: `${fullName}'s profile on Impactshaala`, url: profileUrl }); } catch {}
                            } else {
                              await navigator.clipboard.writeText(profileUrl).catch(() => {});
                              setCopyDone(true);
                              setTimeout(() => setCopyDone(false), 2000);
                            }
                          }}
                          className="flex-1 bg-white rounded-lg flex flex-col items-center gap-2 py-3 text-[#5e6670] hover:text-[#ff9400] hover:bg-[#fff8ee] transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                          </svg>
                          <span className="text-[11px] font-semibold">Share profile</span>
                        </button>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(profileUrl).catch(() => {});
                            setCopyDone(true);
                            setTimeout(() => setCopyDone(false), 2000);
                          }}
                          className="flex-1 bg-white rounded-lg flex flex-col items-center gap-2 py-3 text-[#5e6670] hover:text-[#ff9400] hover:bg-[#fff8ee] transition-colors"
                        >
                          {copyDone ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                            </svg>
                          )}
                          <span className="text-[11px] font-semibold">{copyDone ? 'Copied!' : 'Copy link'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Date */}
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