import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';

type Tab = 'applied' | 'received' | 'accepted' | 'hold' | 'rejected';

const TABS: { key: Tab; label: string }[] = [
  { key: 'applied',  label: 'Applied'  },
  { key: 'received', label: 'Received' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'hold',     label: 'Hold'     },
  { key: 'rejected', label: 'Rejected' },
];

type IndividualApp = {
  id: number;
  title: string;
  company: string;
  location: string;
  appliedAgo: string;
};

type OrgPosting = {
  id: number;
  title: string;
  jobType: string;
  location: string;
  postedOn: string;
  applicantCount: number;
};

const INDIVIDUAL_DATA: Record<Tab, IndividualApp[]> = {
  applied: [
    { id: 1, title: 'Data Analysis',     company: 'Creative Tech Co.',     location: 'Bangalore, Hybrid',  appliedAgo: 'Applied 1 Day Ago'  },
    { id: 2, title: 'Web Development',   company: 'Tech Solutions Inc.',   location: 'Remote',             appliedAgo: 'Applied 4 Day Ago'  },
    { id: 3, title: 'Project Management',company: 'Corporate Innovations', location: 'Remote',             appliedAgo: 'Applied 5 Day Ago'  },
    { id: 4, title: 'Management',        company: 'Corporate Innovations', location: 'Remote',             appliedAgo: 'Applied 6 week Ago' },
    { id: 5, title: 'UI/UX Design',      company: 'Design Studio',         location: 'Gurgaon, In-person', appliedAgo: 'Applied 7 Day Ago'  },
    { id: 6, title: 'Design',            company: 'Creative Tech Co.',     location: 'Remote',             appliedAgo: 'Applied 1 week Ago' },
  ],
  received: [
    { id: 1, title: 'Data Analysis', company: 'Creative Tech Co.', location: 'Bangalore, Hybrid',  appliedAgo: 'Applied 3 Day Ago'  },
    { id: 2, title: 'UI/UX Design',  company: 'Design Studio',     location: 'Gurgaon, In-person', appliedAgo: 'Applied 2 week Ago' },
  ],
  accepted: [
    { id: 1, title: 'Web Development', company: 'Tech Solutions Inc.', location: 'Remote', appliedAgo: 'Applied 10 Day Ago' },
  ],
  hold: [
    { id: 1, title: 'Project Management', company: 'Corporate Innovations', location: 'Remote', appliedAgo: 'Applied 2 week Ago' },
    { id: 2, title: 'Management',         company: 'Corporate Innovations', location: 'Remote', appliedAgo: 'Applied 3 week Ago' },
  ],
  rejected: [
    { id: 1, title: 'Design', company: 'Creative Tech Co.', location: 'Remote', appliedAgo: 'Applied 1 month Ago' },
  ],
};

const BASE_ORG: OrgPosting[] = [
  { id: 1, title: 'Data Analysis',     jobType: 'Part Time',  location: 'Bangalore, Hybrid',  postedOn: '9/7/2025', applicantCount: 27 },
  { id: 2, title: 'Web Development',   jobType: 'Full Time',  location: 'Remote',             postedOn: '9/7/2025', applicantCount: 30 },
  { id: 3, title: 'Project Management',jobType: 'Internship', location: 'Remote',             postedOn: '9/7/2025', applicantCount: 32 },
  { id: 4, title: 'Management',        jobType: 'Internship', location: 'Remote',             postedOn: '9/7/2025', applicantCount: 29 },
  { id: 5, title: 'UI/UX Design',      jobType: 'Full Time',  location: 'Gurgaon, In-person', postedOn: '9/7/2025', applicantCount: 31 },
  { id: 6, title: 'Design',            jobType: 'Full Time',  location: 'Remote',             postedOn: '9/7/2025', applicantCount: 28 },
];

const ORG_DATA: Record<Tab, OrgPosting[]> = {
  applied:  BASE_ORG,
  received: BASE_ORG,
  accepted: BASE_ORG,
  hold:     BASE_ORG,
  rejected: BASE_ORG,
};

const TOTAL_PAGES = 90;
const VISIBLE_PAGES = [1, 2, 3, 4, 5, 6];

