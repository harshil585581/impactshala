import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import { cn } from '@/lib/cn';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import {
  fetchAllEmployerPostings,
  fetchAllSeekerProfiles,
  submitApplication,
  fetchApplicationsForPosting,
  updateApplicationStatus,
} from '../../services/employmentService';
import type {
  EmployerPosting,
  SeekerProfile,
  EmploymentApplication,
  ApplicationStatus,
} from '../../services/employmentService';
import {
  fetchSavedEmploymentPostingIds,
  saveEmploymentPosting,
  unsaveEmploymentPosting,
} from '../../services/savedService';
import type { Toast } from '../../types/profile';
import ToastContainer from '../../components/ui/Toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'hire' | 'work';

type Filters = {
  industry: string;
  jobType: string;
  workMode: string;
};

const EMPTY_FILTERS: Filters = { industry: '', jobType: '', workMode: '' };
const JOB_TYPES = ['Full Time', 'Part Time', 'Freelance', 'Contract'];
const WORK_MODES = ['Onsite', 'Remote', 'Hybrid'];
const CAREER_PILLS = ['Early Career', 'Mid Career', 'Senior Career'];
const PAGE_SIZE = 5;

const ALL_INDUSTRIES = [
  'Agriculture & Agribusiness',
  'Aerospace & Defense',
  'Architecture & Design',
  'Arts & Culture (Museums, Galleries)',
  'Automotive',
  'Banking & Finance',
  'Biotechnology',
  'Chemicals',
  'Consumer Electronics',
  'Construction',
  'Consulting Services',
  'Cyber Security',
  'Defense Manufacturing',
  'Digital Marketing & Advertising',
  'Education & EdTech',
  'Energy & Utilities',
  'Entertainment & Media',
  'Environmental Services & Sustainability',
  'Fashion & Apparel',
  'Fintech & Financial Services',
  'Food & Beverage',
  'Healthcare Services',
  'Hospitality & Tourism',
  'Human Resources & Staffing',
  'Information Technology (IT)',
  'Insurance',
  'Legal Services',
  'Logistics & Supply Chain',
  'Manufacturing',
  'Marine & Shipping',
  'Marketing & Advertising',
  'Medical Devices',
  'Metals & Mining',
  'Oil & Gas',
  'Packaging',
  'Pharmaceuticals',
  'Printing & Publishing',
  'Public Relations',
  'Real Estate',
  'Retail & E-Commerce',
  'Security & Investigations',
  'Software Development',
  'Sports Management & Recreational Services',
  'Social Work',
  'Technology Services',
  'Textiles & Apparel',
  'Transportation & Logistics',
  'Venture Capital & Private Equity',
  'Warehousing',
  'Wholesale Trade',
  'Others',
];

// ─── Tag pill ─────────────────────────────────────────────────────────────────

function Tag({ label }: { label: string | null | undefined }) {
  if (!label) return null;
  return (
    <span className="bg-[#fff3e0] text-[#f77f00] text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
      {label}
    </span>
  );
}

// ─── Skill pill ───────────────────────────────────────────────────────────────

function SkillPill({ label }: { label: string }) {
  return (
    <span className="text-[#f77f00] text-xs font-medium px-3 py-1.5 rounded-full border border-[#f77f00]/30 bg-[#fff8ee] whitespace-nowrap">
      {label}
    </span>
  );
}

