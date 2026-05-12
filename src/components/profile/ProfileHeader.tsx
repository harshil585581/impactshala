import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../../types/profile';

const roleLabels: Record<string, string> = {
  student: 'Student',
  professional: 'Working Professional',
  entrepreneur: 'Entrepreneur',
  educator: 'Creative Arts & Enrichment Educator',
};

interface Props {
  profile: UserProfile;
  onFollow: () => void;
  onEditClick: () => void;
}

export default function ProfileHeader({ profile, onFollow, onEditClick }: Props) {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const subtitle = profile.title
    ? `${profile.title}${profile.company ? ` · ${profile.company}` : ''}`
    : roleLabels[profile.role] ?? 'Member';

  return (
    <div className="bg-white rounded-[14px] border border-[#f2f2f3] overflow-hidden shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">

      {/* Cover photo */}
      <div className="relative h-[160px] sm:h-[200px] bg-[#003049] group">
        {profile.coverUrl && (
          <img src={profile.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {profile.isOwnProfile && (
          <>
            <input ref={coverInputRef} type="file" accept="image/*" className="sr-only" />
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-3 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow"
              aria-label="Change cover photo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#18191c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Avatar + info row */}
      <div className="px-5 sm:px-8 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14">

          {/* Avatar */}
          <div className="relative w-fit group">
            <img
              src={profile.avatarUrl}
              alt={fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white object-cover shadow-md"
            />
            {profile.isOwnProfile && (
              <>
                <input ref={avatarInputRef} type="file" accept="image/*" className="sr-only" />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label="Change profile photo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-1">
            {profile.isOwnProfile ? (
              <>
                <button
                  onClick={onEditClick}
                  className="flex items-center gap-2 h-[40px] px-5 border border-[#ff9400] text-[#ff9400] text-sm font-semibold rounded-full hover:bg-[#fff6ed] transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate('/account/update/' + profile.role)}
                  className="h-[40px] px-5 bg-[#ff9400] text-white text-sm font-semibold rounded-full hover:bg-[#e68500] transition-colors shadow-[0px_4px_12px_rgba(255,148,0,0.3)]"
                >
                  Update Account
                </button>
              </>
            ) : (
              <>
                <button className="flex items-center gap-2 h-[40px] px-5 bg-white border border-[#e4e5e8] text-[#18191c] text-sm font-semibold rounded-full hover:bg-[#f9fafb] transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Message
                </button>
                <button
                  onClick={onFollow}
                  className={`h-[40px] px-5 text-sm font-semibold rounded-full transition-colors ${
                    profile.isFollowing
                      ? 'bg-white border border-[#e4e5e8] text-[#18191c] hover:bg-[#f9fafb]'
                      : 'bg-[#ff9400] text-white hover:bg-[#e68500] shadow-[0px_4px_12px_rgba(255,148,0,0.3)]'
                  }`}
                >
                  {profile.isFollowing ? 'Following' : '+ Follow'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name & subtitle */}
        <div className="mt-3">
          <h1 className="text-[#18191c] text-xl sm:text-2xl font-bold leading-tight">{fullName}</h1>
          <p className="text-[#5e6670] text-sm sm:text-base mt-0.5">{subtitle}</p>
          {profile.location && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[#9199a3] text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              {profile.location}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
