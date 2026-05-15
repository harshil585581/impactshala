import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Icons replaced with inline SVGs — no external dependencies

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const APP_SUB_ITEMS = [
  { label: "Discover", route: "/applications" },
  { label: "Learning Directory", route: "/applications/detail/2" },
  { label: "Employment Hub", route: "/applications/detail/1" },
];

const ROUTE_TO_SUB_ITEM: Record<string, string> = {
  "/applications": "Discover",
  "/applications/detail/2": "Learning Directory",
  "/applications/detail/1": "Employment Hub",
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isOnAppsRoute = location.pathname.startsWith("/applications");
  const isOnDiscoverRoute = location.pathname === "/discover";
  const isOnHomeRoute = location.pathname === "/home";
  const [appExpanded, setAppExpanded] = useState(isOnAppsRoute);
  const [activeSubItem, setActiveSubItem] = useState(
    ROUTE_TO_SUB_ITEM[location.pathname] ?? "Discover",
  );

  useEffect(() => {
    if (isOnAppsRoute) {
      setAppExpanded(true);
      const label = ROUTE_TO_SUB_ITEM[location.pathname];
      if (label) setActiveSubItem(label);
    }
  }, [location.pathname, isOnAppsRoute]);

  function handleAppClick() {
    setAppExpanded((v) => !v);
    navigate("/applications");
  }

  function handleSubItem(label: string, route: string) {
    setActiveSubItem(label);
    navigate(route);
    onClose();
  }

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
          flex flex-col z-20 transition-transform duration-300 ease-in-out overflow-y-auto
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Main Navigation */}
        <nav className="mt-6 flex flex-col gap-0.5 flex-1">
          {/* Home */}
          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <g clipPath="url(#clip0_303897_69596)">
                  <path
                    d="M5 12H3L12 3L21 12H19"
                    stroke="#7C8493"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 12V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V12"
                    stroke="#7C8493"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_303897_69596">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            }
            label="Home"
            active={isOnHomeRoute}
            onClick={() => {
              navigate("/home");
              onClose();
            }}
          />

          <NavItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <circle cx="12" cy="12" r="10" stroke="#7c8493" strokeWidth="1.5"/>
                <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            label="Discover"
            active={isOnDiscoverRoute}
            onClick={() => {
              navigate("/discover");
              onClose();
            }}
          />
          <NavItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            label="Learning Directory"
          />
          <NavItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke="#7c8493" strokeWidth="1.5"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="12" x2="12" y2="16" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="10" y1="14" x2="14" y2="14" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
            label="Employment Hub"
          />
          <NavItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#7c8493" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            label="My Community"
          />

          {/* My Application — accordion */}
          <div>
            {/* Parent row */}
            <div
              onClick={handleAppClick}
              className="flex items-center justify-between pl-7 pr-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0"
                >
                  <rect
                    x="4"
                    y="2"
                    width="16"
                    height="20"
                    rx="2"
                    stroke="#7c8493"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="8"
                    y1="10"
                    x2="16"
                    y2="10"
                    stroke="#7c8493"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="8"
                    y1="14"
                    x2="16"
                    y2="14"
                    stroke="#7c8493"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="8"
                    y1="18"
                    x2="12"
                    y2="18"
                    stroke="#7c8493"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[#7c8493] text-[15px] font-medium">
                  My Applications
                </span>
              </div>
              {/* Chevron */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className={`shrink-0 transition-transform duration-200 ${appExpanded ? "rotate-180" : ""}`}
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="#7c8493"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Sub-items */}
            {appExpanded && (
              <div className="flex flex-col">
                {APP_SUB_ITEMS.map((item) => {
                  const isActive = activeSubItem === item.label;
                  return (
                    <div
                      key={item.label}
                      onClick={() => handleSubItem(item.label, item.route)}
                      className={`flex items-center gap-2 w-full pl-10 pr-4 py-2.5 cursor-pointer transition-colors ${
                        isActive ? "bg-[#fff3e0]" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* indent arrow */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="shrink-0 opacity-40"
                      >
                        <path
                          d="M9 18l6-6-6-6"
                          stroke={isActive ? "#f77f00" : "#7c8493"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span
                        className={`text-[14px] font-medium ${isActive ? "text-[#f77f00]" : "text-[#7c8493]"}`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 5C8.44772 5 8 5.44772 8 6C8 6.55228 8.44772 7 9 7H15C15.5523 7 16 6.55229 16 6C16 5.44772 15.5523 5 15 5H9Z"
                  fill="#7C8493"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7 1C5.34315 1 4 2.34315 4 4V20C4 20.3905 4.22734 20.7453 4.58214 20.9085C4.93694 21.0717 5.35428 21.0134 5.65079 20.7593L12 15.3171L18.3492 20.7593C18.6457 21.0134 19.0631 21.0717 19.4179 20.9085C19.7727 20.7453 20 20.3905 20 20V4C20 2.34315 18.6569 1 17 1H7ZM6 4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V17.8258L12.6508 13.2407C12.2763 12.9198 11.7237 12.9198 11.3492 13.2407L6 17.8258V4Z"
                  fill="#7C8493"
                />
              </svg>
            }
            label="Saved Posts"
            active={location.pathname.startsWith('/saved')}
            onClick={() => { navigate('/saved'); onClose(); }}
          />
        </nav>

        {/* Divider */}
        <div className="h-px bg-[#f2f2f3] mx-0 my-3" />

        {/* Settings Section */}
        <div className="flex flex-col gap-4 mb-3">
          <div className="px-7">
            <span className="text-[#202430] text-[12px] font-semibold tracking-[0.56px] opacity-50 uppercase">
              Settings
            </span>
          </div>
          <div className="flex flex-col gap-0">
            <NavItem
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="#7c8493"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                    stroke="#7c8493"
                    strokeWidth="1.5"
                  />
                </svg>
              }
              label="Settings"
            />
            <NavItem
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#7c8493"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
                    stroke="#7c8493"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="12"
                    y1="17"
                    x2="12.01"
                    y2="17"
                    stroke="#7c8493"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              }
              label="Help Center"
            />
          </div>
        </div>

      </aside>
    </>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactElement;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className="relative flex items-center w-full cursor-pointer group"
    >
      {/* Active Indicator Bar */}
      {active && (
        <div className="absolute left-0 w-1.5 h-8 bg-[#f77f00] rounded-r-full z-10" />
      )}
      
      {/* Link Content Container */}
      <div
        className={`
          flex items-center gap-4 w-full py-2.5 transition-all duration-200
          ${active 
            ? "bg-[#ffeacc] rounded-full mx-4 px-5" 
            : "pl-11 pr-4 hover:bg-gray-50 rounded-xl mx-0"
          }
        `}
      >
        <div className={`${active ? "text-[#ff9400]" : "text-[#7c8493]"} shrink-0 flex items-center justify-center w-6 h-6`}>
          {icon}
        </div>
        <span
          className={`text-[15px] font-medium truncate ${active ? "text-[#ff9400]" : "text-[#7c8493]"}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