// ─── Bookmark icon ────────────────────────────────────────────────────────────

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#f2f2f3] p-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded-full" />
      </div>
      <div className="flex gap-4 mt-4">
        {[100, 90, 80].map((w, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: w }} />
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        {[70, 60, 80].map((w, i) => (
          <div key={i} className="h-7 bg-gray-200 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="flex justify-between mt-3">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );
}

// ─── Smart media preview ──────────────────────────────────────────────────────

function MediaPreview({ src, className }: { src: string; className?: string }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(src);
  if (isImage) {
    return (
      <img
        src={src}
        alt="media"
        className={className}
        style={{ objectFit: 'cover' }}
      />
    );
  }
  return <video src={src} controls className={className} />;
}

// ─── Expanded-view helpers ────────────────────────────────────────────────────

function EField({
  label,
  value,
}: {
  label: string;
  value?: string | string[] | null;
}) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(', ') : value;
  if (!display.trim()) return null;
  return (
    <p className="text-sm text-[#18191c] leading-relaxed">
      <span className="font-medium">{label} :&nbsp; </span>
      {display}
    </p>
  );
}

function EBullets({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  const lines = value.trim().split('\n').filter(Boolean);
  if (lines.length <= 1) {
    return (
      <p className="text-sm text-[#18191c] leading-relaxed">
        <span className="font-medium">{label} :&nbsp; </span>
        {lines[0]}
      </p>
    );
  }
  return (
    <div>
      <p className="text-sm font-medium text-[#18191c] mb-1.5">{label} :</p>
      <ul className="list-disc list-outside ml-4 space-y-1">
        {lines.map((line, i) => (
          <li key={i} className="text-sm text-[#18191c] leading-relaxed">
            {line}
          </li>
        ))}
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

// ─── Employer expanded content ────────────────────────────────────────────────

function EmployerExpandedContent({
  posting,
  onApply,
}: {
  posting: EmployerPosting;
  onApply: () => void;
}) {
  const skills = posting.preferred_skillsets
    ? posting.preferred_skillsets.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div>
      <ESection title="Job Overview">
        <EField label="Organization" value={posting.org_name} />
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
            <span className="font-medium">Preferred Skillsets :&nbsp; </span>
            {skills.join(', ')}
          </p>
        )}
        {posting.eligibility_criteria?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-[#18191c] mb-1.5">Eligibility Criteria :</p>
            <ul className="list-disc list-outside ml-4 space-y-1">
              {posting.eligibility_criteria.map((c, i) => (
                <li key={i} className="text-sm text-[#18191c]">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {posting.required_documents?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-[#18191c] mb-1.5">Required Documents :</p>
            <ul className="list-disc list-outside ml-4 space-y-1">
              {posting.required_documents.map((d, i) => (
                <li key={i} className="text-sm text-[#18191c]">
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </ESection>

      <ESection title="Application Process">
        <EField label="Weekly Hours" value={posting.weekly_hours} />
        <EField label="Last Date to Apply" value={posting.last_date_to_apply} />
        <EField label="End Time" value={posting.end_time} />
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

      {posting.video_url && (
        <ESection title="Intro Video">
          <MediaPreview
            src={posting.video_url}
            className="w-full rounded-xl border border-[#e4e5e8] max-h-[220px] object-cover"
          />
        </ESection>
      )}

      {/* Apply CTA inside expanded view */}
      <div className="mt-5 pt-4 border-t border-[#f2f2f3]">
        <button
          type="button"
          onClick={onApply}
          className="bg-[#f77f00] text-white text-sm font-semibold px-8 h-10 rounded-full hover:bg-[#e68500] transition-colors"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
}

// ─── Seeker expanded content ──────────────────────────────────────────────────

function SeekerExpandedContent({ profile }: { profile: SeekerProfile }) {
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
        <EBullets
          label="Are you looking for a specific JD or open to dynamic roles?"
          value={profile.specific_jd}
        />
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
              <p className="text-sm text-[#18191c]">
                <span className="font-medium">Department :&nbsp; </span>
                {profile.department}
              </p>
            )}
            {profile.available_from && (
              <p className="text-sm text-[#18191c]">
                <span className="font-medium">Available From :&nbsp; </span>
                {profile.available_from}
              </p>
            )}
          </div>
        )}
        <EField label="Weekly Commitment" value={profile.weekly_commitment} />
      </ESection>

      <ESection title="Skills, Tools & Attributes">
        {profile.technical_skills?.length > 0 && (
          <p className="text-sm text-[#18191c]">
            <span className="font-medium">Top 3 Technical Skills :&nbsp; </span>
            {profile.technical_skills.join(', ')}
          </p>
        )}
        {profile.soft_skills?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-[#18191c] mb-1">
              Top 3 Soft Skills / Traits :
            </p>
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
            <a
              href={profile.portfolio_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f77f00] hover:underline break-all"
            >
              {profile.portfolio_link}
            </a>
          </p>
        )}
        {profile.profile_link && (
          <p className="text-sm text-[#18191c]">
            <span className="font-medium">Impactshaala / Profile Link :&nbsp; </span>
            <a
              href={profile.profile_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f77f00] hover:underline break-all"
            >
              {profile.profile_link}
            </a>
          </p>
        )}
        {profile.resume_url && (
          <p className="text-sm text-[#18191c]">
            <span className="font-medium">Resume :&nbsp; </span>
            <a
              href={profile.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f77f00] font-medium hover:underline"
            >
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
            <p className="text-sm font-medium text-[#18191c] mb-1">
              Specifically seeking for employer who is :
            </p>
            <p className="text-sm text-[#18191c]">{profile.seeking_employer_who}</p>
          </div>
        )}
        {profile.intro_video_url && (
          <div>
            <p className="text-sm font-medium text-[#18191c] mb-2">
              Intro Video / Culture Clip :
            </p>
            <MediaPreview
              src={profile.intro_video_url!}
              className="w-full rounded-xl border border-[#e4e5e8] max-h-[220px] object-cover"
            />
          </div>
        )}
      </ESection>
    </div>
  );
}

// ─── Employer Job Card ─────────────────────────────────────────────────────────

function EmployerJobCard({
  posting,
  onDetails,
  onApply,
  onViewApplicants,
  currentUserId,
  isSaved = false,
  onToggleSave,
}: {
  posting: EmployerPosting;
  onDetails: (p: EmployerPosting) => void;
  onApply: (p: EmployerPosting) => void;
  onViewApplicants?: (p: EmployerPosting) => void;
  currentUserId?: string;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}) {
  const isOwner = !!currentUserId && posting.user_id === currentUserId;
  const [expanded, setExpanded] = useState(false);
  const initial = posting.org_name?.[0]?.toUpperCase() ?? 'J';
  const skills = posting.preferred_skillsets
    ? posting.preferred_skillsets.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-white rounded-2xl border border-[#f2f2f3] p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-base shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#18191c] font-bold text-base leading-tight">
            {posting.job_title || 'Untitled Role'}
          </h3>
          <p className="text-[#6b6b6b] text-sm">{posting.org_name}</p>
          {posting.work_mode && (
            <p className="text-[#6b6b6b] text-sm">({posting.work_mode})</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              isOwner && onViewApplicants
                ? onViewApplicants(posting)
                : onDetails(posting)
            }
            className="bg-[#f77f00] text-white text-sm font-semibold px-5 h-10 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap"
          >
            {isOwner ? 'View Applicants' : 'Get Started'}
          </button>
          <button
            type="button"
            onClick={() => onToggleSave?.(posting.id)}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-full border transition-colors',
              isSaved
                ? 'border-[#f77f00] bg-[#fff8ee] text-[#f77f00]'
                : 'border-[#f2f2f3] text-[#f77f00] hover:bg-[#fff8ee]',
            )}
          >
            <BookmarkIcon filled={isSaved} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-3">
        {posting.career_level && (
          <span>
            <span className="text-[#f77f00] font-semibold">Exp - </span>
            <span className="text-[#18191c] font-semibold">{posting.career_level}</span>
          </span>
        )}
        {posting.compensation && (
          <span>
            <span className="text-[#f77f00] font-semibold">Salary - </span>
            <span className="text-[#18191c] font-semibold">{posting.compensation}</span>
          </span>
        )}
        {posting.job_type && (
          <span>
            <span className="text-[#f77f00] font-semibold">Type - </span>
            <span className="text-[#18191c] font-semibold">{posting.job_type}</span>
          </span>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[#f77f00] font-semibold text-sm">Skills -</span>
          {skills.slice(0, 4).map((s, i) => (
            <SkillPill key={i} label={s} />
          ))}
          {skills.length > 4 && (
            <span className="text-[#f77f00] text-xs font-medium">+{skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Expanded employer sections */}
      {expanded && (
        <EmployerExpandedContent posting={posting} onApply={() => onApply(posting)} />
      )}

      <div className="flex items-center justify-between text-sm pt-3 mt-2 border-t border-[#f2f2f3]">
        <span className="text-[#9f9f9f]">{timeAgo(posting.created_at)}</span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[#f77f00] font-medium hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  );
}

// ─── Seeker Profile Card ───────────────────────────────────────────────────────

function SeekerProfileCard({
  profile,
  onDetails,
  isSaved = false,
  onToggleSave,
}: {
  profile: SeekerProfile;
  onDetails: (p: SeekerProfile) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const initial = profile.name?.[0]?.toUpperCase() ?? 'U';
  const skills = profile.technical_skills ?? [];

  return (
    <div className="bg-white rounded-2xl border border-[#f2f2f3] p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#1d3557] flex items-center justify-center text-white font-bold text-base shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#18191c] font-bold text-base leading-tight">
            {profile.name || 'Anonymous'}
          </h3>
          <p className="text-[#6b6b6b] text-sm">{profile.job_industry}</p>
          {(profile.preferred_base_city || profile.preferred_work_mode) && (
            <p className="text-[#6b6b6b] text-sm">
              {[
                profile.preferred_base_city,
                profile.preferred_work_mode && `(${profile.preferred_work_mode})`,
              ]
                .filter(Boolean)
                .join(' ')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onDetails(profile)}
            className="bg-[#f77f00] text-white text-sm font-semibold px-5 h-10 rounded-full hover:bg-[#e68500] transition-colors whitespace-nowrap"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={() => onToggleSave?.(profile.id)}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-full border transition-colors',
              isSaved
                ? 'border-[#f77f00] bg-[#fff8ee] text-[#f77f00]'
                : 'border-[#f2f2f3] text-[#f77f00] hover:bg-[#fff8ee]',
            )}
          >
            <BookmarkIcon filled={isSaved} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-3">
        {profile.current_status && (
          <span>
            <span className="text-[#f77f00] font-semibold">Exp - </span>
            <span className="text-[#18191c] font-semibold">{profile.current_status}</span>
          </span>
        )}
        {profile.expected_salary && (
          <span>
            <span className="text-[#f77f00] font-semibold">Salary - </span>
            <span className="text-[#18191c] font-semibold">{profile.expected_salary}</span>
          </span>
        )}
        {profile.job_type && (
          <span>
            <span className="text-[#f77f00] font-semibold">Type - </span>
            <span className="text-[#18191c] font-semibold">{profile.job_type}</span>
          </span>
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
          {skills.slice(0, 4).map((s, i) => (
            <SkillPill key={i} label={s} />
          ))}
          {skills.length > 4 && (
            <span className="text-[#f77f00] text-xs font-medium">+{skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Expanded seeker sections */}
      {expanded && <SeekerExpandedContent profile={profile} />}

      <div className="flex items-center justify-between text-sm pt-3 mt-2 border-t border-[#f2f2f3]">
        <span className="text-[#9f9f9f]">{timeAgo(profile.created_at)}</span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[#f77f00] font-medium hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="h-8 px-3 rounded-full text-xs font-medium border border-[#e4e5e8] text-[#6b6b6b] hover:border-[#f77f00] hover:text-[#f77f00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="text-[#9f9f9f] text-xs px-1">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p as number)}
            className={cn(
              'w-8 h-8 rounded-full text-xs font-semibold transition-colors',
              page === p
                ? 'bg-[#f77f00] text-white'
                : 'border border-[#e4e5e8] text-[#6b6b6b] hover:border-[#f77f00] hover:text-[#f77f00]',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="h-8 px-3 rounded-full text-xs font-medium border border-[#e4e5e8] text-[#6b6b6b] hover:border-[#f77f00] hover:text-[#f77f00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// ─── Filter accordion item ─────────────────────────────────────────────────────

function FilterAccordionItem({
  label,
  isOpen,
  onToggle,
  options,
  selected,
  onSelect,
  getCount,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  getCount: (opt: string) => number;
}) {
  return (
    <div className="border-t border-[#f2f2f3] py-3">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between">
        <span className="text-sm font-medium text-[#18191c]">{label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')}
        >
          <path d="M6 9l6 6 6-6" stroke="#9f9f9f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-3 space-y-2.5 max-h-44 overflow-y-auto pr-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(selected === opt ? '' : opt)}
              className="w-full flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                    selected === opt
                      ? 'border-[#f77f00]'
                      : 'border-[#c7c7c7] group-hover:border-[#f77f00]/50',
                  )}
                >
                  {selected === opt && (
                    <span className="w-2 h-2 rounded-full bg-[#f77f00]" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs truncate',
                    selected === opt ? 'text-[#f77f00] font-medium' : 'text-[#18191c]',
                  )}
                >
                  {opt}
                </span>
              </div>
              <span className="bg-[#f77f00] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                {getCount(opt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail helpers ────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">{label}</span>
      <p className="text-sm text-[#18191c] mt-0.5">{value}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  const hasContent = Array.isArray(children)
    ? (children as React.ReactNode[]).some(Boolean)
    : !!children;
  if (!hasContent) return null;
  return (
    <div className="pt-4 mt-4 border-t border-[#f2f2f3]">
      <h4 className="text-sm font-bold text-[#18191c] mb-3">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ─── Employer Detail Modal ─────────────────────────────────────────────────────

function EmployerDetailModal({
  posting,
  onClose,
  onApply,
}: {
  posting: EmployerPosting;
  onClose: () => void;
  onApply: () => void;
}) {
  const initial = posting.org_name ? posting.org_name.charAt(0).toUpperCase() : 'O';

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-[#f2f2f3] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#f77f00] flex items-center justify-center text-white font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#18191c] truncate">
                {posting.job_title || 'Job Posting'}
              </h2>
              <p className="text-xs text-[#6b6b6b] truncate">{posting.org_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#6b6b6b] hover:text-[#18191c] hover:bg-[#f5f5f5] rounded-full transition-colors shrink-0 ml-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-2 mb-4">
            <Tag label={posting.industry} />
            <Tag label={posting.work_mode} />
            <Tag label={posting.job_type} />
            <Tag label={posting.career_level} />
            <Tag label={posting.department} />
          </div>

          <DetailSection title="Role Details">
            <DetailRow label="Role Type" value={posting.role_type} />
            <DetailRow label="Reporting To" value={posting.reporting_to} />
            <DetailRow label="Daily Tasks" value={posting.daily_tasks} />
            <DetailRow label="Training Support" value={posting.training_support} />
            <DetailRow label="Growth Potential" value={posting.growth_potential} />
          </DetailSection>

          <DetailSection title="Work Culture">
            <DetailRow label="Working Hours" value={posting.working_hours} />
            <DetailRow label="Leave Policy" value={posting.leave_policy} />
            <DetailRow label="Company Culture" value={posting.company_culture} />
            <DetailRow label="Diversity Practices" value={posting.diversity_practices} />
          </DetailSection>

          <DetailSection title="Compensation">
            <DetailRow label="Compensation" value={posting.compensation} />
            <DetailRow label="Payment Frequency" value={posting.payment_frequency} />
            <DetailRow label="Additional Perks" value={posting.additional_perks} />
          </DetailSection>

          <DetailSection title="Candidate Profile">
            <DetailRow label="Mandatory Attributes" value={posting.mandatory_attributes} />
            <DetailRow label="Preferred Skillsets" value={posting.preferred_skillsets} />
            {posting.eligibility_criteria?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">
                  Eligibility Criteria
                </span>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  {posting.eligibility_criteria.map((c, i) => (
                    <li key={i} className="text-sm text-[#18191c]">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {posting.required_documents?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">
                  Required Documents
                </span>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  {posting.required_documents.map((d, i) => (
                    <li key={i} className="text-sm text-[#18191c]">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DetailSection>

          <DetailSection title="Application Process">
            <DetailRow label="Weekly Hours" value={posting.weekly_hours} />
            <DetailRow label="Last Date to Apply" value={posting.last_date_to_apply} />
            <DetailRow label="End Time" value={posting.end_time} />
            <DetailRow label="Selection Process" value={posting.selection_process} />
          </DetailSection>

          {posting.faqs && posting.faqs.length > 0 && (
            <DetailSection title="FAQs">
              {posting.faqs.map((faq, i) => (
                <div key={i} className="bg-[#f9f9f9] rounded-xl p-3">
                  <p className="text-sm font-semibold text-[#18191c]">Q: {faq.q}</p>
                  {faq.a && <p className="text-sm text-[#6b6b6b] mt-1">A: {faq.a}</p>}
                </div>
              ))}
            </DetailSection>
          )}

          {posting.video_url && (
            <div className="pt-4 mt-4 border-t border-[#f2f2f3]">
              <h4 className="text-sm font-bold text-[#18191c] mb-3">Intro Video</h4>
              <MediaPreview
                src={posting.video_url}
                className="w-full rounded-xl border border-[#e4e5e8] max-h-[260px] object-cover"
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#f2f2f3] px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-[#9f9f9f]">Posted {timeAgo(posting.created_at)}</p>
          <button
            type="button"
            onClick={onApply}
            className="bg-[#f77f00] text-white text-sm font-semibold px-6 h-9 rounded-full hover:bg-[#e07000] transition-colors"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Seeker Detail Modal ───────────────────────────────────────────────────────

function SeekerDetailModal({
  profile,
  onClose,
}: {
  profile: SeekerProfile;
  onClose: () => void;
}) {
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : 'U';

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-[#f2f2f3] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#f77f00] flex items-center justify-center text-white font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#18191c] truncate">
                {profile.name || 'Seeker Profile'}
              </h2>
              <p className="text-xs text-[#6b6b6b] truncate">
                {[profile.job_industry, profile.current_status].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#6b6b6b] hover:text-[#18191c] hover:bg-[#f5f5f5] rounded-full transition-colors shrink-0 ml-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-2 mb-4">
            <Tag label={profile.preferred_work_mode} />
            <Tag label={profile.job_type} />
            <Tag label={profile.current_status} />
          </div>

          <DetailSection title="Personal Info">
            <DetailRow label="Current Location" value={profile.current_location} />
            <DetailRow label="Preferred Base City" value={profile.preferred_base_city} />
            <DetailRow label="Looking for Roles" value={profile.looking_for_roles} />
            <DetailRow label="Department" value={profile.department} />
          </DetailSection>

          <DetailSection title="Desired Role">
            <DetailRow label="Specific JD" value={profile.specific_jd} />
            <DetailRow label="Reporting Comfort" value={profile.reporting_comfort} />
            <DetailRow label="Training Expectation" value={profile.training_expectation} />
            <DetailRow label="Work Hours Flexibility" value={profile.work_hours_flexibility} />
            <DetailRow label="Leave Expectation" value={profile.leave_expectation} />
          </DetailSection>

          <DetailSection title="Compensation">
            <DetailRow label="Expected Salary" value={profile.expected_salary} />
            <DetailRow label="Open to Negotiation" value={profile.open_to_negotiation} />
            <DetailRow label="Available From" value={profile.available_from} />
            <DetailRow label="Weekly Commitment" value={profile.weekly_commitment} />
          </DetailSection>

          <DetailSection title="Skills">
            {profile.technical_skills?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">
                  Technical Skills
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {profile.technical_skills.map((s) => (
                    <Tag key={s} label={s} />
                  ))}
                </div>
              </div>
            )}
            {profile.soft_skills?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">
                  Soft Skills
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {profile.soft_skills.map((s) => (
                    <Tag key={s} label={s} />
                  ))}
                </div>
              </div>
            )}
            {profile.certifications?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">
                  Certifications
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {profile.certifications.map((s) => (
                    <Tag key={s} label={s} />
                  ))}
                </div>
              </div>
            )}
            <DetailRow label="Tools / Platforms" value={profile.tools_platforms} />
            {profile.portfolio_link && (
              <div>
                <span className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">
                  Portfolio
                </span>
                <a
                  href={profile.portfolio_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[#f77f00] hover:underline mt-0.5 break-all"
                >
                  {profile.portfolio_link}
                </a>
              </div>
            )}
            {profile.resume_url && (
              <a
                href={profile.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#fff3e0] text-[#f77f00] text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#ffe0b2] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Download Resume
              </a>
            )}
          </DetailSection>

          <DetailSection title="Culture & Values">
            <DetailRow label="Preferred Work Culture" value={profile.preferred_work_culture} />
            <DetailRow label="Seeking Employer Who" value={profile.seeking_employer_who} />
          </DetailSection>

          <DetailSection title="Human Touch">
            <DetailRow label="What Drives You" value={profile.work_drives_you} />
            <DetailRow label="Career Goals" value={profile.career_goals} />
            <DetailRow label="Special Notes" value={profile.special_notes} />
          </DetailSection>

          {profile.intro_video_url && (
            <div className="pt-4 mt-4 border-t border-[#f2f2f3]">
              <h4 className="text-sm font-bold text-[#18191c] mb-3">Intro Video</h4>
              <MediaPreview
                src={profile.intro_video_url}
                className="w-full rounded-xl border border-[#e4e5e8] max-h-[260px] object-cover"
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#f2f2f3] px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-[#9f9f9f]">Joined {timeAgo(profile.created_at)}</p>
          <button
            type="button"
            onClick={onClose}
            className="border border-[#f77f00] text-[#f77f00] text-sm font-semibold px-6 h-9 rounded-full hover:bg-[#fff8ee] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Apply Modal ───────────────────────────────────────────────────────────────

type ApplyStep = 1 | 2 | 3;

type ApplyForm = {
  name: string;
  email: string;
  mobile: string;
};

function FloatInput({
  label,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || !!value;
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=""
        className={cn(
          'w-full h-14 bg-white border rounded-lg px-4 text-sm text-[#18191c] focus:outline-none transition-colors',
          focused ? 'border-[#f77f00]' : 'border-[#c4c4c4]',
        )}
      />
      <span
        className="absolute left-3 pointer-events-none select-none px-1 bg-white transition-all duration-150"
        style={{
          top: lifted ? -10 : '50%',
          transform: lifted ? 'none' : 'translateY(-50%)',
          fontSize: lifted ? 11 : 14,
          color: focused ? '#f77f00' : lifted ? '#6b6b6b' : '#9f9f9f',
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ApplyModal({
  posting,
  onClose,
  addToast,
}: {
  posting: EmployerPosting;
  onClose: () => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}) {
  const [step, setStep] = useState<ApplyStep>(1);
  const [form, setForm] = useState<ApplyForm>({ name: '', email: '', mobile: '' });
  const [eligChecked, setEligChecked] = useState<boolean[]>([]);
  const [docFiles, setDocFiles] = useState<(File | null)[]>([]);
  const [message, setMessage] = useState('');
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setEligChecked((posting.eligibility_criteria ?? []).map(() => false));
    setDocFiles((posting.required_documents ?? []).map(() => null));
  }, [posting]);

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const step1Valid = form.name.trim() && form.email.trim();
  const hasElig = (posting.eligibility_criteria ?? []).length > 0;
  const step2Valid = !hasElig || eligChecked.every(Boolean);

  async function handleSubmit() {
    try {
      await submitApplication(posting.id, { ...form, message: message || undefined });
      addToast('success', 'Application submitted successfully!');
      onClose();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to submit application');
    }
  }

  const XBtn = (
    <button
      type="button"
      onClick={onClose}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors text-[#6b6b6b] hover:text-[#18191c]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Step 1 — Submit your application ── */}
        {step === 1 && (
          <div className="px-8 py-7">
            <h2 className="text-center text-[17px] font-semibold text-[#18191c] mb-7">
              Submit your application
            </h2>
            <div className="space-y-5">
              <FloatInput
                label="Name*"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <FloatInput
                label="Email*"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <FloatInput
                label="Mobile Number"
                type="tel"
                value={form.mobile}
                onChange={(v) => setForm((f) => ({ ...f, mobile: v }))}
              />
            </div>
            <div className="flex gap-3 mt-7">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 border border-[#f77f00] text-[#f77f00] text-sm font-semibold rounded-full hover:bg-[#fff8ee] transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="flex-1 h-11 bg-[#f77f00] text-white text-sm font-semibold rounded-full hover:bg-[#e07000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <p className="text-center text-xs text-[#6b6b6b] mt-4">
              By submitting this form, you agree to our{' '}
              <span className="text-[#f77f00] cursor-pointer hover:underline">
                Terms of Use and consent
              </span>{' '}
              t.
            </p>
          </div>
        )}

        {/* ── Step 2 — Eligibility criteria ── */}
        {step === 2 && (
          <>
            <div className="px-6 pt-5 pb-4 flex items-start gap-3">
              <p className="flex-1 text-sm font-medium text-[#18191c] leading-relaxed">
                Select the checkboxes below to confirm that you meet the eligibility criteria before applying:
              </p>
              {XBtn}
            </div>
            <div className="h-px bg-[#f2f2f3]" />
            <div className="px-6 py-3 max-h-[320px] overflow-y-auto">
              {!hasElig ? (
                <p className="text-sm text-[#9f9f9f] italic py-4">
                  No specific eligibility criteria for this posting.
                </p>
              ) : (
                <div className="divide-y divide-[#f2f2f3]">
                  {posting.eligibility_criteria.map((c, i) => (
                    <label key={i} className="flex items-center justify-between gap-4 py-3.5 cursor-pointer">
                      <span className="text-sm text-[#18191c] leading-snug">{c}</span>
                      <input
                        type="checkbox"
                        checked={eligChecked[i] ?? false}
                        onChange={(e) => {
                          const next = [...eligChecked];
                          next[i] = e.target.checked;
                          setEligChecked(next);
                        }}
                        className="shrink-0 w-5 h-5 accent-[#f77f00] cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="h-px bg-[#f2f2f3]" />
            <div className="px-6 py-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="border border-[#f77f00] text-[#f77f00] text-sm font-semibold px-7 h-10 rounded-full hover:bg-[#fff8ee] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!step2Valid}
                onClick={() => setStep(3)}
                className="bg-[#f77f00] text-white text-sm font-semibold px-8 h-10 rounded-full hover:bg-[#e07000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ── Step 3 — Upload documents ── */}
        {step === 3 && (
          <>
            <div className="px-6 pt-5 pb-4 flex items-start gap-3">
              <p className="flex-1 text-sm font-semibold text-[#18191c] leading-relaxed">
                Upload the documents listed below to complete your application. Ensure that all files are clear and legible.
              </p>
              {XBtn}
            </div>
            <div className="h-px bg-[#f2f2f3]" />
            <div className="px-6 py-3 max-h-[400px] overflow-y-auto">
              {(posting.required_documents ?? []).length === 0 ? (
                <p className="text-sm text-[#9f9f9f] italic py-4">
                  No specific documents required for this posting.
                </p>
              ) : (
                <div className="divide-y divide-[#f2f2f3]">
                  {posting.required_documents.map((docName, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 py-3.5">
                      <span className="text-sm text-[#18191c] leading-snug flex-1">{docName}</span>
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[i]?.click()}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors"
                        title={docFiles[i] ? docFiles[i]!.name : 'Attach file'}
                      >
                        {docFiles[i] ? (
                          <svg width="22" height="22" viewBox="0 0 32 38" fill="none">
                            <rect x="0" y="0" width="32" height="38" rx="4" fill="#e53935" />
                            <rect x="18" y="0" width="14" height="14" rx="2" fill="#b71c1c" />
                            <path d="M18 0l14 14H18V0z" fill="#ef5350" />
                            <rect x="4" y="18" width="24" height="3" rx="1.5" fill="white" opacity="0.9" />
                            <rect x="4" y="24" width="18" height="3" rx="1.5" fill="white" opacity="0.9" />
                            <rect x="4" y="30" width="20" height="3" rx="1.5" fill="white" opacity="0.9" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9199a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                          </svg>
                        )}
                      </button>
                      <input
                        ref={(el) => { fileInputRefs.current[i] = el; }}
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const next = [...docFiles];
                            next[i] = f;
                            setDocFiles(next);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Message */}
              <div className="pt-3 pb-1">
                <p className="text-sm font-semibold text-[#18191c] mb-2">Message</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                  placeholder="Write a short note if you want to share anything before applying"
                  rows={5}
                  className="w-full bg-white border border-[#e4e5e8] rounded-lg px-4 py-3 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors resize-none"
                />
                <p className="text-right text-xs text-[#9f9f9f] mt-1">
                  {message.length}/500 characters
                </p>
              </div>
            </div>
            <div className="h-px bg-[#f2f2f3]" />
            <div className="px-6 py-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="border border-[#f77f00] text-[#f77f00] text-sm font-semibold px-7 h-10 rounded-full hover:bg-[#fff8ee] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-[#f77f00] text-white text-sm font-semibold px-8 h-10 rounded-full hover:bg-[#e07000] transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ─── Applicants View ──────────────────────────────────────────────────────────

const APPLICANTS_PAGE_SIZE = 5;

function ApplicantsView({
  posting,
  applications,
  profiles,
  onBack,
  addToast,
}: {
  posting: EmployerPosting;
  applications: EmploymentApplication[];
  profiles: SeekerProfile[];
  onBack: () => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(applications[0]?.id ?? null);
  const [localApps, setLocalApps] = useState<EmploymentApplication[]>(applications);
  const [appPage, setAppPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    resume: false,
    eligibility: false,
    documents: false,
  });

  const initial = posting.org_name?.[0]?.toUpperCase() ?? 'J';
  const totalAppPages = Math.max(1, Math.ceil(localApps.length / APPLICANTS_PAGE_SIZE));
  const pagedApps = localApps.slice(
    (appPage - 1) * APPLICANTS_PAGE_SIZE,
    appPage * APPLICANTS_PAGE_SIZE,
  );
  const selectedApp = localApps.find((a) => a.id === selectedId) ?? null;
  const seekerProfile = selectedApp
    ? profiles.find((p) => p.user_id === selectedApp.applicant_id) ?? null
    : null;

  async function handleStatus(appId: string, status: ApplicationStatus) {
    try {
      await updateApplicationStatus(appId, status);
      setLocalApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
      addToast('success', 'Status updated');
    } catch {
      addToast('error', 'Failed to update status');
    }
  }

  const STATUS_LABELS: Record<ApplicationStatus, string> = {
    applied: 'Applied',
    not_a_fit: 'Not a fit',
    maybe: 'Maybe',
    goodfit: 'Goodfit',
  };

  return (
    <div>
      {/* Job posting header */}
      <div className="bg-white border border-[#e5e5e5] px-5 py-4 mb-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors text-[#6b6b6b] shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 12H5M12 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="w-[63px] h-[63px] rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-xl shrink-0">
              {initial}
            </div>
            <div>
              <h2 className="text-2xl font-normal text-black leading-tight">
                {posting.job_title || 'Untitled Role'}
              </h2>
              <p className="text-sm text-black">{posting.org_name}</p>
              {posting.work_mode && (
                <p className="text-sm text-black">({posting.work_mode})</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="text-[#05a12c]">Active</span>
              <span className="text-[#6e6e6e]">• Posted {timeAgo(posting.created_at)}</span>
            </div>
            <button
              type="button"
              className="border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-4 rounded-full hover:bg-[#fff8ee] transition-colors"
            >
              Manage Job
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#e5e5e5]" />

      {/* Two-column content */}
      <div className="flex gap-6 pt-5">
        {/* Left: applicant list */}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-normal text-black mb-4">
            Applicants ({localApps.length})
          </h3>
          {localApps.length === 0 ? (
            <div className="bg-white border border-[#e5e5e5] p-12 text-center text-[#6b6b6b] text-sm">
              No applications yet.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {pagedApps.map((app) => {
                  const isSelected = app.id === selectedId;
                  const appInitial = app.name?.[0]?.toUpperCase() ?? 'A';
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedId(app.id)}
                      className={cn(
                        'w-full text-left border border-[#e5e5e5] p-5 transition-colors',
                        isSelected ? 'bg-white' : 'bg-[#f8e1cb]',
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-[63px] h-[63px] rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-xl shrink-0">
                          {appInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-2xl font-normal text-black leading-tight">
                            {app.name}
                          </p>
                          {app.email && (
                            <p className="text-sm text-black">{app.email}</p>
                          )}
                          {app.mobile && (
                            <p className="text-sm text-black">{app.mobile}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="shrink-0 p-2 rounded hover:bg-black/5 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            width="4"
                            height="20"
                            viewBox="0 0 4 20"
                            fill="#6b6b6b"
                          >
                            <circle cx="2" cy="2" r="2" />
                            <circle cx="2" cy="10" r="2" />
                            <circle cx="2" cy="18" r="2" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-[#6e6e6e] text-sm font-semibold mt-3 ml-[79px]">
                        Applied {timeAgo(app.applied_at)}
                      </p>
                    </button>
                  );
                })}
              </div>
              <Pagination
                page={appPage}
                totalPages={totalAppPages}
                onPage={setAppPage}
              />
            </>
          )}
        </div>

        {/* Right: applicant detail */}
        {selectedApp ? (
          <div className="w-[533px] shrink-0 bg-white border border-[#e5e5e5] p-5 flex flex-col gap-6 self-start">
            {/* Header + status buttons */}
            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-[46px] h-[46px] rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-base shrink-0">
                  {selectedApp.name?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-normal text-black leading-tight">
                    {selectedApp.name}
                  </p>
                  {selectedApp.email && (
                    <p className="text-xs text-black">{selectedApp.email}</p>
                  )}
                  {selectedApp.mobile && (
                    <p className="text-xs text-black">{selectedApp.mobile}</p>
                  )}
                </div>
              </div>
              {(['not_a_fit', 'maybe', 'goodfit'] as ApplicationStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatus(selectedApp.id, s)}
                  className={cn(
                    'h-[30px] px-3 rounded-full text-xs whitespace-nowrap transition-colors shrink-0',
                    selectedApp.status === s
                      ? 'bg-[#f77f00] text-white'
                      : 'border border-[#f77f00] text-[#f77f00] hover:bg-[#fff8ee]',
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="h-px bg-[#e5e5e5]" />

            {/* Profile overview */}
            <div>
              <h4 className="text-base font-medium text-black mb-3">Profile Overview</h4>

              {selectedApp.message && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Message</p>
                  <p className="text-xs text-black leading-relaxed">{selectedApp.message}</p>
                </div>
              )}

              {seekerProfile ? (
                <>
                  {(seekerProfile.career_goals || seekerProfile.work_drives_you) && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Bio</p>
                      <p className="text-xs text-black leading-relaxed">
                        {seekerProfile.career_goals || seekerProfile.work_drives_you}
                      </p>
                    </div>
                  )}
                  {seekerProfile.looking_for_roles && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Looking For</p>
                      <p className="text-xs text-black leading-relaxed">
                        {seekerProfile.looking_for_roles}
                      </p>
                    </div>
                  )}
                  {(seekerProfile.current_location || seekerProfile.preferred_work_mode) && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Location / Mode</p>
                      <p className="text-xs text-black leading-relaxed">
                        {[seekerProfile.current_location, seekerProfile.preferred_work_mode]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  )}
                  {(seekerProfile.technical_skills?.length > 0 ||
                    seekerProfile.soft_skills?.length > 0) && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[#6e6e6e] mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          ...(seekerProfile.technical_skills ?? []),
                          ...(seekerProfile.soft_skills ?? []),
                        ]
                          .slice(0, 6)
                          .map((sk, i) => (
                            <span
                              key={i}
                              className="text-xs bg-[#fff3e0] text-[#f77f00] px-2 py-0.5 rounded-full"
                            >
                              {sk}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                !selectedApp.message && (
                  <p className="text-xs text-[#9f9f9f] italic">
                    No additional profile information available.
                  </p>
                )
              )}
            </div>

            {/* View Profile */}
            <button
              type="button"
              className="border border-[#f77f00] text-[#f77f00] text-sm font-medium h-[41px] px-4 rounded-full hover:bg-[#fff8ee] transition-colors w-full"
            >
              View Profile
            </button>

            {/* Collapsible: Resume */}
            <div>
              <button
                type="button"
                onClick={() => setExpanded((p) => ({ ...p, resume: !p.resume }))}
                className="w-full flex items-center justify-between h-[50px] border border-[#b4b4b4] rounded-sm px-4"
              >
                <span className="text-base font-medium text-black">Resume</span>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={cn('transition-transform', expanded.resume ? '' : 'rotate-180')}
                >
                  <path
                    d="M18 15l-6-6-6 6"
                    stroke="#6b6b6b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {expanded.resume && (
                <div className="border border-[#b4b4b4] border-t-0 rounded-b-sm">
                  {seekerProfile?.resume_url ? (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-[#0f172a]">Resume</span>
                      <a
                        href={seekerProfile.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-[#f77f00] text-[#f77f00] text-xs px-3 py-0.5 rounded-full hover:bg-[#fff8ee] transition-colors"
                      >
                        View
                      </a>
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-xs text-[#9f9f9f] italic">No resume uploaded</p>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible: Eligibility */}
            <div>
              <button
                type="button"
                onClick={() => setExpanded((p) => ({ ...p, eligibility: !p.eligibility }))}
                className="w-full flex items-center justify-between h-[50px] border border-[#b4b4b4] rounded-sm px-4"
              >
                <span className="text-base font-medium text-black">Eligibility</span>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={cn(
                    'transition-transform',
                    expanded.eligibility ? '' : 'rotate-180',
                  )}
                >
                  <path
                    d="M18 15l-6-6-6 6"
                    stroke="#6b6b6b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {expanded.eligibility && (
                <div className="border border-[#b4b4b4] border-t-0 rounded-b-sm">
                  {(posting.eligibility_criteria ?? []).length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[#9f9f9f] italic">
                      No eligibility criteria
                    </p>
                  ) : (
                    <div className="divide-y divide-[#f2f2f3]">
                      {posting.eligibility_criteria.map((c, i) => (
                        <p key={i} className="px-4 py-2 text-xs text-[#0f172a]">
                          {c}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible: Documents */}
            <div>
              <button
                type="button"
                onClick={() => setExpanded((p) => ({ ...p, documents: !p.documents }))}
                className="w-full flex items-center justify-between h-[50px] border border-[#b4b4b4] rounded-sm px-4"
              >
                <span className="text-base font-medium text-black">Documents</span>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={cn(
                    'transition-transform',
                    expanded.documents ? '' : 'rotate-180',
                  )}
                >
                  <path
                    d="M18 15l-6-6-6 6"
                    stroke="#6b6b6b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {expanded.documents && (
                <div className="border border-[#b4b4b4] border-t-0 rounded-b-sm py-3">
                  {(posting.required_documents ?? []).length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[#9f9f9f] italic">
                      No documents required
                    </p>
                  ) : (
                    <div className="divide-y divide-[#f2f2f3]">
                      {posting.required_documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2">
                          <span className="text-xs text-[#0f172a]">{doc}</span>
                          <span className="border border-[#f77f00] text-[#f77f00] text-xs px-3 py-0.5 rounded-full">
                            Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          localApps.length > 0 && (
            <div className="w-[533px] shrink-0 bg-white border border-[#e5e5e5] p-12 flex items-center justify-center text-[#6b6b6b] text-sm">
              Select an applicant to view details
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EmploymentHubDiscoveryPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('hire');
  const [careerLevel, setCareerLevel] = useState('');

  // Pending = what's selected in the filter UI; applied = actually used for filtering
  const [pendingFilters, setPendingFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterSectionOpen, setFilterSectionOpen] = useState({
    industry: false,
    jobType: false,
    workMode: false,
  });
  const [showHelpBox, setShowHelpBox] = useState(true);

  const [postings, setPostings] = useState<EmployerPosting[]>([]);
  const [profiles, setProfiles] = useState<SeekerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [detailPosting, setDetailPosting] = useState<EmployerPosting | null>(null);
  const [detailProfile, setDetailProfile] = useState<SeekerProfile | null>(null);
  const [applyPosting, setApplyPosting] = useState<EmployerPosting | null>(null);

  const [applicantsView, setApplicantsView] = useState<{
    posting: EmployerPosting;
    applications: EmploymentApplication[];
  } | null>(null);

  const currentUserId: string = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') ?? '{}')?.id ?? '';
    } catch {
      return '';
    }
  })();

  async function handleViewApplicants(posting: EmployerPosting) {
    try {
      const apps = await fetchApplicationsForPosting(posting.id);
      setApplicantsView({ posting, applications: apps });
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load applicants');
    }
  }

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [toasts, setToasts] = useState<Toast[]>([]);
  function addToast(type: Toast['type'], message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function handleToggleSave(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        unsaveEmploymentPosting(id).catch(() => {});
        addToast('info', 'Removed from saved');
      } else {
        next.add(id);
        saveEmploymentPosting(id).catch(() => {});
        addToast('success', 'Saved successfully');
      }
      return next;
    });
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllEmployerPostings(), fetchAllSeekerProfiles()])
      .then(([p, s]) => {
        setPostings(p);
        setProfiles(s);
      })
      .catch((err) =>
        addToast('error', err instanceof Error ? err.message : 'Failed to load data'),
      )
      .finally(() => setLoading(false));

    fetchSavedEmploymentPostingIds()
      .then(setSavedIds)
      .catch(() => {});
  }, []);

  // Auto-open apply modal when navigated with ?apply=<jobId>
  useEffect(() => {
    const applyId = searchParams.get('apply');
    if (!applyId || postings.length === 0) return;
    const match = postings.find(p => p.id === applyId);
    if (match) {
      setApplyPosting(match);
      setSearchParams(prev => { prev.delete('apply'); return prev; }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postings, searchParams]);

  useEffect(() => {
    setPage(1);
  }, [tab, appliedFilters, careerLevel]);

  const filteredPostings = postings.filter((p) => {
    if (
      careerLevel &&
      !p.career_level?.toLowerCase().includes(careerLevel.toLowerCase().split(' ')[0])
    )
      return false;
    if (appliedFilters.industry && p.industry !== appliedFilters.industry) return false;
    if (appliedFilters.jobType && p.job_type !== appliedFilters.jobType) return false;
    if (appliedFilters.workMode && p.work_mode !== appliedFilters.workMode) return false;
    return true;
  });

  const filteredProfiles = profiles.filter((p) => {
    if (appliedFilters.industry && p.job_industry !== appliedFilters.industry) return false;
    if (appliedFilters.jobType && p.job_type !== appliedFilters.jobType) return false;
    if (appliedFilters.workMode && p.preferred_work_mode !== appliedFilters.workMode) return false;
    return true;
  });

  const activeList = tab === 'hire' ? filteredPostings : filteredProfiles;
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const pagedItems = activeList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Count helpers — use the full unfiltered list for filter badge counts
  const fullList = tab === 'hire' ? postings : profiles;

  function industryCount(ind: string) {
    return fullList.filter((p) =>
      tab === 'hire'
        ? (p as EmployerPosting).industry === ind
        : (p as SeekerProfile).job_industry === ind,
    ).length;
  }
  function jobTypeCount(jt: string) {
    return fullList.filter((p) => p.job_type === jt).length;
  }
  function workModeCount(wm: string) {
    return fullList.filter((p) =>
      tab === 'hire'
        ? (p as EmployerPosting).work_mode === wm
        : (p as SeekerProfile).preferred_work_mode === wm,
    ).length;
  }

  // Use the full static industry list so all options are always visible in the filter

  function applyFilters() {
    setAppliedFilters({ ...pendingFilters });
  }
  function resetFilters() {
    setPendingFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setCareerLevel('');
  }

  const hasActiveFilters =
    appliedFilters.industry || appliedFilters.jobType || appliedFilters.workMode || careerLevel;

  return (
    <div className="min-h-screen bg-[#f5f5f5] overflow-x-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px]">
        {applicantsView ? (
          <div className="px-4 sm:px-6 py-6">
            <ApplicantsView
              posting={applicantsView.posting}
              applications={applicantsView.applications}
              profiles={profiles}
              onBack={() => setApplicantsView(null)}
              addToast={addToast}
            />
          </div>
        ) : (
        <div className="px-4 sm:px-6 py-6">
          <div className="flex gap-5 items-start">

            {/* ── Left: tabs + career pills + cards ── */}
            <div className="flex-1 min-w-0">

              {/* Tab switcher */}
              <div className="flex border-b border-[#e4e5e8] mb-4">
                <button
                  type="button"
                  onClick={() => { setTab('hire'); setCareerLevel(''); }}
                  className={cn(
                    'px-6 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
                    tab === 'hire'
                      ? 'border-[#f77f00] text-[#f77f00]'
                      : 'border-transparent text-[#6b6b6b] hover:text-[#18191c]',
                  )}
                >
                  Open To Hire
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('work'); setCareerLevel(''); }}
                  className={cn(
                    'px-6 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
                    tab === 'work'
                      ? 'border-[#f77f00] text-[#f77f00]'
                      : 'border-transparent text-[#6b6b6b] hover:text-[#18191c]',
                  )}
                >
                  Open To Work
                </button>
              </div>

              {/* Career level quick-filter pills (hire tab only) */}
              {tab === 'hire' && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {CAREER_PILLS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCareerLevel((v) => (v === lvl ? '' : lvl))}
                      className={cn(
                        'px-5 py-2 text-sm font-semibold rounded-full border transition-colors',
                        careerLevel === lvl
                          ? 'bg-[#f77f00] text-white border-[#f77f00]'
                          : 'bg-white text-[#f77f00] border-[#f77f00] hover:bg-[#fff8ee]',
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              )}

              {/* Cards */}
              {loading ? (
                <div className="space-y-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : pagedItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#f2f2f3] p-12 flex flex-col items-center justify-center">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-[#d1d5db] mb-4"
                  >
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                    <path
                      d="M21 21l-4.35-4.35"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p className="text-[#6b6b6b] text-sm font-medium mb-1">No results found</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-2 text-[#f77f00] text-xs font-semibold hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {tab === 'hire'
                      ? (pagedItems as EmployerPosting[]).map((p) => (
                          <EmployerJobCard
                            key={p.id}
                            posting={p}
                            onDetails={setDetailPosting}
                            onApply={setApplyPosting}
                            onViewApplicants={handleViewApplicants}
                            currentUserId={currentUserId}
                            isSaved={savedIds.has(p.id)}
                            onToggleSave={handleToggleSave}
                          />
                        ))
                      : (pagedItems as SeekerProfile[]).map((p) => (
                          <SeekerProfileCard
                            key={p.id}
                            profile={p}
                            onDetails={setDetailProfile}
                            isSaved={savedIds.has(p.id)}
                            onToggleSave={handleToggleSave}
                          />
                        ))}
                  </div>
                  <Pagination page={page} totalPages={totalPages} onPage={setPage} />
                </>
              )}
            </div>

            {/* ── Right panel ── */}
            <div className="hidden lg:flex flex-col gap-4 w-[280px] xl:w-[300px] shrink-0 sticky top-[90px] self-start">

              {/* Create Post */}
              <button
                type="button"
                onClick={() =>
                  navigate(
                    tab === 'hire' ? '/employment-hub/employer' : '/employment-hub/seeker',
                  )
                }
                className="w-full bg-[#f77f00] text-white font-semibold text-sm h-11 rounded-full hover:bg-[#e68500] transition-colors shadow-md"
              >
                Create Post
              </button>

              {/* Filter card */}
              <div className="bg-white rounded-2xl border border-[#f2f2f3] p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#18191c] font-bold text-base">Filter</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-[#18191c]"
                  >
                    <polygon
                      points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>

                <FilterAccordionItem
                  label="Industry"
                  isOpen={filterSectionOpen.industry}
                  onToggle={() =>
                    setFilterSectionOpen((s) => ({ ...s, industry: !s.industry }))
                  }
                  options={ALL_INDUSTRIES}
                  selected={pendingFilters.industry}
                  onSelect={(v) => setPendingFilters((f) => ({ ...f, industry: v }))}
                  getCount={industryCount}
                />
                <FilterAccordionItem
                  label="Job Type"
                  isOpen={filterSectionOpen.jobType}
                  onToggle={() =>
                    setFilterSectionOpen((s) => ({ ...s, jobType: !s.jobType }))
                  }
                  options={JOB_TYPES}
                  selected={pendingFilters.jobType}
                  onSelect={(v) => setPendingFilters((f) => ({ ...f, jobType: v }))}
                  getCount={jobTypeCount}
                />
                <FilterAccordionItem
                  label="Work Mode"
                  isOpen={filterSectionOpen.workMode}
                  onToggle={() =>
                    setFilterSectionOpen((s) => ({ ...s, workMode: !s.workMode }))
                  }
                  options={WORK_MODES}
                  selected={pendingFilters.workMode}
                  onSelect={(v) => setPendingFilters((f) => ({ ...f, workMode: v }))}
                  getCount={workModeCount}
                />

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="flex-1 bg-[#f77f00] text-white h-10 rounded-full text-sm font-semibold hover:bg-[#e68500] transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex-1 border border-[#e4e5e8] text-[#6b6b6b] h-10 rounded-full text-sm font-semibold hover:bg-[#f5f5f5] transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Help Box */}
              {showHelpBox && (
                <div className="bg-white rounded-2xl border border-[#f2f2f3] p-5 relative">
                  <button
                    type="button"
                    onClick={() => setShowHelpBox(false)}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-[#6b6b6b] hover:text-[#18191c] rounded-full hover:bg-[#f5f5f5] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📖</span>
                    <span className="font-bold text-[#f77f00]">Help Box</span>
                  </div>
                  <p className="text-sm text-[#6b6b6b] mb-4">
                    Not able to find what you're looking for? Let us help you.
                  </p>
                  <button
                    type="button"
                    className="bg-[#f77f00] text-white text-sm font-semibold h-9 px-6 rounded-full hover:bg-[#e68500] transition-colors"
                  >
                    Click Here
                  </button>
                </div>
              )}

              {/* Course card */}
              <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">
                <div className="bg-[#1a1a2e] text-center py-5 px-4">
                  <p className="text-white font-bold text-xl">Figma Design</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Learn &amp; Explore more at impactshala.com
                  </p>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-[#18191c] text-sm mb-2">
                    UI/UX Certification Course
                  </p>
                  <span className="inline-block bg-[#fff3e0] text-[#f77f00] text-xs font-medium px-3 py-1 rounded-full mb-2">
                    Onsite
                  </span>
                  <p className="text-[#6b6b6b] text-xs leading-relaxed mb-4 line-clamp-3">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi.
                    Vivamus ac tellus nec velit finibus egestas.
                  </p>
                  <button
                    type="button"
                    className="w-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold h-9 rounded-full hover:bg-[#fff8ee] transition-colors"
                  >
                    Know More
                  </button>
                  <div className="flex justify-center gap-2 mt-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f77f00]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e4e5e8]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e4e5e8]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Modals */}
      {detailPosting && (
        <EmployerDetailModal
          posting={detailPosting}
          onClose={() => setDetailPosting(null)}
          onApply={() => {
            setApplyPosting(detailPosting);
            setDetailPosting(null);
          }}
        />
      )}
      {detailProfile && (
        <SeekerDetailModal profile={detailProfile} onClose={() => setDetailProfile(null)} />
      )}
      {applyPosting && (
        <ApplyModal
          posting={applyPosting}
          onClose={() => setApplyPosting(null)}
          addToast={addToast}
        />
      )}
    </div>
  );
}
