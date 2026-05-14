import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';

const CODE_IMG = 'https://www.figma.com/api/mcp/asset/d208c4d3-690e-45f8-8437-d98e914f6319';

// ── Mock data ─────────────────────────────────────────────────────────────────

const COMMUNITY_POSTS = [
  { id: '1', user: 'Sarah Johnson', role: 'UX/UX Designer', time: '2 hours ago', text: "Excited to share my latest project on sustainable development! 🌱\n#Innovation #Sustainability", img: CODE_IMG, likes: 245, comments: 18, shares: 5 },
  { id: '2', user: 'Sarah Johnson', role: 'UX/UX Designer', time: '2 hours ago', text: "Excited to share my latest project on sustainable development! 🌱\n#Innovation #Sustainability", img: CODE_IMG, likes: 245, comments: 18, shares: 5 },
  { id: '3', user: 'Sarah Johnson', role: 'UX/UX Designer', time: '2 hours ago', text: "What's the most important factor when choosing a job?", isPoll: true, pollOptions: [{ label: 'Work-Life Balance', pct: 89 }, { label: 'Salary & Benefits', pct: 95 }, { label: 'Growth Opportunities', pct: 65 }, { label: 'Company Culture', pct: 0 }], likes: 245, comments: 18, shares: 5 },
];

const DISCOVER_POSTS = [
  { id: '1', user: 'Alex Johnson', role: 'UI/UX Designer • Accenture', time: '12h', title: 'Evolution Of Space And About Aliens', tags: ['Opportunity', 'Education • Experiential learning • Guest lecture'], mode: 'Onsite', payment: '₹ 5,000 / No fee', audience: 'Students', lastDate: '12/12/2024', img: CODE_IMG, likes: 1507, comments: 14 },
  { id: '2', user: 'Alex Johnson', role: 'UI/UX Designer • Accenture', time: '12h', title: 'Evolution Of Space And About Aliens', tags: ['Opportunity', 'Education • Experiential learning • Guest lecture'], mode: 'Onsite', payment: '₹ 5,000 / No fee', audience: 'Students', lastDate: '12/12/2024', img: CODE_IMG, likes: 1507, comments: 14 },
  { id: '3', user: 'Alex Johnson', role: 'UI/UX Designer • Accenture', time: '12h', title: 'Evolution Of Space And About Aliens', tags: ['Opportunity', 'Education • Experiential learning • Guest lecture'], mode: 'Onsite', payment: '₹ 5,000 / No fee', audience: 'Students', lastDate: '12/12/2024', img: CODE_IMG, likes: 1507, comments: 14 },
];

const LEARNING_POSTS = [
  { id: '1', img: CODE_IMG, university: 'University of Mumbai, Mumbai', title: 'Bachelor of Business Administration (BBA) Accountancy', level: 'High School (Grade 11 to 12)', mode: 'Onsite (Bangalore)', fee: '2 LPA', duration: '3 Months', deadline: '16/9/2025' },
  { id: '2', img: CODE_IMG, university: 'University of Mumbai, Mumbai', title: 'Bachelor of Business Administration (BBA) Accountancy', level: 'High School (Grade 11 to 12)', mode: 'Onsite (Bangalore)', fee: '2 LPA', duration: '3 Months', deadline: '16/9/2025' },
  { id: '3', img: CODE_IMG, university: 'University of Mumbai, Mumbai', title: 'Bachelor of Business Administration (BBA) Accountancy', level: 'High School (Grade 11 to 12)', mode: 'Onsite (Bangalore)', fee: '2 LPA', duration: '3 Months', deadline: '16/9/2025' },
];

