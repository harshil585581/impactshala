import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import ApplyModal from '../components/discover/ApplyModal';
import DiscoverCard from '../components/discover/SavedDiscoverCard';
import {
  fetchSavedDiscoverItems,
  fetchSavedCommunityPosts,
  unsaveDiscoverItem,
  unsavePost,
  fetchSavedPostIds,
  savePost,
  fetchSavedLearningCourses,
  unsaveLearningCourse,
  fetchSavedEmploymentPostings,
  unsaveEmploymentPosting,
  fetchSavedSeekerProfiles,
  unsaveSeekerProfile,
  type SavedDiscoverSnapshot,
  type SavedLearningSnapshot,
} from '../services/savedService';
import { applyToCourse } from '../services/learningService';
import { submitApplication, type EmployerPosting, type SeekerProfile } from '../services/employmentService';
import {
  fetchLikedPostIds,
  fetchLikesCounts,
  fetchCommentCounts,
  togglePostLike,
  type FeedPost,
} from '../services/postService';
import {
  fetchConnections,
  fetchSentRequests,
  sendConnectionRequest,
} from '../services/communityService';
import PostDetailModal from '../components/profile/PostDetailModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getDisplayName(user: FeedPost['user']): string {
  if (!user) return 'User';
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.org_name || 'User';
}

