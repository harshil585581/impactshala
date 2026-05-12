import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import EditProfileModal from '../../components/profile/EditProfileModal';
import ToastContainer from '../../components/ui/Toast';
import { useProfile } from '../../hooks/useProfile';

// ─── Mock data (for sections not yet backed by real data) ───────────────────
const postImg1 = "https://www.figma.com/api/mcp/asset/d208c4d3-690e-45f8-8437-d98e914f6319";


const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const MOCK_EXPERIENCES = [
  {
    id: '1',
    role: 'Product Designer',
    company: 'Canker',
    type: 'Full Time',
    period: '2021 – Present · 0 yrs',
    skills: ['UX Research', 'Wireframing', 'Prototyping', 'Figma'],
    description: '',
  },
  {
    id: '2',
    role: 'Growth Marketing Designer',
    company: 'LinkedIn',
    type: 'Full Time',
    period: 'Nov 2020 – Jan 2021 · 3 mos',
    skills: [],
    description: 'Developed digital marketing strategies, collaborations, ecosystems, customer proposition for short timelines.',
  },
];

const MOCK_REVIEWS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    rating: 4,
    text: 'Excellent work and very professional. Highly recommended for UI/UX projects.',
  },
  {
    id: '2',
    name: 'David Chen',
    rating: 4,
    text: 'Great collaboration and communication. Will definitely work together again.',
  },
];

const MOCK_PERSONAL_ACHIEVEMENTS = [
  { id: '1', title: 'UI/UX Certificate By Impactshaala', img: postImg1 },
  { id: '2', title: 'UI/UX Certificate By Impactshaala', img: postImg1 },
  { id: '3', title: 'UI/UX Certificate By Impactshaala', img: postImg1 },
  { id: '4', title: 'UI/UX Certificate By Impactshaala', img: postImg1 },
];

const MOCK_COLLAB_ACHIEVEMENTS = [
  {
    id: '1',
    title: 'Product Design Community Group Sprint',
    org: 'Sarah Anderson and 3 others',
    period: 'March 2024 - September 2024',
  },
  {
    id: '2',
    title: 'Launched Community by Abusoph for',
    org: 'David Chen · 2 Projects',
    period: 'Started: June 2023',
  },
];

const MOCK_EDUCATIONS = [
  {
    id: '1',
    school: 'Harvard University',
    degree: 'Bachelors in Arts, Human Psychology',
    period: '2010 – 2014',
    description: 'Also Founded the Tech Club and Helped in Delta 20 Projects and took part in various business opportunities during the internship, delivering impact to the students.',
  },
  {
    id: '2',
    school: 'University of Toronto',
    degree: 'Masters in Computer Science',
    period: '2015 – 2016',
  },
];

const MOCK_POSTS = [
  { id: '1', img: postImg1, title: 'Redesigning the Stock Fusion Dashboard' },
  { id: '2', img: postImg1, title: 'Mobile App Web Learning' },
  { id: '3', img: postImg1, title: 'User Testing Insights' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes('linkedin'))
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 3C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19ZM18.5 18.5V13.2C18.5 12.3354 18.1565 11.5062 17.5452 10.8948C16.9338 10.2835 16.1046 9.94 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17C14.6813 12.17 15.0374 12.3175 15.2999 12.5801C15.5625 12.8426 15.71 13.1987 15.71 13.57V18.5H18.5ZM6.88 8.56C7.32556 8.56 7.75288 8.383 8.06794 8.06794C8.383 7.75288 8.56 7.32556 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19C6.43178 5.19 6.00193 5.36805 5.68499 5.68499C5.36805 6.00193 5.19 6.43178 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56ZM8.27 18.5V10.13H5.5V18.5H8.27Z" fill="currentColor"/></svg>;
  if (p.includes('github'))
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>;
  if (p.includes('behance'))
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.7zM19.34 13c-.104-1.336-1.02-1.893-1.97-1.893-1.04 0-1.856.63-2.01 1.893h3.98zM0 5h6.599c3.098 0 4.199 1.787 4.199 3.541 0 1.657-.895 2.652-2.099 3.151 1.441.35 2.739 1.426 2.739 3.338 0 2.531-1.978 3.97-5.098 3.97H0V5zm4.339 5.816c1.12 0 1.661-.465 1.661-1.278 0-.791-.51-1.197-1.575-1.197H3.35v2.475h.989zm.242 5.107c1.185 0 1.838-.526 1.838-1.489 0-.883-.577-1.408-1.855-1.408H3.35v2.897h1.231z"/></svg>;
  if (p.includes('dribbble'))
    return <svg width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>;
  if (p.includes('instagram'))
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
  if (p.includes('twitter') || p.includes('x'))
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (p.includes('facebook'))
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>;
  if (p.includes('youtube'))
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>;
  if (p.includes('medium') || p.includes('substack'))
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>;
  // Generic link icon fallback
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));
const EMP_TYPES = ['Full Time','Part Time','Self-employed','Freelance','Contract','Internship','Apprenticeship'];

function AddExperienceModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [empType, setEmpType] = useState('');
  const [company, setCompany] = useState('');
  const [current, setCurrent] = useState(false);
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const sel = 'w-full h-[44px] border border-[#e4e5e8] bg-white rounded-lg px-3 text-sm text-[#18191c] focus:outline-none focus:border-[#ff9400] appearance-none';
  const inp = 'w-full h-[44px] border border-[#e4e5e8] bg-white rounded-lg px-3 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400]';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3] shrink-0">
          <h2 className="text-[#18191c] text-base font-semibold">Add Experience</h2>
          <button onClick={onClose} className="text-[#9199a3] hover:text-[#18191c] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
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
              {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select className={sel} value={startYear} onChange={(e) => setStartYear(e.target.value)}>
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {!current && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[#18191c] font-medium">End Date <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <select className={sel} value={endMonth} onChange={(e) => setEndMonth(e.target.value)}>
                  <option value="">Month</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className={sel} value={endYear} onChange={(e) => setEndYear(e.target.value)}>
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Location <span className="text-red-500">*</span></label>
            <input className={inp} placeholder="Ex: Bangalore, India" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#18191c] font-medium">Description</label>
            <textarea
              rows={4}
              placeholder="Ex: List your major duties and successes, highlighting specific projects"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              className="w-full border border-[#e4e5e8] bg-white rounded-lg px-3 py-2.5 text-sm text-[#18191c] placeholder-[#9199a3] focus:outline-none focus:border-[#ff9400] resize-none"
            />
            <p className="text-[#9199a3] text-xs text-right">{description.length}/1,000</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-[#18191c] font-medium">Skill</label>
            <p className="text-xs text-[#9199a3]">We recommend adding your top 5 used skills in this experience.</p>
            <div className="flex flex-wrap gap-2 mb-1">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1 bg-[#ffeacc] text-[#ff9400] text-xs px-3 py-1 rounded-full">
                  {s}
                  <button type="button" onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { const v = prompt('Enter skill'); if (v?.trim()) setSkills((s) => [...s, v.trim()]); }}
              className="self-start h-[36px] px-5 border border-[#ff9400] text-[#ff9400] text-sm font-medium rounded-full hover:bg-[#fff6ed] transition-colors"
            >
              + Add Skill
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f2f2f3] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="h-[40px] px-8 bg-[#ff9400] text-white text-sm font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= rating ? '#ff9400' : '#e4e5e8'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[#18191c] text-base font-semibold">{title}</h3>
      {action}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#f2f2f3] my-5" />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { userId = 'me' } = useParams<{ userId?: string }>();
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

  const displayedExp = showAllExp ? MOCK_EXPERIENCES : MOCK_EXPERIENCES.slice(0, 1);
  const displayedEdu = showAllEdu ? MOCK_EDUCATIONS : MOCK_EDUCATIONS.slice(0, 1);

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
                  <div className="h-4 w-28 bg-[#f1f2f4] rounded" />
                  <div className="h-4 w-56 bg-[#f1f2f4] rounded" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[14px] border border-[#f2f2f3] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">

              {/* ── Cover image — only shown if uploaded ── */}
              {profile?.coverUrl && (
                <div className="relative w-full h-[160px] sm:h-[200px]">
                  <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}

              {/* ── Header ── */}
              <div className="px-8 pt-6 pb-0">
                <div className="flex items-start justify-between gap-4">

                  {/* Avatar + Info */}
                  <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {profile?.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt="avatar"
                          className="w-[88px] h-[88px] rounded-full object-cover border-[3px] border-white shadow-md"
                        />
                      ) : (
                        <div className="w-[88px] h-[88px] rounded-full bg-[#ff9400] flex items-center justify-center border-[3px] border-white shadow-md">
                          <span className="text-white text-3xl font-bold">
                            {profile?.firstName?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 bg-[#22c55e] rounded-full border-2 border-white" />
                    </div>

                    {/* Name / Title / Bio */}
                    <div className="flex flex-col gap-1 min-w-0 pt-1">
                      <h1 className="text-[#18191c] text-2xl font-bold leading-tight">
                        {profile ? `${profile.firstName} ${profile.lastName}`.trim() : ''}
                      </h1>
                      {(profile?.title || profile?.company || profile?.instituteName) && (
                        <p className="text-[#5e6670] text-sm font-medium">
                          {[profile.title, profile.company || profile.instituteName].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {profile?.location && (
                        <p className="text-[#9199a3] text-xs">{profile.location}</p>
                      )}
                      {profile?.bio && (
                        <p className="text-[#5e6670] text-sm mt-1 leading-relaxed max-w-xl">{profile.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Social icons — from real profile data */}
                  {profile?.socialLinks && profile.socialLinks.length > 0 && (
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end pt-1">
                      {profile.socialLinks.map((link) => (
                        <a
                          key={link.platform}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#9199a3] hover:text-[#18191c] transition-colors"
                          aria-label={link.platform}
                          title={link.platform}
                        >
                          <SocialIcon platform={link.platform} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-5 flex-wrap">
                  {isOwn ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditOpen(true)}
                        className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f0eeff] text-[#6b50ff] text-xs font-semibold rounded-full hover:bg-[#e4dcff] transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setAddSectionOpen(true)}
                        className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f0eeff] text-[#6b50ff] text-xs font-semibold rounded-full hover:bg-[#e4dcff] transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        Add Profile Section
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMoreMenuOpen((v) => !v)}
                          className="w-[34px] h-[34px] border border-[#e4e5e8] rounded-full flex items-center justify-center text-[#9199a3] hover:border-[#6b50ff] hover:text-[#6b50ff] transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
                        </button>
                        {moreMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                            <div className="absolute left-0 top-[calc(100%+6px)] w-44 bg-white rounded-xl shadow-[0px_8px_24px_rgba(0,0,0,0.12)] border border-[#f2f2f3] z-50 overflow-hidden py-1">
                              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#f8f8f8] transition-colors text-left">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                                Share Profile
                              </button>
                              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#f8f8f8] transition-colors text-left">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                                About My Profile
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <button className="flex items-center gap-1.5 h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        Add to Community
                      </button>
                      <button className="flex items-center gap-1.5 h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Message
                      </button>
                      <button
                        onClick={follow}
                        className="h-[34px] px-4 border border-[#e4e5e8] text-[#18191c] text-xs font-medium rounded-full hover:border-[#ff9400] hover:text-[#ff9400] transition-colors"
                      >
                        {profile?.isFollowing ? 'Following' : '+ Follow'}
                      </button>
                      <button className="w-[34px] h-[34px] border border-[#e4e5e8] rounded-full flex items-center justify-center text-[#9199a3] hover:border-[#ff9400] hover:text-[#ff9400] transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-5 pb-5 border-b border-[#f2f2f3] flex-wrap">
                  {[
                    { label: 'Recommendations', value: '143' },
                    { label: 'Reviews', value: '64' },
                    { label: 'Achievements', value: '48' },
                    { label: 'Community Members', value: '1.2k' },
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-[#ff9400] text-base font-bold">{s.value}</span>
                      <span className="text-[#18191c] text-[11px] font-medium text-center">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Body sections ── */}
              <div className="py-5 flex flex-col gap-0" style={{paddingLeft:'3.5rem',paddingRight:'3.5rem'}}>

                {/* Reach out */}
                <div>
                  <p className="text-[#18191c] text-sm font-semibold mb-3">Reach out to me for:</p>
                  <div className="flex flex-wrap gap-2">
                    {reachForTags.map((tag) => (
                      <span key={tag} className="bg-[#fff6ed] text-[#ff9400] text-xs font-medium px-3 py-1.5 rounded-full border border-[#ffeacc]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Interests + Additional Details + Portfolio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Interests */}
                  <div>
                    <p className="text-[#18191c] text-sm font-semibold mb-3">Interest</p>
                    <div className="flex flex-col gap-2">
                      {interests.map((item) => (
                        <span key={item} className="text-[#5e6670] text-sm">{item}</span>
                      ))}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <p className="text-[#18191c] text-sm font-semibold mb-3">Additional Details</p>
                    <div className="flex flex-col gap-2.5">
                      {profile?.languages && (
                        <div className="flex items-center gap-2 text-[#5e6670] text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.8"/></svg>
                          {profile.languages}
                        </div>
                      )}
                      {profile?.website && (
                        <div className="flex items-center gap-2 text-[#5e6670] text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#ff9400] hover:underline truncate max-w-[140px]">
                            {profile.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      {profile?.location && (
                        <div className="flex items-center gap-2 text-[#5e6670] text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                          {profile.location}
                        </div>
                      )}
                      {!profile?.languages && !profile?.website && !profile?.location && (
                        <p className="text-[#9199a3] text-xs">No details added yet</p>
                      )}
                    </div>
                  </div>

                  {/* Portfolio/Resume */}
                  <div>
                    <p className="text-[#18191c] text-sm font-semibold mb-3">Portfolio/Resume</p>
                    {profile?.resumeUrl ? (
                      <button
                        onClick={async () => {
                          try {
                            const user = JSON.parse(localStorage.getItem('user') ?? '{}');
                            const res = await fetch(`${API_URL}/api/profile/resume`, {
                              headers: { Authorization: `Bearer ${user.access_token ?? ''}` },
                            });
                            const data = await res.json();
                            if (data.url) window.open(data.url, '_blank');
                          } catch { /* ignore */ }
                        }}
                        className="w-[80px] h-[100px] bg-[#fff6ed] rounded-[6px] border border-[#ffeacc] flex flex-col items-center justify-center gap-1 hover:bg-[#ffeacc] transition-colors"
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#ff9400]">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[10px] text-[#ff9400] font-medium">View PDF</span>
                      </button>
                    ) : (
                      <div className="w-[80px] h-[100px] bg-[#f3f5f7] rounded-[6px] border border-[#e4e5e8] flex items-center justify-center">
                        <span className="text-[10px] text-[#9199a3] text-center px-1">Not uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <Divider />

                {/* Experience */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#18191c] text-base font-semibold">Experience</h3>
                    {isOwn && (
                      <button
                        onClick={() => setAddExpOpen(true)}
                        className="w-[36px] h-[36px] rounded-full border border-[#e4e5e8] flex items-center justify-center text-[#9199a3] hover:border-[#ff9400] hover:text-[#ff9400] transition-colors"
                        title="Add Experience"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-5">
                    {displayedExp.map((exp) => (
                      <div key={exp.id} className="flex gap-3">
                        {/* Company logo placeholder */}
                        <div className="w-10 h-10 rounded-lg bg-[#f3f5f7] border border-[#e4e5e8] shrink-0 flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="#9199a3" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[#18191c] text-sm font-semibold">{exp.role}</p>
                              <p className="text-[#5e6670] text-xs mt-0.5">{exp.company} · {exp.type} · {exp.period}</p>
                            </div>
                          </div>
                          {exp.description && (
                            <p className="text-[#5e6670] text-xs mt-2 leading-relaxed">{exp.description}</p>
                          )}
                          {exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {exp.skills.map((skill) => (
                                <span key={skill} className="bg-[#f3f5f7] text-[#5e6670] text-[11px] px-2 py-0.5 rounded-full border border-[#e4e5e8]">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {MOCK_EXPERIENCES.length > 1 && (
                    <button
                      onClick={() => setShowAllExp((v) => !v)}
                      className="mt-4 text-[#ff9400] text-sm font-medium hover:underline"
                    >
                      {showAllExp ? 'Show less' : `Show ${MOCK_EXPERIENCES.length - 1} more experiences`}
                    </button>
                  )}
                </div>

                <Divider />

                {/* Reviews */}
                <div>
                  <SectionHeader
                    title="Reviews"
                    action={
                      <button className="h-[34px] px-5 bg-[#ff9400] text-white text-xs font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)]">
                        Write a Review
                      </button>
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MOCK_REVIEWS.map((review) => (
                      <div key={review.id} className="border border-[#f2f2f3] rounded-[10px] p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[#18191c] text-sm font-semibold">{review.name}</p>
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="text-[#5e6670] text-xs leading-relaxed">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Personal Achievements */}
                <div>
                  <SectionHeader
                    title="Personal Achievements"
                    action={<button className="text-[#ff9400] text-xs font-medium hover:underline">View All</button>}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MOCK_PERSONAL_ACHIEVEMENTS.map((a) => (
                      <div key={a.id} className="border border-[#f2f2f3] rounded-[10px] overflow-hidden">
                        <img src={a.img} alt={a.title} className="w-full h-[80px] object-cover" />
                        <div className="p-2">
                          <p className="text-[#18191c] text-[11px] font-medium leading-tight">{a.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Collaborative Achievements */}
                <div>
                  <SectionHeader
                    title="Collaborative Achievements"
                    action={<button className="text-[#ff9400] text-xs font-medium hover:underline">View All</button>}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MOCK_COLLAB_ACHIEVEMENTS.map((a) => (
                      <div key={a.id} className="border border-[#f2f2f3] rounded-[10px] p-4">
                        <p className="text-[#18191c] text-sm font-semibold leading-snug">{a.title}</p>
                        <p className="text-[#9199a3] text-xs mt-1">{a.org}</p>
                        <p className="text-[#9199a3] text-xs">{a.period}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Educations */}
                <div>
                  <SectionHeader title="Educations" />
                  <div className="flex flex-col gap-5">
                    {displayedEdu.map((edu) => (
                      <div key={edu.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#f3f5f7] border border-[#e4e5e8] shrink-0 flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#9199a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#18191c] text-sm font-semibold">{edu.school}</p>
                          <p className="text-[#5e6670] text-xs mt-0.5">{edu.degree}</p>
                          <p className="text-[#9199a3] text-xs mt-0.5">{edu.period}</p>
                          {edu.description && (
                            <p className="text-[#5e6670] text-xs mt-2 leading-relaxed">{edu.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {MOCK_EDUCATIONS.length > 1 && (
                    <button
                      onClick={() => setShowAllEdu((v) => !v)}
                      className="mt-4 text-[#ff9400] text-sm font-medium hover:underline"
                    >
                      {showAllEdu ? 'Show less' : `Show ${MOCK_EDUCATIONS.length - 1} more educations`}
                    </button>
                  )}
                </div>

                <Divider />

                {/* Recent Posts */}
                <div>
                  <SectionHeader
                    title="Recent Posts"
                    action={<button className="text-[#ff9400] text-xs font-medium hover:underline">View All</button>}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    {MOCK_POSTS.map((post) => (
                      <div key={post.id} className="rounded-[10px] overflow-hidden border border-[#f2f2f3]">
                        <img src={post.img} alt={post.title} className="w-full h-[90px] object-cover" />
                        <div className="p-2">
                          <p className="text-[#18191c] text-[11px] font-medium leading-tight line-clamp-2">{post.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              {/* end body */}
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
              <button onClick={() => setAddSectionOpen(false)} className="text-[#9199a3] hover:text-[#18191c] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            {[
              { label: 'Experience', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>, onClick: () => { setAddSectionOpen(false); setAddExpOpen(true); } },
              { label: 'Education', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, onClick: () => setAddSectionOpen(false) },
              { label: 'Personal Achievement', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>, onClick: () => setAddSectionOpen(false) },
              { label: 'Collaborative Accomplishment', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>, onClick: () => setAddSectionOpen(false) },
            ].map(({ label, icon, onClick }) => (
              <button
                key={label}
                className="w-full flex items-center justify-between px-6 py-4 border-b border-[#f2f2f3] last:border-0 text-[#18191c] text-sm hover:bg-[#f8f8f8] transition-colors text-left"
                onClick={onClick}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#9199a3]">{icon}</span>
                  {label}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Experience modal */}
      {addExpOpen && <AddExperienceModal onClose={() => setAddExpOpen(false)} />}

      {/* Edit modal */}
      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          saving={saving}
          onSave={async (data) => { await saveProfile(data); setEditOpen(false); }}
          onClose={() => setEditOpen(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
