import { useState } from 'react';

const userBg = "https://www.figma.com/api/mcp/asset/05e80ba2-5ce4-4079-9c31-afc322dab171";
const userAvatar = "https://www.figma.com/api/mcp/asset/3705c617-5e62-4578-acf8-8f5a2af9ff8f";
const courseImg = "https://www.figma.com/api/mcp/asset/3e343bdd-8744-4851-8006-14dbcae6fa4e";
const announcementIcon = "https://www.figma.com/api/mcp/asset/aa7d9acc-23fc-4bfd-9415-0dfae5eafb68";

export default function RightPanel() {
  const [helpDismissed, setHelpDismissed] = useState(false);

  return (
    <aside className="w-[354px] shrink-0 flex flex-col gap-6">
      {/* User Profile Card */}
      <div className="bg-white border border-[#f2f2f3] rounded-[14px] overflow-hidden">
        {/* Banner */}
        <div className="h-[80px] bg-[#003049]" />
        {/* Avatar */}
        <div className="flex flex-col items-center px-5 pb-6 -mt-10">
          <img
            src={userAvatar}
            alt="Michael Anderson"
            className="w-20 h-20 rounded-full border-4 border-white object-cover"
          />
          <div className="mt-3 text-center">
            <h3 className="text-[#282828] text-lg font-semibold">Michael Anderson</h3>
            <div className="flex items-center gap-1 justify-center mt-1">
              <span className="text-[#666] text-xs">UI/UX Designer</span>
              <span className="text-[#666] text-xs">·</span>
              <span className="text-[#666] text-xs">Accenture</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-5 w-full justify-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#ff9400] text-sm font-bold">183</span>
              <span className="text-black text-xs font-medium text-center">Recommendations</span>
            </div>
            <div className="w-px h-10 bg-[#f77f00]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#ff9400] text-sm font-bold">60</span>
              <span className="text-black text-xs font-medium text-center">Credibility</span>
            </div>
            <div className="w-px h-10 bg-[#f77f00]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#ff9400] text-sm font-bold">48</span>
              <span className="text-black text-xs font-medium text-center">Achievement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Card */}
      <div className="bg-white border border-[#f2f2f3] rounded-[14px] overflow-hidden">
        <img src={courseImg} alt="Figma Design" className="w-full h-[120px] object-cover" />
        <div className="p-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <h4 className="text-[#282828] text-lg font-semibold">UI/UX Certification Course</h4>
            <span className="bg-[#ffeacc] text-[#ff9400] text-sm font-medium px-3 py-0.5 rounded-full w-fit">Onsite</span>
            <p className="text-[#666] text-sm leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Vivamus ac tellus nec velit finibus egestas.
            </p>
          </div>
          <button className="self-center border border-[#df704d] text-[#ff9400] text-base font-medium px-10 py-3 rounded-[46px] hover:bg-[#fff8ee] transition-colors">
            Know More
          </button>
        </div>
        {/* Pagination dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          <div className="w-2 h-2 rounded-full bg-[#ff9400]" />
          <div className="w-2 h-2 rounded-full bg-[#d9d9d9]" />
          <div className="w-2 h-2 rounded-full bg-[#d9d9d9]" />
        </div>
      </div>

      {/* Help Box */}
      {!helpDismissed && (
        <div className="bg-white border border-[#ececec] rounded-[17px] p-4 flex flex-col gap-2 relative">
          <div className="flex items-start justify-between">
            <img src={announcementIcon} alt="" className="w-9 h-7 object-contain" />
            <button
              onClick={() => setHelpDismissed(true)}
              className="text-[#9ca3af] hover:text-[#6b7280] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div>
            <p className="text-[#ff9400] text-lg font-semibold leading-snug">Help Box</p>
            <p className="text-[#7c8493] text-base mt-0.5 leading-relaxed">
              Not able to find what you're looking for? Let us help you.
            </p>
          </div>
          <button className="bg-[#ff9400] text-white text-sm font-medium px-6 py-2 rounded-full w-fit hover:bg-[#e68500] transition-colors">
            Click Here
          </button>
        </div>
      )}
    </aside>
  );
}
