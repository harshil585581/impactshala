import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import PostCard from '../components/PostCard';
import RightPanel from '../components/RightPanel';

const avatar1 = "https://www.figma.com/api/mcp/asset/0b4a16eb-d2da-476e-8cc7-d562ca381d0e";
const avatar2 = "https://www.figma.com/api/mcp/asset/6f2e34ed-3fed-4f73-971d-50cff5a9f7e0";
const postImg1 = "https://www.figma.com/api/mcp/asset/d208c4d3-690e-45f8-8437-d98e914f6319";
const userAvatar2 = "https://www.figma.com/api/mcp/asset/b8def0bd-be89-4228-b92c-723a61f1b1df";
const photoIcon = "https://www.figma.com/api/mcp/asset/c696f684-d3f3-4907-b008-73ed5cba4a1a";
const videoIcon = "https://www.figma.com/api/mcp/asset/9d704024-5c9b-4ffa-98a4-721c38438562";
const calendarIcon = "https://www.figma.com/api/mcp/asset/48f6342c-cac0-4bf5-9852-32a8e961d946";
const pollIcon = "https://www.figma.com/api/mcp/asset/0725c9c3-1452-4a15-9b96-ef174d64e430";

const posts = [
  {
    id: 1,
    avatar: avatar1,
    name: 'Sarah Johnson',
    title: 'UI/UX Designer · Accenture',
    time: '1h',
    content: "Excited to share my latest project on sustainable development! 🌱 We've been working hard to create impactful solutions",
    image: postImg1,
    reactions: 1507,
    comments: 14,
  },
  {
    id: 2,
    avatar: avatar2,
    name: 'Sarah Johnson',
    title: 'MBA Aspirant',
    time: '1h',
    badge: '· 2nd',
    content: 'Poll Time!',
    hashtags: '#jobseeker #Job #IndianEconomy #CurrentAffairs #ImpactshaalaPool #Business #JobCrisis',
    pollOptions: [
      { label: 'Work-Life Balance' },
      { label: 'Salary & Benefits' },
      { label: 'Growth Opportunities' },
      { label: 'Company Culture' },
    ],
    pollMeta: '17 votes · 2 days',
    reactions: 1507,
    comments: 14,
  },
];

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header — full width, always on top */}
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />

      {/* Sidebar — starts below the 64px header */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Page body — shifted right of sidebar on desktop */}
      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">

          {/* Center Feed */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Create Post Card */}
            <div className="bg-white border border-[#f2f2f3] rounded-[17px] shadow-[0px_4px_2px_rgba(231,231,231,0.25)] px-5 py-4">
              <div className="flex items-center gap-3 mb-4">
                <img src={userAvatar2} alt="You" className="w-11 h-11 rounded-full object-cover shrink-0" />
                <div className="flex-1 bg-white border border-[#f2f2f3] rounded-full px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-[#474d57] text-base font-medium">Start a post</span>
                </div>
              </div>
              <div className="flex items-center justify-around pt-2 border-t border-[#f2f2f3] flex-wrap gap-2">
                <button className="flex items-center gap-2 text-[#474d57] text-sm sm:text-base font-medium hover:text-[#ff9400] transition-colors py-1">
                  <img src={photoIcon} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
                  Photo
                </button>
                <button className="flex items-center gap-2 text-[#474d57] text-sm sm:text-base font-medium hover:text-[#ff9400] transition-colors py-1">
                  <img src={videoIcon} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
                  Video
                </button>
                <button className="flex items-center gap-2 text-[#605f5f] text-sm sm:text-base font-medium hover:text-[#ff9400] transition-colors py-1">
                  <img src={calendarIcon} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
                  Event
                </button>
                <button className="flex items-center gap-2 text-[#474d57] text-sm sm:text-base font-medium hover:text-[#ff9400] transition-colors py-1">
                  <img src={pollIcon} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span className="hidden sm:inline">Polls &amp; Questions</span>
                  <span className="sm:hidden">Polls</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
              <button className="bg-[#ff9400] text-white text-sm sm:text-base font-medium px-4 sm:px-6 py-2 rounded-full h-[38px] whitespace-nowrap shrink-0">
                All Posts
              </button>
              <button className="bg-white border border-[#ff9400] text-[#ff9400] text-sm sm:text-base font-medium px-4 sm:px-6 py-2 rounded-full h-[38px] whitespace-nowrap shrink-0 hover:bg-[#fff8ee] transition-colors">
                Media
              </button>
              <button className="bg-white border border-[#ff9400] text-[#ff9400] text-sm sm:text-base font-medium px-4 sm:px-6 py-2 rounded-full h-[38px] whitespace-nowrap shrink-0 hover:bg-[#fff8ee] transition-colors">
                Polls &amp; Questions
              </button>
              <button className="bg-white border border-[#ff9400] text-[#ff9400] text-sm sm:text-base font-medium px-4 sm:px-6 py-2 rounded-full h-[38px] whitespace-nowrap shrink-0 hover:bg-[#fff8ee] transition-colors">
                Event
              </button>
            </div>

            {/* Feed Posts */}
            <div className="flex flex-col gap-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  avatar={post.avatar}
                  name={post.name}
                  title={post.title}
                  time={post.time}
                  badge={post.badge}
                  content={post.content}
                  image={post.image}
                  hashtags={post.hashtags}
                  pollOptions={post.pollOptions}
                  pollMeta={post.pollMeta}
                  reactions={post.reactions}
                  comments={post.comments}
                />
              ))}
            </div>
          </div>

          {/* Right Panel — hidden on mobile/tablet, visible on large screens */}
          <div className="hidden xl:block w-[340px] shrink-0">
            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
