import type { UserProfile } from '../../types/profile';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[#18191c] text-base font-semibold border-b border-[#f2f2f3] pb-2">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#9199a3] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[#9199a3] text-xs">{label}</p>
        <p className="text-[#18191c] text-sm font-medium mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileAbout({ profile }: { profile: UserProfile }) {
  const hasDetails = profile.workSector || profile.workIndustry || profile.teachSubject ||
    profile.experience || profile.entrepreneurType || profile.describeAs;

  return (
    <div className="bg-white rounded-[14px] border border-[#f2f2f3] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] px-5 sm:px-6 py-5 flex flex-col gap-6">

      {/* Bio */}
      <Section title="About">
        {profile.bio ? (
          <p className="text-[#5e6670] text-sm leading-relaxed">{profile.bio}</p>
        ) : (
          <p className="text-[#9199a3] text-sm italic">No bio added yet.</p>
        )}
      </Section>

      {/* Role-specific details */}
      {hasDetails && (
        <Section title="Professional Details">
          <div className="flex flex-col gap-4">
            <InfoRow
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
              label="Work Sector"
              value={profile.workSector ?? ''}
            />
            <InfoRow
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              label="Industry"
              value={profile.workIndustry ?? ''}
            />
            <InfoRow
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              label="What I Teach"
              value={profile.teachSubject ?? ''}
            />
            <InfoRow
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
              label="Experience"
              value={profile.experience ?? ''}
            />
            {profile.entrepreneurType && (
              <InfoRow
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                label="Entrepreneur Type"
                value={profile.entrepreneurType === 'established' ? 'Established Entrepreneur' : 'Aspiring Entrepreneur'}
              />
            )}
            <InfoRow
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
              label="Describes As"
              value={profile.describeAs ?? ''}
            />
          </div>
        </Section>
      )}

      {/* Reach out for */}
      {profile.reachFor.length > 0 && (
        <Section title="Reach Out to Me For">
          <div className="flex flex-wrap gap-2">
            {profile.reachFor.map((tag) => (
              <span key={tag} className="bg-[#fff6ed] text-[#ff9400] text-sm font-medium px-3 py-1 rounded-full border border-[#ffeacc]">
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
