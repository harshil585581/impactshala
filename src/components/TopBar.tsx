import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const logo = null; // replaced inline with SVG text
const defaultAvatar = null;

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type TopBarProps = {
  onMenuToggle: () => void;
};

const roleLabels: Record<string, string> = {
  student: "Student",
  professional: "Working Professional",
  entrepreneur: "Entrepreneur",
  educator: "Educator",
};

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const navigate = useNavigate();
  const [meOpen, setMeOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const meRef = useRef<HTMLDivElement>(null);

  const storedUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const userRole: string = storedUser.role ?? "";
  const userType: string = storedUser.user_type ?? "";
  const displayName = (() => {
    const f = storedUser.first_name;
    const l = storedUser.last_name;
    const full = [f, l].filter(s => s && s !== "unknown").join(" ");
    return full || storedUser.org_name || "My Profile";
  })();
  const roleLabel: string =
    userType === "organization"
      ? "Organization"
      : (roleLabels[userRole] ?? "Member");

  function handleUpdateAccount() {
    setMeOpen(false);
    if (userType === "individual" && userRole === "entrepreneur") {
      navigate("/account/update/entrepreneur");
    } else if (userType === "individual" && userRole === "professional") {
      navigate("/account/update/professional");
    } else if (userType === "individual" && userRole === "educator") {
      navigate("/account/update/educator");
    } else if (userType === "individual") {
      navigate("/account/update/student");
    } else {
      navigate("/account/update");
    }
  }

  function handleSignOut() {
    localStorage.removeItem("user");
    setMeOpen(false);
    navigate("/");
  }

  // Fetch avatar_url from profile
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    const token = user.access_token ?? "";
    if (!token) return;
    fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (meRef.current && !meRef.current.contains(e.target as Node)) {
        setMeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-[64px] sm:h-[72px] lg:h-[78px] bg-white border-b border-[#f2f2f3] z-30 flex items-center px-4 md:px-6 gap-4">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-[#7c8493] hover:text-[#f77f00] shrink-0"
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 6h18M3 12h18M3 18h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Logo */}
      <a href="/home" className="shrink-0 flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-full bg-[#ff9400] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/>
          </svg>
        </div>
        <span className="text-[#18191c] font-bold text-base hidden sm:block">Impactshaala</span>
      </a>

      {/* Search bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <div className="relative flex items-center">
          <svg
            className="absolute left-3 text-[#9ca3af] pointer-events-none"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M21 21l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search messages"
            className="w-full bg-[#f8f8f8] border border-[#f2f2f3] rounded-full pl-10 pr-4 py-2 text-sm text-[#474d57] placeholder-[#9ca3af] focus:outline-none focus:border-[#f77f00] focus:ring-1 focus:ring-[#f77f00] transition-colors"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4 md:gap-6 ml-auto shrink-0">
        {/* Messages */}
        <button className="hidden sm:flex flex-col items-center gap-0.5 text-[#6c6c6c] hover:text-[#f77f00] transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[11px] leading-none">Message</span>
        </button>

        {/* Notifications */}
        <button className="flex flex-col items-center gap-0.5 text-[#6c6c6c] hover:text-[#f77f00] transition-colors relative">
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 01-3.46 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-[14px] h-[14px] flex items-center justify-center font-bold">
              3
            </span>
          </div>
          <span className="text-[11px] leading-none">Notifications</span>
        </button>

        {/* Me — with dropdown */}
        <div className="relative" ref={meRef}>
          <button
            onClick={() => setMeOpen((v) => !v)}
            className="flex flex-col items-center gap-0.5 text-[#6c6c6c] hover:text-[#f77f00] transition-colors"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Me" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#ff9400] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {(storedUser.first_name?.[0] ?? storedUser.org_name?.[0] ?? 'U').toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex items-center">
              <span className="text-[11px] leading-none">Me</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className={`transition-transform duration-200 ${meOpen ? "rotate-180" : ""}`}
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>

          {/* Dropdown */}
          {meOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl shadow-[0px_8px_24px_rgba(0,0,0,0.12)] border border-[#f2f2f3] z-50 overflow-hidden py-1">
              {/* Profile header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f2f3]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Me" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#ff9400] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(storedUser.first_name?.[0] ?? storedUser.org_name?.[0] ?? 'U').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[#18191c] text-sm font-semibold truncate">
                    {displayName}
                  </p>
                  <p className="text-[#767f8c] text-xs truncate">{roleLabel}</p>
                </div>
              </div>

              {/* Menu items */}
              <button
                onClick={() => {
                  setMeOpen(false);
                  navigate("/profile/me");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#fff6ed] hover:text-[#f77f00] transition-colors text-left"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                My Profile
              </button>

              <button
                onClick={handleUpdateAccount}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#fff6ed] hover:text-[#f77f00] transition-colors text-left"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Update Account
              </button>

              <button
                onClick={() => {
                  setMeOpen(false);
                  navigate("/home");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#18191c] hover:bg-[#fff6ed] hover:text-[#f77f00] transition-colors text-left"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Settings
              </button>

              <div className="border-t border-[#f2f2f3] my-1" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
