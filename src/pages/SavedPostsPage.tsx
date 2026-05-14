import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';

const CODE_IMG = 'https://www.figma.com/api/mcp/asset/d208c4d3-690e-45f8-8437-d98e914f6319';

const COMMUNITY_POSTS = [
  { id: '1', user: 'Sarah Johnson', title: 'UX/UX Designer', time: '2 hours ago', text: "Excited to share my latest project on sustainable development! 🌱 #Innovation #Sustainability", img: CODE_IMG },
  { id: '2', user: 'Sarah Johnson', title: 'UX/UX Designer', time: '2 hours ago', text: "Excited to share my latest project on sustainable development! 🌱 #Innovation #Sustainability", img: CODE_IMG },
  { id: '3', user: 'Sarah Johnson', title: 'UX/UX Designer', time: '2 hours ago', text: "Excited to share my latest project on sustainable development! 🌱 #Innovation #Sustainability", img: CODE_IMG },
  { id: '4', user: 'Sarah Johnson', title: 'UX/UX Designer', time: '2 hours ago', text: "What's the most important factor when choosing a job?", isPoll: true },
];

const DISCOVER_POSTS = [
  { id: '1', user: 'Alex Johnson', role: 'UI/UX Designer • Accenture', time: '12h', title: 'Evolution Of Space And About Aliens', tags: ['Opportunity', 'Education', 'Experiential learning', 'Guest lecture'], mode: 'Onsite', payment: '₹ 5,000 / No fee', audience: 'Students', lastDate: '12/12/2024', img: CODE_IMG },
  { id: '2', user: 'Alex Johnson', role: 'UI/UX Designer • Accenture', time: '12h', title: 'Evolution Of Space And About Aliens', tags: ['Opportunity', 'Education', 'Experiential learning', 'Guest lecture'], mode: 'Onsite', payment: '₹ 5,000 / No fee', audience: 'Students', lastDate: '12/12/2024', img: CODE_IMG },
  { id: '3', user: 'Alex Johnson', role: 'UI/UX Designer • Accenture', time: '12h', title: 'Evolution Of Space And About Aliens', tags: ['Opportunity', 'Education', 'Experiential learning', 'Guest lecture'], mode: 'Onsite', payment: '₹ 5,000 / No fee', audience: 'Students', lastDate: '12/12/2024', img: CODE_IMG },
  { id: '4', user: 'Alex Johnson', role: 'UI/UX Designer • Accenture', time: '12h', title: 'Evolution Of Space And About Aliens', tags: ['Opportunity', 'Education', 'Experiential learning', 'Guest lecture'], mode: 'Onsite', payment: '₹ 5,000 / No fee', audience: 'Students', lastDate: '12/12/2024', img: CODE_IMG },
];

const LEARNING_POSTS = [
  { id: '1', img: CODE_IMG, university: 'University of Mumbai, Mumbai', title: 'Bachelor of Business Administration (BBA) Accountancy', level: 'High School (Grade 11 to 12)', mode: 'Onsite (Bangalore)', fee: '2 LPA', duration: '3 Months', deadline: '16/9/2025' },
  { id: '2', img: CODE_IMG, university: 'University of Mumbai, Mumbai', title: 'Bachelor of Business Administration (BBA) Accountancy', level: 'High School (Grade 11 to 12)', mode: 'Onsite (Bangalore)', fee: '2 LPA', duration: '3 Months', deadline: '16/9/2025' },
  { id: '3', img: CODE_IMG, university: 'University of Mumbai, Mumbai', title: 'Bachelor of Business Administration (BBA) Accountancy', level: 'High School (Grade 11 to 12)', mode: 'Onsite (Bangalore)', fee: '2 LPA', duration: '3 Months', deadline: '16/9/2025' },
  { id: '4', img: CODE_IMG, university: 'University of Mumbai, Mumbai', title: 'Bachelor of Business Administration (BBA) Accountancy', level: 'High School (Grade 11 to 12)', mode: 'Onsite (Bangalore)', fee: '2 LPA', duration: '3 Months', deadline: '16/9/2025' },
];

const EMPLOYMENT_POSTS = [
  { id: '1', role: 'Product Manager', company: 'Accenture', location: 'Bangalore, Karnataka (Onsite)', exp: '0 – 2 Month', salary: '2 – 5 LPA', type: 'Full – Time', skills: ['Productivity', 'React', 'Management skill'], posted: '5 week Ago' },
  { id: '2', role: 'Product Manager', company: 'Accenture', location: 'Bangalore, Karnataka (Onsite)', exp: '0 – 2 Month', salary: '2 – 5 LPA', type: 'Full – Time', skills: ['Productivity', 'React', 'Management skill'], posted: '5 week Ago' },
  { id: '3', role: 'Product Manager', company: 'Accenture', location: 'Bangalore, Karnataka (Onsite)', exp: '0 – 2 Month', salary: '2 – 5 LPA', type: 'Full – Time', skills: ['Productivity', 'React', 'Management skill'], posted: '5 week Ago' },
];

function UserInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#ff9400] flex items-center justify-center shrink-0">
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
  );
}

