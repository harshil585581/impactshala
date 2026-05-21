import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';

type Notification = {
  id: string;
  text: string;
  boldWord?: string;
  afterBold?: string;
  time: string;
  isUnread: boolean;
  avatarBg: string;
  avatarIcon: 'bulb' | 'books';
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    text: 'You have access to a new message for ',
    boldWord: 'simpel.ai',
    afterBold: ' which is ....',
    time: '16h',
    isUnread: true,
    avatarBg: '#c9a882',
    avatarIcon: 'bulb',
  },
  {
    id: '2',
    text: 'You can help grow ',
    boldWord: 'Amba LG',
    afterBold: ' by inviting your friends to follow ....',
    time: '16h',
    isUnread: false,
    avatarBg: '#d9aba8',
    avatarIcon: 'bulb',
  },
  {
    id: '3',
    text: 'You have reached your Rs.500.00 payment threshold and were....',
    time: '16h',
    isUnread: false,
    avatarBg: '#a8b8d9',
    avatarIcon: 'books',
  },
  {
    id: '4',
    text: 'You can help grow ',
    boldWord: 'Amba LG',
    afterBold: ' by inviting your friends to follow ....',
    time: '16h',
    isUnread: true,
    avatarBg: '#d9aba8',
    avatarIcon: 'bulb',
  },
  {
    id: '5',
    text: 'You have reached your Rs.500.00 payment threshold and were....',
    time: '1d',
    isUnread: true,
    avatarBg: '#a8b8d9',
    avatarIcon: 'books',
  },
  {
    id: '6',
    text: 'You can help grow ',
    boldWord: 'Amba LG',
    afterBold: ' by inviting your friends to follow ....',
    time: '2d',
    isUnread: true,
    avatarBg: '#d9aba8',
    avatarIcon: 'bulb',
  },
  {
    id: '7',
    text: 'You can help grow ',
    boldWord: 'Amba LG',
    afterBold: ' by inviting your friends to follow ....',
    time: '2d',
    isUnread: true,
    avatarBg: '#d9aba8',
    avatarIcon: 'bulb',
  },
];

function BulbIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2a7 7 0 00-4 12.8V17a1 1 0 001 1h6a1 1 0 001-1v-2.2A7 7 0 0012 2z" fill="white" opacity="0.9" />
      <path d="M9 21h6M10 21v1h4v-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BooksIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="6" height="16" rx="1" fill="white" opacity="0.9" />
      <rect x="10" y="6" width="6" height="14" rx="1" fill="white" opacity="0.8" />
      <path d="M17 8l3.5 11" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function NotificationAvatar({ bg, icon }: { bg: string; icon: 'bulb' | 'books' }) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
      style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)` }}
    >
      {icon === 'bulb' ? <BulbIcon /> : <BooksIcon />}
    </div>
  );
}

function NotificationItem({ notif, onDismiss }: { notif: Notification; onDismiss: (id: string) => void }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-[#f2f2f3] last:border-0 group">
      <NotificationAvatar bg={notif.avatarBg} icon={notif.avatarIcon} />

      <div className="flex-1 min-w-0">
        <p className="text-[#18191c] text-sm leading-snug">
          {notif.text}
          {notif.boldWord && <strong>{notif.boldWord}</strong>}
          {notif.afterBold}
        </p>
        <p className="text-[#ff9400] text-xs font-medium mt-1">{notif.time}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-1">
        {notif.isUnread && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff9400] shrink-0" />
        )}
        <button
          onClick={() => onDismiss(notif.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9199a3] hover:text-[#ff9400]"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const navigate = useNavigate();

  function handleClearAll() {
    setNotifications([]);
  }

  function handleDismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[520px]">
          {/* Page nav indicator */}
          <div className="flex justify-end mb-4">
            <div className="flex flex-col items-center gap-1 text-[#ff9400]">
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
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ff9400] text-white text-[9px] rounded-full w-[14px] h-[14px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold">Notifications</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h1 className="text-[#18191c] text-xl font-bold">Notifications</h1>
              <button className="text-[#9199a3] hover:text-[#18191c] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between px-5 pb-2">
              <span className="text-[#18191c] text-sm font-semibold">New</span>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[#ff9400] text-sm font-semibold hover:text-[#e68500] transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="px-5 pb-5">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-[#9199a3]">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
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
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotificationItem key={notif.id} notif={notif} onDismiss={handleDismiss} />
                ))
              )}
            </div>
          </div>

          {/* Back link */}
          <button
            onClick={() => navigate(-1)}
            className="mt-5 mx-auto flex items-center gap-1.5 text-[#9199a3] hover:text-white text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
