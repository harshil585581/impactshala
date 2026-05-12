import type { UserProfile } from '../../types/profile';

const MOCK_POSTS = [
  {
    id: '1',
    content: 'Excited to share my latest project on sustainable development! We\'ve been working hard to create impactful solutions that make a difference.',
    time: '2h',
    reactions: 24,
    comments: 8,
  },
  {
    id: '2',
    content: 'Great networking session at the Impact Summit today. Met some incredible change-makers who are truly transforming their communities.',
    time: '1d',
    reactions: 47,
    comments: 12,
  },
];

export default function ProfileActivity({ profile }: { profile: UserProfile }) {
  const avatarUrl = profile.avatarUrl;
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  if (MOCK_POSTS.length === 0) {
    return (
      <div className="bg-white rounded-[14px] border border-[#f2f2f3] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] px-5 py-10 text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto text-[#d1d5db] mb-3">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-[#9199a3] text-sm">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {MOCK_POSTS.map((post) => (
        <div key={post.id}
          className="bg-white rounded-[14px] border border-[#f2f2f3] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] px-5 py-5">
          <div className="flex items-center gap-3 mb-3">
            <img src={avatarUrl} alt={fullName} className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div>
              <p className="text-[#18191c] text-sm font-semibold">{fullName}</p>
              <p className="text-[#9199a3] text-xs">{post.time} ago</p>
            </div>
          </div>
          <p className="text-[#5e6670] text-sm leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#f2f2f3]">
            <button className="flex items-center gap-1.5 text-[#9199a3] text-sm hover:text-[#ff9400] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {post.reactions}
            </button>
            <button className="flex items-center gap-1.5 text-[#9199a3] text-sm hover:text-[#ff9400] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {post.comments}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