function SectionHeader({ title, onViewAll }: { title: string; onViewAll: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[#18191c] text-xl font-bold">{title}</h2>
      <button
        onClick={onViewAll}
        className="h-[36px] px-5 border border-[#ff9400] text-[#ff9400] text-sm font-semibold rounded-lg hover:bg-[#fff8ee] transition-colors"
      >
        View all
      </button>
    </div>
  );
}

function CommunityMiniCard({ post }: { post: typeof COMMUNITY_POSTS[0] }) {
  return (
    <div className="border border-[#f2f2f3] rounded-2xl p-4 bg-white hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <UserInitials name={post.user} />
          <div>
            <p className="text-[#18191c] text-sm font-bold leading-tight">{post.user}</p>
            <p className="text-[#9199a3] text-xs">{post.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#9199a3]">
          {/* Add person icon */}
          <button className="hover:text-[#ff9400] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </button>
          {/* More icon */}
          <button className="hover:text-[#ff9400] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Text */}
      <p className="text-[#18191c] text-sm leading-relaxed">{post.text}</p>

      {/* Image */}
      {post.img && !post.isPoll && (
        <img src={post.img} alt="" className="w-full h-[180px] object-cover rounded-xl" />
      )}

      {/* Poll */}
      {post.isPoll && (
        <div className="flex flex-col gap-2">
          {['Work-Life Balance', 'Salary & Benefits', 'Growth Opportunities'].map(opt => (
            <div key={opt} className="bg-[#fff6ed] rounded-lg px-3 py-2 text-sm text-[#18191c]">{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiscoverMiniCard({ post }: { post: typeof DISCOVER_POSTS[0] }) {
  return (
    <div className="border border-[#f2f2f3] rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow cursor-pointer">
      <div className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <UserInitials name={post.user} />
            <div className="min-w-0">
              <p className="text-[#18191c] text-[10px] font-semibold truncate">{post.user}</p>
              <p className="text-[#9199a3] text-[9px] truncate">{post.role}</p>
            </div>
          </div>
          <button className="h-[20px] px-2 bg-[#ff9400] text-white text-[9px] font-bold rounded-full shrink-0">Get Started</button>
        </div>
        <p className="text-[#18191c] text-xs font-bold line-clamp-1 mb-1.5">{post.title}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {post.tags.slice(0, 2).map(t => (
            <span key={t} className="text-[8px] border border-[#e4e5e8] rounded-full px-1.5 py-0.5 text-[#5e6670]">{t}</span>
          ))}
        </div>
      </div>
      <img src={post.img} alt="" className="w-full h-[60px] object-cover" />
    </div>
  );
}

function LearningMiniCard({ post }: { post: typeof LEARNING_POSTS[0] }) {
  return (
    <div className="border border-[#f2f2f3] rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow cursor-pointer">
      <img src={post.img} alt="" className="w-full h-[70px] object-cover" />
      <div className="p-2.5">
        <p className="text-[#9199a3] text-[9px] mb-0.5">{post.university}</p>
        <p className="text-[#18191c] text-xs font-bold line-clamp-2 mb-1.5">{post.title}</p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <div><p className="text-[#ff9400] text-[8px]">Course Fee</p><p className="text-[#18191c] text-[9px]">{post.fee}</p></div>
          <div><p className="text-[#ff9400] text-[8px]">Duration</p><p className="text-[#18191c] text-[9px]">{post.duration}</p></div>
        </div>
      </div>
    </div>
  );
}

function EmploymentMiniCard({ post }: { post: typeof EMPLOYMENT_POSTS[0] }) {
  return (
    <div className="border border-[#e4e5e8] rounded-2xl p-4 bg-white hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3">
      {/* Top: avatar + info + Get Started + bookmark */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#18191c] shrink-0" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[#18191c] text-sm font-bold leading-tight">{post.role}</p>
            <p className="text-[#5e6670] text-xs">{post.company}</p>
            <p className="text-[#5e6670] text-xs">{post.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="h-[30px] px-3 bg-[#ff9400] text-white text-xs font-bold rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap">
            Get Started
          </button>
          <button className="text-[#9199a3]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#f2f2f3]" />

      {/* Exp / Salary / Type */}
      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs">
        <span><span className="text-[#ff9400] font-medium">Exp - </span><span className="text-[#18191c] font-semibold">{post.exp}</span></span>
        <span className="text-[#d0d3d8]">|</span>
        <span><span className="text-[#ff9400] font-medium">Salary - </span><span className="text-[#18191c] font-semibold">{post.salary}</span></span>
        <span className="text-[#d0d3d8]">|</span>
        <span><span className="text-[#ff9400] font-medium">Type - </span><span className="text-[#18191c] font-semibold">{post.type}</span></span>
      </div>

      {/* Skills */}
      <div className="flex items-center flex-wrap gap-1.5">
        <span className="text-[#ff9400] text-xs font-medium">Skills -</span>
        {post.skills.map(s => (
          <span key={s} className="text-xs border border-[#e4e5e8] rounded-full px-2.5 py-0.5 text-[#18191c]">{s}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#9199a3]">{post.posted}</span>
        <button className="text-[#ff9400] font-medium hover:underline">Show more</button>
      </div>
    </div>
  );
}

export default function SavedPostsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">

          {/* My Community Post */}
          <section>
            <SectionHeader title="My Community Post" onViewAll={() => navigate('/saved/community')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COMMUNITY_POSTS.map(p => <CommunityMiniCard key={p.id} post={p} />)}
            </div>
          </section>

          {/* Discover */}
          <section>
            <SectionHeader title="Discover" onViewAll={() => navigate('/saved/discover')} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {DISCOVER_POSTS.map(p => <DiscoverMiniCard key={p.id} post={p} />)}
            </div>
          </section>

          {/* Learning Directory */}
          <section>
            <SectionHeader title="Learning Directory" onViewAll={() => navigate('/saved/learning')} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {LEARNING_POSTS.map(p => <LearningMiniCard key={p.id} post={p} />)}
            </div>
          </section>

          {/* Employment Hub */}
          <section>
            <SectionHeader title="Employment Hub" onViewAll={() => navigate('/saved/employment')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EMPLOYMENT_POSTS.map(p => <EmploymentMiniCard key={p.id} post={p} />)}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