function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  if (url) return <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full bg-[#ff9400] flex items-center justify-center shrink-0 text-white font-bold" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}



// ─── Learning Apply Modal ─────────────────────────────────────────────────────

function LearningApplyModal({ course, onClose }: { course: SavedLearningSnapshot; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await applyToCourse(course.id, form, []);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {done ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h3 className="text-[#18191c] font-bold text-lg mb-1">Application Submitted!</h3>
            <p className="text-text-muted text-sm mb-6">Your application for <span className="font-semibold">{course.title}</span> has been sent.</p>
            <button onClick={onClose} className="bg-[#f77f00] text-white font-semibold px-6 py-2 rounded-full hover:bg-[#e07000] transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h3 className="text-[#18191c] font-bold text-lg leading-snug">{course.title}</h3>
              <p className="text-text-muted text-sm mt-0.5">{course.university}</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[#18191c] text-sm font-medium block mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#f77f00]" required />
              </div>
              <div>
                <label className="text-[#18191c] text-sm font-medium block mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#f77f00]" required />
              </div>
              <div>
                <label className="text-[#18191c] text-sm font-medium block mb-1">Mobile</label>
                <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="+91 9876543210" className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#f77f00]" />
              </div>
              <div>
                <label className="text-[#18191c] text-sm font-medium block mb-1">Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Why are you interested in this course?" className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#f77f00] resize-none" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={submitting || !form.name.trim() || !form.email.trim()} className="bg-[#f77f00] text-white font-semibold py-2.5 rounded-full hover:bg-[#e07000] transition-colors disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Learning Card ────────────────────────────────────────────────────────────

function LearningCard({ course, onUnsave }: { course: SavedLearningSnapshot; onUnsave: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm">
        <img
          src={course.image || 'https://placehold.co/500x200/1e293b/ffffff?text=Course'}
          alt={course.title}
          className="w-full h-[180px] object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/500x200/1e293b/ffffff?text=Course'; }}
        />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#f77f00"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <span className="text-[#374151] text-xs">{course.university}</span>
              </div>
              <h3 className="text-[#18191c] font-bold text-base leading-snug">{course.title}</h3>
            </div>
            <button onClick={() => onUnsave(course.id)} title="Remove from saved" className="shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#f77f00">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <button onClick={() => setApplying(true)} className="flex-1 bg-[#f77f00] text-white text-sm font-semibold py-2 rounded-full hover:bg-[#e07000] transition-colors">
              Get Started
            </button>
            <button
              onClick={() => course.brochureUrl && window.open(course.brochureUrl, '_blank')}
              disabled={!course.brochureUrl}
              className={`flex-1 border border-[#e5e7eb] text-[#374151] text-sm font-medium py-2 rounded-full transition-colors ${course.brochureUrl ? 'hover:bg-gray-50' : 'opacity-40 cursor-not-allowed'}`}
            >
              Download Brochure
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <div>
              <p className="text-[#f77f00] text-xs font-medium">Academic level</p>
              <p className="text-[#18191c] text-sm">{course.level}</p>
            </div>
            <div>
              <p className="text-[#f77f00] text-xs font-medium">Mode</p>
              <p className="text-[#18191c] text-sm">{course.mode}</p>
            </div>
            <div>
              <p className="text-[#f77f00] text-xs font-medium">Course Fee</p>
              <p className="text-[#18191c] text-sm">{course.fee}</p>
            </div>
            <div>
              <p className="text-[#f77f00] text-xs font-medium">Duration</p>
              <p className="text-[#18191c] text-sm">{course.duration}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[#f77f00] text-xs font-medium">Application Deadline</p>
              <p className="text-[#18191c] text-sm">{course.deadline}</p>
            </div>
          </div>

          <button onClick={() => setExpanded(v => !v)} className="mt-3 text-[#f77f00] text-sm font-medium hover:underline block">
            {expanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      </div>

      {applying && <LearningApplyModal course={course} onClose={() => setApplying(false)} />}
    </>
  );
}

// ─── Employment helpers (mirrors EmploymentHubDiscoveryPage) ──────────────────

function EField({ label, value }: { label: string; value?: string | string[] | null }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(', ') : value;
  if (!display.trim()) return null;
  return (
    <p className="text-sm text-[#18191c] leading-relaxed">
      <span className="font-medium">{label}:&nbsp;</span>{display}
    </p>
  );
}

function EBullets({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  const lines = value.trim().split('\n').filter(Boolean);
  if (lines.length <= 1) {
    return (
      <p className="text-sm text-[#18191c] leading-relaxed">
        <span className="font-medium">{label}:&nbsp;</span>{lines[0]}
      </p>
    );
  }
  return (
    <div>
      <p className="text-sm font-medium text-[#18191c] mb-1.5">{label}:</p>
      <ul className="list-disc list-outside ml-4 space-y-1">
        {lines.map((line, i) => <li key={i} className="text-sm text-[#18191c] leading-relaxed">{line}</li>)}
      </ul>
    </div>
  );
}

function ESection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#f2f2f3] pt-4 mt-4">
      <h4 className="text-base font-bold text-[#18191c] mb-3">{title}</h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ESkillPill({ label }: { label: string }) {
  return (
    <span className="text-[#f77f00] text-xs font-medium px-3 py-1.5 rounded-full border border-[#f77f00]/30 bg-[#fff8ee] whitespace-nowrap">
      {label}
    </span>
  );
}

function EmployerExpandedDetails({ posting, onApply }: { posting: EmployerPosting; onApply: () => void }) {
  const skills = posting.preferred_skillsets
    ? posting.preferred_skillsets.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  return (
    <div>
      <ESection title="Job Overview">
        <EField label="Department" value={posting.department} />
        <EField label="Industry" value={posting.industry} />
        <EField label="Career Level" value={posting.career_level} />
        <EField label="Job Type" value={posting.job_type} />
        <EField label="Work Mode" value={posting.work_mode} />
      </ESection>
      <ESection title="Role Details">
        <EField label="Role Type" value={posting.role_type} />
        <EField label="Reporting To" value={posting.reporting_to} />
        <EBullets label="Daily Tasks" value={posting.daily_tasks} />
        <EField label="Training Support" value={posting.training_support} />
        <EField label="Growth Potential" value={posting.growth_potential} />
      </ESection>
      <ESection title="Work Culture & Flexibility">
        <EField label="Working Hours" value={posting.working_hours} />
        <EField label="Leave Policy" value={posting.leave_policy} />
        <EField label="Company Culture" value={posting.company_culture} />
        <EField label="Diversity Practices" value={posting.diversity_practices} />
      </ESection>
      <ESection title="Compensation & Benefits">
        <EField label="Compensation" value={posting.compensation} />
        <EField label="Payment Frequency" value={posting.payment_frequency} />
        <EField label="Additional Perks" value={posting.additional_perks} />
      </ESection>
      <ESection title="Candidate Profile">
        <EBullets label="Mandatory Attributes" value={posting.mandatory_attributes} />
        {skills.length > 0 && (
          <p className="text-sm text-[#18191c]">
            <span className="font-medium">Preferred Skillsets:&nbsp;</span>{skills.join(', ')}
          </p>
        )}
        {posting.eligibility_criteria?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-[#18191c] mb-1.5">Eligibility Criteria:</p>
            <ul className="list-disc list-outside ml-4 space-y-1">
              {posting.eligibility_criteria.map((c, i) => <li key={i} className="text-sm text-[#18191c]">{c}</li>)}
            </ul>
          </div>
        )}
        {posting.required_documents?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-[#18191c] mb-1.5">Required Documents:</p>
            <ul className="list-disc list-outside ml-4 space-y-1">
              {posting.required_documents.map((d, i) => <li key={i} className="text-sm text-[#18191c]">{d}</li>)}
            </ul>
          </div>
        )}
      </ESection>
      <ESection title="Application Process">
        <EField label="Weekly Hours" value={posting.weekly_hours} />
        <EField label="Last Date to Apply" value={posting.last_date_to_apply} />
        <EField label="Selection Process" value={posting.selection_process} />
      </ESection>
      {posting.faqs?.length > 0 && (
        <ESection title="FAQs">
          {posting.faqs.map((faq, i) => (
            <div key={i} className="bg-[#f9f9f9] rounded-xl p-3">
              <p className="text-sm font-semibold text-[#18191c]">Q: {faq.q}</p>
              {faq.a && <p className="text-sm text-[#6b6b6b] mt-1">A: {faq.a}</p>}
            </div>
          ))}
        </ESection>
      )}
      <div className="border-t border-[#f2f2f3] pt-4 mt-4">
        <button onClick={onApply} className="w-full bg-[#f77f00] text-white font-semibold py-2.5 rounded-full hover:bg-[#e07000] transition-colors">
          Apply Now
        </button>
      </div>
    </div>
  );
}

function MediaPreview({ src, className }: { src: string; className?: string }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(src);
  if (isImage) {
    return <img src={src} alt="media" className={className} style={{ objectFit: 'cover' }} />;
  }
  return <video src={src} controls className={className} />;
}

function SeekerExpandedDetails({ profile }: { profile: SeekerProfile }) {
  return (
    <div>
      <ESection title="More Details">
        <EField label="Opportunity Domain" value={profile.job_industry} />
        {profile.certifications?.length > 0 && (
          <EField label="Certification / Accreditation" value={profile.certifications} />
        )}
      </ESection>

      <ESection title="Personal Information">
        <EField label="Looking For Roles In" value={profile.looking_for_roles} />
        <EField label="Current Location" value={profile.current_location} />
        <EField label="Preferred Base City" value={profile.preferred_base_city} />
        <EField label="Current Status" value={profile.current_status} />
        <EField label="Work Location Type" value={profile.preferred_work_mode} />
        <EField label="Job Type" value={profile.job_type} />
      </ESection>

      <ESection title="Desired Role & Work Preferences">
        <EBullets label="Are you looking for a specific JD or open to dynamic roles?" value={profile.specific_jd} />
        <EField label="Reporting To" value={profile.reporting_comfort} />
        <EField label="Training Expectation" value={profile.training_expectation} />
        <EField label="Work Hours Flexibility" value={profile.work_hours_flexibility} />
        <EField label="Leave Expectation" value={profile.leave_expectation} />
      </ESection>

      <ESection title="Compensation & Availability">
        <EField label="Expected Salary / Stipend Range" value={profile.expected_salary} />
        <EField label="Open to Negotiation?" value={profile.open_to_negotiation} />
        {(profile.department || profile.available_from) && (
          <div className="flex flex-wrap gap-x-8 gap-y-1">
            {profile.department && (
              <p className="text-sm text-[#18191c]"><span className="font-medium">Department :&nbsp; </span>{profile.department}</p>
            )}
            {profile.available_from && (
              <p className="text-sm text-[#18191c]"><span className="font-medium">Available From :&nbsp; </span>{profile.available_from}</p>
            )}
          </div>
        )}
        <EField label="Weekly Commitment" value={profile.weekly_commitment} />
      </ESection>

      <ESection title="Skills, Tools & Attributes">
        {profile.technical_skills?.length > 0 && (
          <p className="text-sm text-[#18191c]"><span className="font-medium">Top 3 Technical Skills :&nbsp; </span>{profile.technical_skills.join(', ')}</p>
        )}
        {profile.soft_skills?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-[#18191c] mb-1">Top 3 Soft Skills / Traits :</p>
            <p className="text-sm text-[#18191c]">{profile.soft_skills.join(', ')}</p>
          </div>
        )}
        {profile.certifications?.length > 0 && (
          <EField label="Certifications / Courses" value={profile.certifications} />
        )}
        <EField label="Tools / Platforms Familiar With" value={profile.tools_platforms} />
        {profile.portfolio_link && (
          <p className="text-sm text-[#18191c]">
            <span className="font-medium">Portfolio / GitHub / Behance :&nbsp; </span>
            <a href={profile.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-[#f77f00] hover:underline break-all">
              {profile.portfolio_link}
            </a>
          </p>
        )}
        {profile.profile_link && (
          <p className="text-sm text-[#18191c]">
            <span className="font-medium">Impactshaala / Profile Link :&nbsp; </span>
            <a href={profile.profile_link} target="_blank" rel="noopener noreferrer" className="text-[#f77f00] hover:underline break-all">
              {profile.profile_link}
            </a>
          </p>
        )}
        {profile.resume_url && (
          <p className="text-sm text-[#18191c]">
            <span className="font-medium">Resume :&nbsp; </span>
            <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-[#f77f00] font-medium hover:underline">
              Download Resume
            </a>
          </p>
        )}
      </ESection>

      <ESection title="Culture & Values Alignment">
        <EField label="Preferred Work Culture" value={profile.preferred_work_culture} />
        <EField label="What Kind of Work Drives You?" value={profile.work_drives_you} />
        <EField label="Career Goals (Next 1–2 years)" value={profile.career_goals} />
      </ESection>

      <ESection title="Human Touch & Differentiators">
        <EField label="Special Notes / Needs" value={profile.special_notes} />
        {profile.seeking_employer_who && (
          <div>
            <p className="text-sm font-medium text-[#18191c] mb-1">Specifically seeking for employer who is :</p>
            <p className="text-sm text-[#18191c]">{profile.seeking_employer_who}</p>
          </div>
        )}
        {profile.intro_video_url && (
          <div>
            <p className="text-sm font-medium text-[#18191c] mb-2">Intro Video / Culture Clip :</p>
            <MediaPreview src={profile.intro_video_url} className="w-full rounded-xl border border-[#e4e5e8] max-h-[220px] object-cover" />
          </div>
        )}
      </ESection>
    </div>
  );
}

// ─── Employment Apply Modal ───────────────────────────────────────────────────

function EmploymentApplyModal({ posting, onClose }: { posting: EmployerPosting; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await submitApplication(posting.id, { name: form.name, email: form.email, mobile: form.mobile, message: form.message || undefined });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {done ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h3 className="text-[#18191c] font-bold text-lg mb-1">Application Submitted!</h3>
            <p className="text-text-muted text-sm mb-6">Your application for <span className="font-semibold">{posting.job_title}</span> has been sent.</p>
            <button onClick={onClose} className="bg-[#f77f00] text-white font-semibold px-6 py-2 rounded-full hover:bg-[#e07000] transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h3 className="text-[#18191c] font-bold text-lg leading-snug">{posting.job_title}</h3>
              <p className="text-text-muted text-sm mt-0.5">{posting.org_name}</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[#18191c] text-sm font-medium block mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#f77f00]" required />
              </div>
              <div>
                <label className="text-[#18191c] text-sm font-medium block mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#f77f00]" required />
              </div>
              <div>
                <label className="text-[#18191c] text-sm font-medium block mb-1">Mobile</label>
                <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="+91 9876543210" className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#f77f00]" />
              </div>
              <div>
                <label className="text-[#18191c] text-sm font-medium block mb-1">Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Why are you a good fit for this role?" className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#f77f00] resize-none" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={submitting || !form.name.trim() || !form.email.trim()} className="bg-[#f77f00] text-white font-semibold py-2.5 rounded-full hover:bg-[#e07000] transition-colors disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Employment Card ──────────────────────────────────────────────────────────

function EmploymentCard({ posting, onUnsave }: { posting: EmployerPosting; onUnsave: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const initial = posting.org_name?.[0]?.toUpperCase() ?? 'J';
  const skills = posting.preferred_skillsets
    ? posting.preferred_skillsets.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes || 1} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#f2f2f3] p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-base shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[#18191c] font-bold text-base leading-tight">{posting.job_title || 'Untitled Role'}</h3>
            <p className="text-[#6b6b6b] text-sm">{posting.org_name}</p>
            {posting.work_mode && <p className="text-[#6b6b6b] text-sm">({posting.work_mode})</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setApplying(true)} className="bg-[#f77f00] text-white text-sm font-semibold px-5 h-10 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap">
              Get Started
            </button>
            <button onClick={() => onUnsave(posting.id)} className="w-10 h-10 flex items-center justify-center rounded-full border border-[#f77f00] bg-[#fff8ee] text-[#f77f00] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-3">
          {posting.career_level && (
            <span><span className="text-[#f77f00] font-semibold">Exp - </span><span className="text-[#18191c] font-semibold">{posting.career_level}</span></span>
          )}
          {posting.compensation && (
            <span><span className="text-[#f77f00] font-semibold">Salary - </span><span className="text-[#18191c] font-semibold">{posting.compensation}</span></span>
          )}
          {posting.job_type && (
            <span><span className="text-[#f77f00] font-semibold">Type - </span><span className="text-[#18191c] font-semibold">{posting.job_type}</span></span>
          )}
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[#f77f00] font-semibold text-sm">Skills -</span>
            {skills.slice(0, 4).map((s, i) => <ESkillPill key={i} label={s} />)}
            {skills.length > 4 && <span className="text-[#f77f00] text-xs font-medium">+{skills.length - 4} more</span>}
          </div>
        )}

        {expanded && <EmployerExpandedDetails posting={posting} onApply={() => setApplying(true)} />}

        <div className="flex items-center justify-between text-sm pt-3 mt-2 border-t border-[#f2f2f3]">
          <span className="text-[#9f9f9f]">{timeAgo(posting.created_at)}</span>
          <button onClick={() => setExpanded(v => !v)} className="text-[#f77f00] font-medium hover:underline">
            {expanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      </div>

      {applying && <EmploymentApplyModal posting={posting} onClose={() => setApplying(false)} />}
    </>
  );
}

function SeekerCard({ profile, onUnsave, onView }: { profile: SeekerProfile; onUnsave: (id: string) => void; onView: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const initial = profile.name?.[0]?.toUpperCase() ?? 'U';
  const skills = profile.technical_skills;

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes || 1} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }

  return (
    <div className="bg-white rounded-2xl border border-[#f2f2f3] p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#1d3557] flex items-center justify-center text-white font-bold text-base shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#18191c] font-bold text-base leading-tight">{profile.name || 'Anonymous'}</h3>
          <p className="text-[#6b6b6b] text-sm">{profile.job_industry}</p>
          {profile.preferred_work_mode && <p className="text-[#6b6b6b] text-sm">({profile.preferred_work_mode})</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onView(profile.id)} className="bg-[#f77f00] text-white text-sm font-semibold px-5 h-10 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap">
            Get Started
          </button>
          <button onClick={() => onUnsave(profile.id)} className="w-10 h-10 flex items-center justify-center rounded-full border border-[#f77f00] bg-[#fff8ee] text-[#f77f00] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-3">
        {profile.current_status && (
          <span><span className="text-[#f77f00] font-semibold">Exp - </span><span className="text-[#18191c] font-semibold">{profile.current_status}</span></span>
        )}
        {profile.expected_salary && (
          <span><span className="text-[#f77f00] font-semibold">Salary - </span><span className="text-[#18191c] font-semibold">{profile.expected_salary}</span></span>
        )}
        {profile.job_type && (
          <span><span className="text-[#f77f00] font-semibold">Type - </span><span className="text-[#18191c] font-semibold">{profile.job_type}</span></span>
        )}
      </div>

      {profile.looking_for_roles && (
        <div className="mb-3 text-sm">
          <span className="text-[#f77f00] font-semibold">Looking For - </span>
          <span className="text-[#18191c] font-semibold">{profile.looking_for_roles}</span>
        </div>
      )}

      {skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[#f77f00] font-semibold text-sm">Skills -</span>
          {skills.slice(0, 4).map((s, i) => <ESkillPill key={i} label={s} />)}
          {skills.length > 4 && <span className="text-[#f77f00] text-xs font-medium">+{skills.length - 4} more</span>}
        </div>
      )}

      {expanded && <SeekerExpandedDetails profile={profile} />}

      <div className="flex items-center justify-between text-sm pt-3 mt-2 border-t border-[#f2f2f3]">
        <span className="text-[#9f9f9f]">{timeAgo(profile.created_at)}</span>
        <button onClick={() => setExpanded(v => !v)} className="text-[#f77f00] font-medium hover:underline">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#e5e7eb] rounded-2xl">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-3">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[#6b7280] font-semibold text-base">{message}</p>
      <p className="text-[#9199a3] text-sm mt-1">{sub}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden animate-pulse">
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3.5 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
      <div className="h-[180px] bg-gray-100" />
    </div>
  );
}

// ─── Community Card (matches Figma 301913:18228) ──────────────────────────────

interface CommunityCardProps {
  post: FeedPost;
  onUnsave: (id: string) => void;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  onLikeToggle: (postId: string, willLike: boolean) => void;
  isConnected: boolean;
  hasSentRequest: boolean;
  onSendRequest: (userId: string) => void;
  onOpenPost: (post: FeedPost) => void;
}

function CommunityCard({
  post, onUnsave, isLiked, likesCount, commentsCount, onLikeToggle,
  isConnected, hasSentRequest, onSendRequest, onOpenPost,
}: CommunityCardProps) {
  const [voted, setVoted] = useState<string | null>(null);
  const [pollCounts, setPollCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries((post.poll_options ?? []).map(o => [o, 0]))
  );

  const name = getDisplayName(post.user);
  const time = relativeTime(post.created_at);
  const isPoll = post.post_type === 'poll' && post.poll_options && post.poll_options.length > 0;
  const isEvent = post.post_type === 'event';
  const hasMedia = post.media_urls && post.media_urls.length > 0;

  const totalVotes = Object.values(pollCounts).reduce((s, v) => s + v, 0);

  const POLL_WIDTHS: Record<string, number> = {
    'Work-Life Balance': 89, 'Salary & Benefits': 95,
    'Growth Opportunities': 65, 'Company Culture': 40,
  };

  function handleVote(opt: string) {
    if (voted) return;
    setVoted(opt);
    setPollCounts(prev => ({ ...prev, [opt]: (prev[opt] ?? 0) + 1 }));
  }

  return (
    <div className="bg-white border border-[#ececec] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] rounded-[16px] px-[25px] py-[15px] flex flex-col gap-[15px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={name} url={post.user?.avatar_url} size={40} />
          <div>
            <p className="text-[#222] text-[16px] font-semibold leading-tight">{name}</p>
            <p className="text-[#8e8e8e] text-[12px] leading-tight mt-0.5">{time}</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          {/* Add to community — only show if not yet connected */}
          {!isConnected && post.user && (
            <button
              onClick={() => !hasSentRequest && onSendRequest(post.user!.id)}
              title={hasSentRequest ? 'Request sent' : 'Add to community'}
              className={`transition-opacity ${hasSentRequest ? 'text-[#9ca3af] cursor-default' : 'text-[#f77f00] hover:opacity-75'}`}
            >
              {hasSentRequest ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <polyline points="16 11 18 13 22 9"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              )}
            </button>
          )}
          {/* 3-dot menu */}
          <button className="text-[#9ca3af] hover:text-[#374151] transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {post.content && (
        <p className="text-[#222] text-[16px] leading-normal">{post.content}</p>
      )}

      {/* ── Media image ── */}
      {hasMedia && !isPoll && (
        <div className="w-full h-[200px] bg-[#232246] rounded-[12px] overflow-hidden">
          <img
            src={post.media_urls![0]} alt=""
            className="w-full h-full object-cover block"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* ── Event cover ── */}
      {isEvent && post.cover_image_url && (
        <div className="w-full h-[200px] bg-[#232246] rounded-[12px] overflow-hidden">
          <img src={post.cover_image_url} alt="" className="w-full h-full object-cover block" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}

      {/* ── Event info ── */}
      {isEvent && (
        <div className="bg-[#fff6ed] border border-[#ffeacc] rounded-xl px-4 py-2.5 flex flex-col gap-0.5">
          {post.event_title && <p className="text-[#222] text-[15px] font-semibold">{post.event_title}</p>}
          {post.start_date && <p className="text-[#8e8e8e] text-[13px]">{post.start_date}{post.start_time ? ` · ${post.start_time}` : ''}</p>}
        </div>
      )}

      {/* ── Poll ── */}
      {isPoll && (
        <div className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-3 flex flex-col gap-[30px]">
          {post.poll_question && (
            <p className="text-[#222] text-[16px]">{post.poll_question}</p>
          )}
          <div className="flex flex-col gap-2">
            {(post.poll_options ?? []).map(opt => {
              const pct = voted
                ? Math.round(((pollCounts[opt] ?? 0) / Math.max(totalVotes, 1)) * 100)
                : (POLL_WIDTHS[opt] ?? 0);
              const isVoted = voted === opt;
              const barWidth = voted ? `${Math.max(pct, 0)}%` : `${POLL_WIDTHS[opt] ?? 40}%`;

              return (
                <button
                  key={opt}
                  onClick={() => handleVote(opt)}
                  disabled={!!voted}
                  className={`relative h-[41px] rounded-full border border-[#ffeacc] bg-white text-left overflow-hidden ${voted ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {/* fill bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{ width: barWidth, background: 'rgba(255,148,0,0.2)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <span className={`text-[16px] text-[#222] relative z-10 ${isVoted ? 'font-medium' : 'font-light'}`}>{opt}</span>
                    {(voted || POLL_WIDTHS[opt]) && (
                      <span className="text-[14px] text-[#222] relative z-10">{pct}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer: stats + bookmark ── */}
      <div className="flex items-center justify-between">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLikeToggle(post.id, !isLiked)}
            className="flex items-center gap-1.5 group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? '#ff4757' : 'none'} stroke={isLiked ? '#ff4757' : '#8e8e8e'} strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <span className="text-[#8e8e8e] text-[16px]">{likesCount}</span>
          </button>
          <button
            onClick={() => onOpenPost(post)}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="1.8" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span className="text-[#8e8e8e] text-[16px]">{commentsCount}</span>
          </button>
        </div>

        {/* Green filled bookmark */}
        <button onClick={() => onUnsave(post.id)} title="Remove from saved" className="text-[#22c55e] hover:text-red-400 transition-colors">
          <svg width="16" height="20" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { title: string }> = {
  community: { title: 'My Community Posts' },
  discover:  { title: 'Saved Discover Posts' },
  learning:  { title: 'Learning Directory' },
  employment:{ title: 'Employment Hub' },
  seekers:   { title: 'Open To Work' },
};

export default function SavedCategoryPage() {
  const { category = 'discover' } = useParams<{ category: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [discoverPosts, setDiscoverPosts] = useState<SavedDiscoverSnapshot[]>([]);
  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);
  const [learningCourses, setLearningCourses] = useState<SavedLearningSnapshot[]>([]);
  const [employmentPostings, setEmploymentPostings] = useState<EmployerPosting[]>([]);
  const [seekerProfiles, setSeekerProfiles] = useState<SeekerProfile[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [connectedUserIds, setConnectedUserIds] = useState<Set<string>>(new Set());
  const [sentRequestUserIds, setSentRequestUserIds] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyPostId, setApplyPostId] = useState<string | null>(null);

  const meta = CATEGORY_META[category] ?? CATEGORY_META.discover;

  useEffect(() => {
    setLoading(true);
    if (category === 'discover') {
      fetchSavedDiscoverItems()
        .then(setDiscoverPosts)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (category === 'community') {
      fetchSavedCommunityPosts()
        .then(async (posts) => {
          setCommunityPosts(posts);
          if (posts.length > 0) {
            const ids = posts.map(p => p.id);
            const [liked, likesCts, commentCts, saved] = await Promise.all([
              fetchLikedPostIds().catch(() => new Set<string>()),
              fetchLikesCounts(ids).catch(() => ({} as Record<string, number>)),
              fetchCommentCounts(ids).catch(() => ({} as Record<string, number>)),
              fetchSavedPostIds().catch(() => new Set<string>()),
            ]);
            setLikedPostIds(liked);
            setLikesCounts(likesCts as Record<string, number>);
            setCommentCounts(commentCts as Record<string, number>);
            setSavedPostIds(saved);
          }
          // Fetch connections and sent requests for the person+ button
          const [connectionsRes, sentRes] = await Promise.all([
            fetchConnections().catch(() => ({ connections: [], total: 0 })),
            fetchSentRequests().catch(() => ({ requests: [] })),
          ]);
          setConnectedUserIds(new Set(connectionsRes.connections.map(c => c.id)));
          setSentRequestUserIds(new Set(sentRes.requests.map(r => r.id)));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (category === 'learning') {
      fetchSavedLearningCourses()
        .then(setLearningCourses)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (category === 'employment') {
      fetchSavedEmploymentPostings()
        .then(setEmploymentPostings)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (category === 'seekers') {
      fetchSavedSeekerProfiles()
        .then(setSeekerProfiles)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [category]);

  function handleDiscoverUnsave(id: string) {
    unsaveDiscoverItem(id).catch(() => {});
    setDiscoverPosts(prev => prev.filter(p => p.id !== id));
  }

  function handleCommunityUnsave(id: string) {
    unsavePost(id).catch(() => {});
    setCommunityPosts(prev => prev.filter(p => p.id !== id));
  }

  function handleLearningUnsave(id: string) {
    unsaveLearningCourse(id).catch(() => {});
    setLearningCourses(prev => prev.filter(c => c.id !== id));
  }

  function handleEmploymentUnsave(id: string) {
    unsaveEmploymentPosting(id).catch(() => {});
    setEmploymentPostings(prev => prev.filter(p => p.id !== id));
  }

  function handleSeekerUnsave(id: string) {
    unsaveSeekerProfile(id).catch(() => {});
    setSeekerProfiles(prev => prev.filter(p => p.id !== id));
  }

  function handlePostLikeToggle(postId: string, willLike: boolean) {
    setLikedPostIds(prev => {
      const next = new Set(prev);
      if (willLike) next.add(postId); else next.delete(postId);
      return next;
    });
    setLikesCounts(prev => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] ?? 0) + (willLike ? 1 : -1)),
    }));
    togglePostLike(postId, willLike).catch(() => {});
  }

  function handleSendRequest(userId: string) {
    setSentRequestUserIds(prev => new Set([...prev, userId]));
    sendConnectionRequest(userId).catch(() => {
      setSentRequestUserIds(prev => { const next = new Set(prev); next.delete(userId); return next; });
    });
  }

  function handlePostSaveToggle(postId: string, willSave: boolean) {
    setSavedPostIds(prev => {
      const next = new Set(prev);
      if (willSave) next.add(postId); else next.delete(postId);
      return next;
    });
    if (willSave) savePost(postId).catch(() => {}); else unsavePost(postId).catch(() => {});
  }

  function renderContent() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (category === 'discover') {
      if (discoverPosts.length === 0) {
        return (
          <div className="grid grid-cols-1">
            <EmptyState
              message="No saved discover posts"
              sub="Bookmark any opportunity on the Discover page and it will appear here."
            />
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          {discoverPosts.map(p => (
            <DiscoverCard
              key={p.id}
              post={p}
              onUnsave={handleDiscoverUnsave}
              onGetStarted={setApplyPostId}
            />
          ))}
        </div>
      );
    }

    if (category === 'community') {
      if (communityPosts.length === 0) {
        return (
          <div className="grid grid-cols-1">
            <EmptyState
              message="No saved community posts"
              sub='Click "Save" on any home feed post and it will appear here.'
            />
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {communityPosts.map(p => (
            <CommunityCard
              key={p.id}
              post={p}
              onUnsave={handleCommunityUnsave}
              isLiked={likedPostIds.has(p.id)}
              likesCount={likesCounts[p.id] ?? 0}
              commentsCount={commentCounts[p.id] ?? 0}
              onLikeToggle={handlePostLikeToggle}
              isConnected={!!p.user && connectedUserIds.has(p.user.id)}
              hasSentRequest={!!p.user && sentRequestUserIds.has(p.user.id)}
              onSendRequest={handleSendRequest}
              onOpenPost={setSelectedPost}
            />
          ))}
        </div>
      );
    }

    if (category === 'employment') {
      if (employmentPostings.length === 0) {
        return (
          <div className="grid grid-cols-1">
            <EmptyState
              message="No saved jobs"
              sub="Bookmark any job posting on the Employment Hub and it will appear here."
            />
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          {employmentPostings.map(p => (
            <EmploymentCard key={p.id} posting={p} onUnsave={handleEmploymentUnsave} />
          ))}
        </div>
      );
    }

    if (category === 'seekers') {
      if (seekerProfiles.length === 0) {
        return (
          <div className="grid grid-cols-1">
            <EmptyState
              message="No saved profiles"
              sub="Bookmark any Open To Work profile on the Employment Hub and it will appear here."
            />
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          {seekerProfiles.map(p => (
            <SeekerCard key={p.id} profile={p} onUnsave={handleSeekerUnsave} onView={(id) => navigate(`/employment-hub?seeker=${id}`)} />
          ))}
        </div>
      );
    }

    if (category === 'learning') {
      if (learningCourses.length === 0) {
        return (
          <div className="grid grid-cols-1">
            <EmptyState
              message="No saved courses"
              sub="Bookmark any course on the Learning Directory and it will appear here."
            />
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          {learningCourses.map(c => (
            <LearningCard key={c.id} course={c} onUnsave={handleLearningUnsave} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1">
        <EmptyState message="Coming soon" sub="This category will be available soon." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">

          {/* Back */}
          <button
            onClick={() => navigate('/saved')}
            className="flex items-center gap-3 text-[#565555] text-base font-medium hover:text-[#18191c] transition-colors mb-5"
          >
            <svg width="9" height="17" viewBox="0 0 9 17" fill="none">
              <path d="M8 1L1 8.5L8 16" stroke="#565555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Saved
          </button>

          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-black text-2xl font-medium tracking-[0.48px]">{meta.title}</h1>
            {!loading && category === 'discover' && discoverPosts.length > 0 && (
              <span className="bg-[#fff6ed] text-[#ff9400] text-sm font-semibold px-2.5 py-0.5 rounded-full">
                {discoverPosts.length}
              </span>
            )}
            {!loading && category === 'community' && communityPosts.length > 0 && (
              <span className="bg-[#fff6ed] text-[#ff9400] text-sm font-semibold px-2.5 py-0.5 rounded-full">
                {communityPosts.length}
              </span>
            )}
          </div>

          {renderContent()}

        </div>
      </div>

      {applyPostId && (
        <ApplyModal
          postId={applyPostId}
          postTitle={discoverPosts.find(p => p.id === applyPostId)?.title}
          onClose={() => setApplyPostId(null)}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isLiked={likedPostIds.has(selectedPost.id)}
          likesCount={likesCounts[selectedPost.id] ?? 0}
          onLikeToggle={handlePostLikeToggle}
          isSaved={savedPostIds.has(selectedPost.id)}
          onSaveToggle={handlePostSaveToggle}
          commentsCount={commentCounts[selectedPost.id] ?? 0}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