const EMPLOYMENT_POSTS = [
  { id: '1', role: 'Product Manager', company: 'Accenture', location: 'Bangalore, Karnataka (Onsite)', exp: '0 – 2 Month', salary: '2 – 5 LPA', type: 'Full – Time', skills: ['Productivity', 'React', 'Management skill'], posted: '5 week Ago' },
  { id: '2', role: 'Product Manager', company: 'Accenture', location: 'Bangalore, Karnataka (Onsite)', exp: '0 – 2 Month', salary: '2 – 5 LPA', type: 'Full – Time', skills: ['Productivity', 'React', 'Management skill'], posted: '5 week Ago' },
  { id: '3', role: 'Product Manager', company: 'Accenture', location: 'Bangalore, Karnataka (Onsite)', exp: '0 – 2 Month', salary: '2 – 5 LPA', type: 'Full – Time', skills: ['Productivity', 'React', 'Management skill'], posted: '5 week Ago' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function UserInitials({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-[#ff9400] flex items-center justify-center shrink-0">
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
  );
}

function BookmarkIcon({ saved = true }: { saved?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? '#22c55e' : 'none'} stroke={saved ? '#22c55e' : '#9199a3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  );
}

// ── Card components ───────────────────────────────────────────────────────────

function CommunityCard({ post }: { post: typeof COMMUNITY_POSTS[0] }) {
  return (
    <div className="bg-white border border-[#f2f2f3] rounded-2xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserInitials name={post.user} />
          <div>
            <p className="text-[#18191c] text-sm font-semibold">{post.user}</p>
            <p className="text-[#9199a3] text-xs">{post.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[#ff9400]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </button>
          <button className="text-[#9199a3]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="text-[#18191c] text-sm leading-relaxed whitespace-pre-line">{post.text}</p>

      {/* Image */}
      {post.img && !post.isPoll && (
        <img src={post.img} alt="" className="w-full h-[200px] object-cover rounded-xl" />
      )}

      {/* Poll */}
      {post.isPoll && post.pollOptions && (
        <div className="flex flex-col gap-2">
          {post.pollOptions.map(opt => (
            <div key={opt.label} className="flex items-center gap-2">
              <div className="flex-1 bg-[#fff6ed] rounded-full h-8 relative overflow-hidden">
                {opt.pct > 0 && <div className="absolute left-0 top-0 bottom-0 bg-[#ffd9a0] rounded-full" style={{ width: `${opt.pct}%` }} />}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#18191c]">{opt.label}</span>
              </div>
              {opt.pct > 0 && <span className="text-sm text-[#18191c] shrink-0 w-8 text-right">{opt.pct}%</span>}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4 text-[#9199a3] text-sm">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4757"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            {post.likes}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            {post.comments}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            {post.shares}
          </span>
        </div>
        <BookmarkIcon saved />
      </div>
    </div>
  );
}

function DiscoverCard({ post }: { post: typeof DISCOVER_POSTS[0] }) {
  return (
    <div className="bg-white border border-[#f2f2f3] rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <UserInitials name={post.user} />
            <div>
              <p className="text-[#18191c] text-sm font-semibold">{post.user}</p>
              <div className="flex items-center gap-1 text-[#9199a3] text-xs">
                <span>{post.role}</span>
                <span>·</span>
                <span>{post.time}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="h-[30px] px-4 bg-[#ff9400] text-white text-xs font-bold rounded-full hover:bg-[#e68500] transition-colors">Get Started</button>
            <BookmarkIcon saved />
          </div>
        </div>

        <h3 className="text-[#18191c] text-base font-bold">{post.title}</h3>

        <div className="flex flex-wrap gap-1.5">
          {post.tags.map(t => (
            <span key={t} className="text-xs border border-[#e4e5e8] rounded-full px-2.5 py-0.5 text-[#5e6670]">{t}</span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><span className="text-[#5e6670]">Mode : </span><span className="text-[#18191c]">{post.mode}</span></div>
          <div><span className="text-[#5e6670]">Payment : </span><span className="text-[#18191c]">{post.payment}</span></div>
          <div><span className="text-[#5e6670]">Target audience : </span><span className="text-[#18191c]">{post.audience}</span></div>
          <div><span className="text-[#5e6670]">Last date to apply : </span><span className="text-[#18191c]">{post.lastDate}</span></div>
        </div>
      </div>

      <img src={post.img} alt="" className="w-full h-[180px] object-cover" />

      <div className="p-5 flex flex-col gap-3">
        <button className="text-[#ff9400] text-sm font-medium text-left">Show more</button>
        <div className="flex items-center justify-between text-[#9199a3] text-sm">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {['#ff4757','#3b82f6','#22c55e'].map(c => (
                <div key={c} className="w-5 h-5 rounded-full border-2 border-white" style={{ background: c }} />
              ))}
            </div>
            <span>{post.likes.toLocaleString()}</span>
          </div>
          <span>{post.comments} comments</span>
        </div>
        <div className="flex border-t border-[#f2f2f3] pt-3 gap-1">
          {[
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>, label: 'Like' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, label: 'Comment' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>, label: 'Share' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>, label: 'Save' },
          ].map(({ icon, label }) => (
            <button key={label} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[#9199a3] text-xs font-medium hover:text-[#ff9400] hover:bg-[#fff8ee] rounded-lg transition-colors">
              {icon}{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LearningCard({ post }: { post: typeof LEARNING_POSTS[0] }) {
  return (
    <div className="bg-white border border-[#f2f2f3] rounded-2xl overflow-hidden flex flex-col">
      <img src={post.img} alt="" className="w-full h-[180px] object-cover" />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[#9199a3] text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {post.university}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="h-[28px] px-3 bg-[#ff9400] text-white text-xs font-bold rounded-full hover:bg-[#e68500] transition-colors">Get Started</button>
            <BookmarkIcon saved />
          </div>
        </div>

        <h3 className="text-[#18191c] text-sm font-bold leading-snug">{post.title}</h3>

        <button className="self-start h-[28px] px-3 border border-[#e4e5e8] text-[#18191c] text-xs rounded-lg hover:border-[#ff9400] transition-colors">Download Brochure</button>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            { label: 'Academic level', value: post.level },
            { label: 'Mode', value: post.mode },
            { label: 'Course Fee', value: post.fee },
            { label: 'Duration', value: post.duration },
            { label: 'Application Deadline', value: post.deadline },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[#ff9400] text-[11px] font-medium">{label}</p>
              <p className="text-[#18191c] text-xs">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmploymentCard({ post }: { post: typeof EMPLOYMENT_POSTS[0] }) {
  return (
    <div className="bg-white border border-[#e4e5e8] rounded-2xl p-5 flex flex-col gap-4">
      {/* Top: avatar + role/company/location + Get Started + bookmark */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-[#18191c] shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="text-[#18191c] text-[15px] font-bold leading-tight">{post.role}</p>
            <p className="text-[#5e6670] text-sm">{post.company}</p>
            <p className="text-[#5e6670] text-sm">{post.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="h-[36px] px-5 bg-[#ff9400] text-white text-sm font-bold rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap">
            Get Started
          </button>
          <button className="text-[#9199a3] hover:text-[#ff9400] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#f2f2f3]" />

      {/* Exp / Salary / Type */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm">
        <span>
          <span className="text-[#ff9400] font-medium">Exp - </span>
          <span className="text-[#18191c] font-semibold">{post.exp}</span>
        </span>
        <span className="text-[#d0d3d8] select-none">|</span>
        <span>
          <span className="text-[#ff9400] font-medium">Salary - </span>
          <span className="text-[#18191c] font-semibold">{post.salary}</span>
        </span>
        <span className="text-[#d0d3d8] select-none">|</span>
        <span>
          <span className="text-[#ff9400] font-medium">Type - </span>
          <span className="text-[#18191c] font-semibold">{post.type}</span>
        </span>
      </div>

      {/* Skills */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-[#ff9400] text-sm font-medium">Skills -</span>
        {post.skills.map(s => (
          <span key={s} className="text-sm border border-[#e4e5e8] rounded-full px-3 py-0.5 text-[#18191c]">{s}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#9199a3]">{post.posted}</span>
        <button className="text-[#ff9400] font-medium hover:underline">Show more</button>
      </div>
    </div>
  );
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: Record<string, { title: string; cols: string }> = {
  community: { title: 'My Community Posts', cols: 'grid-cols-1 sm:grid-cols-2' },
  discover:  { title: 'Discover',           cols: 'grid-cols-1 sm:grid-cols-2' },
  learning:  { title: 'Learning Directory', cols: 'grid-cols-1 sm:grid-cols-2' },
  employment:{ title: 'Employment Hub',     cols: 'grid-cols-1 sm:grid-cols-2' },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SavedCategoryPage() {
  const { category = 'community' } = useParams<{ category: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const config = CATEGORIES[category] ?? CATEGORIES.community;

  function renderCards() {
    if (category === 'community') return COMMUNITY_POSTS.map(p => <CommunityCard key={p.id} post={p} />);
    if (category === 'discover')  return DISCOVER_POSTS.map(p => <DiscoverCard key={p.id} post={p} />);
    if (category === 'learning')  return LEARNING_POSTS.map(p => <LearningCard key={p.id} post={p} />);
    if (category === 'employment')return EMPLOYMENT_POSTS.map(p => <EmploymentCard key={p.id} post={p} />);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">

          {/* Back nav */}
          <button
            onClick={() => navigate('/saved')}
            className="flex items-center gap-2 text-[#9199a3] text-sm font-medium hover:text-[#18191c] transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Saved
          </button>

          <h1 className="text-[#18191c] text-2xl font-bold mb-6">{config.title}</h1>

          <div className={`grid ${config.cols} gap-5`}>
            {renderCards()}
          </div>

        </div>
      </div>
    </div>
  );
}
