import React from 'react';

const profileImg = "https://www.figma.com/api/mcp/asset/1f04a459-ed45-4c11-b98c-705bd79a1d88";
const iconDiscover = "https://www.figma.com/api/mcp/asset/33957c94-21e7-47ce-9657-96e9fbd3bac3";
const iconLearning = "https://www.figma.com/api/mcp/asset/6ababa2b-751d-40af-866b-af8f9d39c1a5";
const iconEmployment = "https://www.figma.com/api/mcp/asset/00e0afc2-5675-43c9-92ae-6058ee27da4f";
const iconCommunity = "https://www.figma.com/api/mcp/asset/f8f2c300-4dc2-438b-afe0-940f229c5523";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-[64px] sm:top-[72px] lg:top-[78px] left-0 bottom-0 w-[280px] bg-white border-r border-[#f2f2f3]
          flex flex-col z-20 transition-transform duration-300 ease-in-out overflow-hidden
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Main Navigation */}
        <nav className="mt-6 flex flex-col gap-0.5 flex-1">
          {/* Home - Active */}
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#ff9400] rounded-r-full shrink-0" />
            <div className="flex items-center gap-4 bg-[#ffeacc] rounded-[100px] px-4 py-2.5 w-[228px] cursor-pointer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#ff9400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="#ff9400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[#ff9400] text-[15px] font-medium">Home</span>
            </div>
          </div>

          <NavItem icon={<img src={iconDiscover} alt="" className="w-5 h-5 shrink-0" />} label="Discover" />
          <NavItem icon={<img src={iconLearning} alt="" className="w-5 h-5 shrink-0" />} label="Learning Directory" />
          <NavItem icon={<img src={iconEmployment} alt="" className="w-5 h-5 shrink-0" />} label="Employment Hub" />
          <NavItem icon={<img src={iconCommunity} alt="" className="w-5 h-5 shrink-0" />} label="My Community" />

          <NavItem
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <rect x="4" y="2" width="16" height="20" rx="2" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="10" x2="16" y2="10" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="14" x2="16" y2="14" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="18" x2="12" y2="18" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
            label="My Application"
          />
          <NavItem
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            label="Saved Posts"
          />
        </nav>

        {/* Divider */}
        <div className="h-px bg-[#f2f2f3] mx-0 my-3" />

        {/* Settings Section */}
        <div className="flex flex-col gap-4 mb-3">
          <div className="px-7">
            <span className="text-[#202430] text-[12px] font-semibold tracking-[0.56px] opacity-50 uppercase">Settings</span>
          </div>
          <div className="flex flex-col gap-0">
            <NavItem
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="3" stroke="#7c8493" strokeWidth="1.5"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="#7c8493" strokeWidth="1.5"/>
                </svg>
              }
              label="Settings"
            />
            <NavItem
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="#7c8493" strokeWidth="1.5"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="#7c8493" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              }
              label="Help Center"
            />
          </div>
        </div>

        {/* Profile at bottom */}
        <div className="shrink-0">
          <img src={profileImg} alt="Profile" className="w-full object-cover" />
        </div>
      </aside>
    </>
  );
}

function NavItem({ icon, label }: { icon: React.ReactElement; label: string }) {
  return (
    <div className="flex items-center gap-4 pl-7 pr-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
      {icon}
      <span className="text-[#7c8493] text-[15px] font-medium">{label}</span>
    </div>
  );
}