function ThreeDotsMenu({ isOpen, onToggle, children }: {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      <button
        onClick={onToggle}
        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="More options"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="5"  cy="12" r="1.5" fill="#6b7280" />
          <circle cx="12" cy="12" r="1.5" fill="#6b7280" />
          <circle cx="19" cy="12" r="1.5" fill="#6b7280" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-30 overflow-hidden min-w-[190px]">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, danger, onClick }: { label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${danger ? 'text-red-500' : 'text-[#374151]'}`}
    >
      {label}
    </button>
  );
}

export default function MyApplicationsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState<Tab>('applied');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId]   = useState<number | null>(null);

  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isOrg      = storedUser?.user_type === 'organization';

  const items = isOrg
    ? ORG_DATA[activeTab]
    : INDIVIDUAL_DATA[activeTab];

  useEffect(() => {
    function closeMenu() { setOpenMenuId(null); }
    if (openMenuId !== null) document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openMenuId]);

  function toggleMenu(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setOpenMenuId(prev => (prev === id ? null : id));
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setCurrentPage(1);
    setOpenMenuId(null);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">

          {/* Status filter tabs */}
          <div className="flex items-center gap-2 sm:gap-3 mb-5 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-5 sm:px-7 py-2 rounded-full text-sm sm:text-base font-medium border transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-[#ff9400] text-white border-[#ff9400]'
                    : 'bg-white text-[#ff9400] border-[#ff9400] hover:bg-[#fff8ee]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List card */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb]">
            {items.length === 0 ? (
              <div className="px-6 py-16 text-center text-[#9ca3af] text-base">
                No applications in this category.
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={item.id}>
                  <div
                    className={`flex items-start justify-between px-6 py-5 ${isOrg ? 'cursor-pointer hover:bg-[#fff8f0] transition-colors' : ''} ${idx === 0 ? 'rounded-t-2xl' : ''} ${idx === items.length - 1 ? 'rounded-b-2xl' : ''}`}
                    onClick={isOrg ? () => navigate(`/applications/detail/${item.id}`) : undefined}
                  >
                    {/* Left: details */}
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-[#18191c] text-xl sm:text-2xl font-bold leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-[#18191c] text-[15px] mt-0.5">
                        {isOrg
                          ? (item as OrgPosting).jobType
                          : (item as IndividualApp).company}
                      </p>
                      <p className="text-[#9ca3af] text-sm mt-0.5">{item.location}</p>
                      <p className="text-[#9ca3af] text-sm">
                        {isOrg
                          ? `Posted on ${(item as OrgPosting).postedOn}`
                          : (item as IndividualApp).appliedAgo}
                      </p>
                    </div>

                    {/* Right: applicant count (org only) + three-dot menu */}
                    <div className="flex items-center gap-3 shrink-0 pt-1">
                      {isOrg && (
                        <span className="text-[#ff9400] font-medium text-sm sm:text-base whitespace-nowrap">
                          {(item as OrgPosting).applicantCount}{' '}
                          {(item as OrgPosting).applicantCount === 1 ? 'Applicant' : 'Applicants'}
                        </span>
                      )}
                      <ThreeDotsMenu
                        isOpen={openMenuId === item.id}
                        onToggle={(e) => toggleMenu(e, item.id)}
                      >
                        {isOrg ? (
                          <MenuItem label="Manage Post" />
                        ) : (
                          <>
                            <MenuItem label="Copy Link" />
                            <MenuItem label="Delete Application" danger />
                          </>
                        )}
                      </ThreeDotsMenu>
                    </div>
                  </div>

                  {idx < items.length - 1 && (
                    <div className="h-px bg-[#e5e7eb]" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#ff9400] disabled:opacity-40 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Previous
            </button>

            {VISIBLE_PAGES.map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-[#18191c] text-white'
                    : 'text-[#374151] hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}

            <span className="text-[#9ca3af] text-sm px-1">...</span>

            <button
              onClick={() => setCurrentPage(TOTAL_PAGES)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                currentPage === TOTAL_PAGES
                  ? 'bg-[#18191c] text-white'
                  : 'text-[#374151] hover:bg-gray-100'
              }`}
            >
              {TOTAL_PAGES}
            </button>

            <button
              onClick={() => setCurrentPage(p => Math.min(TOTAL_PAGES, p + 1))}
              disabled={currentPage === TOTAL_PAGES}
              className="flex items-center gap-1 text-[#374151] text-sm font-medium px-2 py-1.5 hover:text-[#ff9400] disabled:opacity-40 transition-colors"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
