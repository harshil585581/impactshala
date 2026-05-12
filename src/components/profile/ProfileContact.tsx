import type { UserProfile } from '../../types/profile';

const platformIcons: Record<string, React.ReactNode> = {
  LinkedIn: <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077b5"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2" fill="#0077b5"/></svg>,
  GitHub: <svg width="16" height="16" viewBox="0 0 24 24" fill="#18191c"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="#18191c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  Instagram: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  'Twitter / X': <svg width="16" height="16" viewBox="0 0 24 24" fill="#18191c"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  Facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  'Medium / Substack': <svg width="16" height="16" viewBox="0 0 24 24" fill="#18191c"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>,
  'Behance / Dribbble': <svg width="16" height="16" viewBox="0 0 24 24" fill="#1769ff"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.7zM19.34 13c-.104-1.336-1.02-1.893-1.97-1.893-1.04 0-1.856.63-2.01 1.893h3.98zM0 5h6.599c3.098 0 4.199 1.787 4.199 3.541 0 1.657-.895 2.652-2.099 3.151 1.441.35 2.739 1.426 2.739 3.338 0 2.531-1.978 3.97-5.098 3.97H0V5zm4.339 5.816c1.12 0 1.661-.465 1.661-1.278 0-.791-.51-1.197-1.575-1.197H3.35v2.475h.989zm.242 5.107c1.185 0 1.838-.526 1.838-1.489 0-.883-.577-1.408-1.855-1.408H3.35v2.897h1.231z"/></svg>,
};

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#9199a3] shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[#9199a3] text-xs">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-[#ff9400] text-sm font-medium hover:underline truncate block mt-0.5">
            {value}
          </a>
        ) : (
          <p className="text-[#18191c] text-sm font-medium mt-0.5 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function ProfileContact({ profile }: { profile: UserProfile }) {
  return (
    <div className="bg-white rounded-[14px] border border-[#f2f2f3] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] px-5 sm:px-6 py-5 flex flex-col gap-5">
      <h3 className="text-[#18191c] text-base font-semibold border-b border-[#f2f2f3] pb-2">Contact</h3>

      <div className="flex flex-col gap-4">
        <ContactRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          label="Email"
          value={profile.email}
          href={`mailto:${profile.email}`}
        />
        <ContactRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.1 8.12 19.79 19.79 0 01.07 4a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.18 6.18l1.27-.42a2 2 0 012.11.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="Phone"
          value={profile.phone}
        />
        <ContactRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>}
          label="Location"
          value={profile.location}
        />
        <ContactRow
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.8"/></svg>}
          label="Languages"
          value={profile.languages}
        />
        {profile.website && (
          <ContactRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            label="Website"
            value={profile.website}
            href={profile.website}
          />
        )}
      </div>

      {/* Social links */}
      {profile.socialLinks.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-[#f2f2f3] pt-4">
          <p className="text-[#9199a3] text-xs font-medium uppercase tracking-wide">Social Links</p>
          <div className="flex flex-col gap-3">
            {profile.socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[#18191c] text-sm font-medium hover:text-[#ff9400] transition-colors group"
              >
                {platformIcons[link.platform] ?? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
                <span className="truncate">{link.platform}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
