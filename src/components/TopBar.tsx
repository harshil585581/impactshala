const logo = "https://www.figma.com/api/mcp/asset/d643d316-0055-4e66-93e3-4abd763761cd";
const avatarMe = "https://www.figma.com/api/mcp/asset/1f794d22-cc5e-4fd9-9a69-52e5d98eef02";

type TopBarProps = {
  onMenuToggle: () => void;
};

export default function TopBar({ onMenuToggle }: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-[64px] sm:h-[72px] lg:h-[78px] bg-white border-b border-[#f2f2f3] z-30 flex items-center px-4 md:px-6 gap-4">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-[#7c8493] hover:text-[#ff9400] shrink-0"
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Logo */}
      <a href="/" className="shrink-0">
        <img src={logo} alt="Impactshaala" className="h-9 object-contain" />
      </a>

      {/* Search bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <div className="relative flex items-center">
          <svg
            className="absolute left-3 text-[#9ca3af] pointer-events-none"
            width="18" height="18" viewBox="0 0 24 24" fill="none"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search messages"
            className="w-full bg-[#f8f8f8] border border-[#f2f2f3] rounded-full pl-10 pr-4 py-2 text-sm text-[#474d57] placeholder-[#9ca3af] focus:outline-none focus:border-[#ff9400] focus:ring-1 focus:ring-[#ff9400] transition-colors"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4 md:gap-6 ml-auto shrink-0">
        {/* Messages */}
        <button className="hidden sm:flex flex-col items-center gap-0.5 text-[#6c6c6c] hover:text-[#ff9400] transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] leading-none">Message</span>
        </button>

        {/* Notifications */}
        <button className="flex flex-col items-center gap-0.5 text-[#6c6c6c] hover:text-[#ff9400] transition-colors relative">
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-[14px] h-[14px] flex items-center justify-center font-bold">3</span>
          </div>
          <span className="text-[11px] leading-none">Notifications</span>
        </button>

        {/* Me */}
        <button className="flex flex-col items-center gap-0.5 text-[#6c6c6c] hover:text-[#ff9400] transition-colors">
          <img src={avatarMe} alt="Me" className="w-7 h-7 rounded-full object-cover" />
          <div className="flex items-center">
            <span className="text-[11px] leading-none">Me</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
    </header>
  );
}
