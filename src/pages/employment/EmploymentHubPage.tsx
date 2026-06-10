import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import { cn } from '@/lib/cn';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useProfile } from '../../hooks/useProfile';
import { createEmployerPosting } from '../../services/employmentService';
import type { Toast } from '../../types/profile';
import ToastContainer from '../../components/ui/Toast';
import {
  type Visibility,
  FieldLabel, TextInput, SelectDropdown, IndustrySelectorGrid,
  ProgressBar, VisibilityToggle, RightPanel,
} from './shared';

// ─── Role toggle ──────────────────────────────────────────────────────────────

function RoleToggle() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 mb-5 p-1 bg-[#f5f5f5] rounded-full w-fit">
      <button type="button" className="px-5 h-9 rounded-full text-sm font-semibold bg-[#f77f00] text-white shadow-sm">
        Employer
      </button>
      <button
        type="button"
        onClick={() => navigate('/employment-hub/seeker')}
        className="px-5 h-9 rounded-full text-sm font-medium text-[#6b6b6b] hover:bg-white transition-colors"
      >
        Job Seeker
      </button>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
const CAREER_LEVELS = ['Entry Level', 'Junior Level', 'Mid Level', 'Senior Level', 'Manager', 'Executive'];
const WORK_MODES = ['Remote', 'Onsite', 'Hybrid'];
const REPORTING_TO_OPTIONS = ['CEO / Founder', 'Direct Manager', 'Team Lead', 'Multiple Mentors', 'Department Head'];
const TRAINING_SUPPORT_OPTIONS = ['No formal training', 'Mentorship provided', 'Structured training provided'];
const WORKING_HOURS_OPTIONS = ['Fixed Hours', 'Flexible Hours', 'Shift-based', 'Hybrid Flexibility'];
const PAYMENT_FREQUENCIES = ['Monthly', 'Weekly', 'Bi-weekly', 'Annual / CTC', 'Project-based'];

const STEP_TITLES = [
  '1 of 7: Basic Details',
  '2 of 7: Role Clarity & Working Environment',
  '3 of 7: Work Culture & Flexibility',
  '4 of 7: Compensation & Benefits',
  '5 of 7: Ideal Candidate Profile',
  '6 of 7: Commitment & Application Process',
  '7 of 7: Showcase & Build Trust (Optional but Valuable)',
  'Preview your application',
];

const STEP_PROGRESS = [0, 14, 29, 43, 57, 71, 86, 100];

// ─── Types ────────────────────────────────────────────────────────────────────

type AMPM = 'AM' | 'PM';
type FAQ = { q: string; a: string };

type FormData = {
  jobTitle: string; orgName: string; department: string;
  industry: string; jobType: string; careerLevel: string; workMode: string;
  roleType: string; reportingTo: string; dailyTasks: string;
  trainingSupport: string; growthPotential: string;
  workingHours: string; leavePolicy: string;
  companyCulture: string; diversityPractices: string;
  compensation: string; paymentFrequency: string; additionalPerks: string;
  mandatoryAttributes: string; preferredSkillsets: string;
  eligibilityCriteria: string[]; requiredDocuments: string[];
  weeklyHours: string; lastDateToApply: string;
  endTimeHH: string; endTimeMM: string; endTimeAMPM: AMPM;
  selectionProcess: string;
  faqs: FAQ[];
};

const initialForm: FormData = {
  jobTitle: '', orgName: '', department: '',
  industry: '', jobType: '', careerLevel: '', workMode: '',
  roleType: '', reportingTo: '', dailyTasks: '',
  trainingSupport: '', growthPotential: '',
  workingHours: '', leavePolicy: '',
  companyCulture: '', diversityPractices: '',
  compensation: '', paymentFrequency: '', additionalPerks: '',
  mandatoryAttributes: '', preferredSkillsets: '',
  eligibilityCriteria: ['', ''], requiredDocuments: ['', ''],
  weeklyHours: '', lastDateToApply: '',
  endTimeHH: '00', endTimeMM: '00', endTimeAMPM: 'AM',
  selectionProcess: '',
  faqs: [],
};

// ─── Repeatable list fields ───────────────────────────────────────────────────

function RepeatableFields({
  label, values, onChange, placeholder,
}: {
  label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  function update(i: number, v: string) {
    const next = [...values]; next[i] = v; onChange(next);
  }
  function remove(i: number) { onChange(values.filter((_, idx) => idx !== i)); }
  function add() { onChange([...values, '']); }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        {values.map((val, i) => {
          const isLast = i === values.length - 1;
          return (
            <div key={i} className="flex items-center gap-3">
              <input
                value={val}
                onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder ?? 'Enter here'}
                className="flex-1 h-12 bg-white border border-[#e4e5e8] rounded-full px-4 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors"
              />
              {isLast ? (
                <button
                  type="button"
                  onClick={add}
                  className="flex items-center gap-1.5 bg-[#fff3e0] text-[#f77f00] text-sm font-semibold px-4 h-12 rounded-full hover:bg-[#ffe0b2] transition-colors shrink-0 whitespace-nowrap"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#f77f00" strokeWidth="1.5" />
                    <path d="M12 8v8M8 12h8" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Add
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-sm font-semibold text-red-500 hover:text-red-600 px-2 shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ form, set, errors }: { form: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextInput label="Job Title" value={form.jobTitle} onChange={(v) => set('jobTitle', v)} placeholder="Enter your job title" error={errors.jobTitle} />
        <TextInput label="Organization Name" value={form.orgName} onChange={(v) => set('orgName', v)} placeholder="Enter your organization name" error={errors.orgName} />
      </div>

      <TextInput
        label="Department"
        value={form.department}
        onChange={(v) => set('department', v)}
        placeholder="Enter your department name E.g., (Product, Sales, Marketing, Operations)"
      />

      <div>
        <FieldLabel>Select Job Industry</FieldLabel>
        <IndustrySelectorGrid value={form.industry} onChange={(v) => set('industry', v)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectDropdown label="Job Type" value={form.jobType} options={JOB_TYPES} placeholder="Select your job type" onChange={(v) => set('jobType', v)} />
        <SelectDropdown label="Career Level" value={form.careerLevel} options={CAREER_LEVELS} placeholder="Select your career level" onChange={(v) => set('careerLevel', v)} />
      </div>

      <SelectDropdown label="Work Mode" value={form.workMode} options={WORK_MODES} placeholder="Select your work mode" onChange={(v) => set('workMode', v)} />
    </div>
  );
}

function Step2({ form, set }: { form: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextInput
          label="Is the role fixed or dynamic?"
          value={form.roleType}
          onChange={(v) => set('roleType', v)}
          placeholder="Enter your role fixed or dynamic"
        />
        <SelectDropdown
          label="Who will the candidate report to?"
          value={form.reportingTo}
          options={REPORTING_TO_OPTIONS}
          placeholder="Enter your report to"
          onChange={(v) => set('reportingTo', v)}
        />
      </div>

      <TextInput
        label="Day-to-Day Sample Tasks"
        value={form.dailyTasks}
        onChange={(v) => set('dailyTasks', v)}
        placeholder="E.g. Showcase typical tasks or problems solved"
      />

      <SelectDropdown
        label="Training Support"
        value={form.trainingSupport}
        options={TRAINING_SUPPORT_OPTIONS}
        placeholder="Select your training support"
        onChange={(v) => set('trainingSupport', v)}
      />

      <TextInput
        label="Employee Growth Potential"
        value={form.growthPotential}
        onChange={(v) => set('growthPotential', v)}
        placeholder={`E.g., You'll lead projects within 3 months if you perform well."`}
      />
    </div>
  );
}

function Step3({ form, set }: { form: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-6">
      <SelectDropdown
        label="Working Hours Flexibility"
        value={form.workingHours}
        options={WORKING_HOURS_OPTIONS}
        placeholder="Enter your working hours flexibility"
        onChange={(v) => set('workingHours', v)}
      />

      <TextInput
        label="Leave Flexibility & Policy"
        value={form.leavePolicy}
        onChange={(v) => set('leavePolicy', v)}
        placeholder="Eg. Give realistic picture: How many leaves?  Emergency time off?"
      />

      <TextInput
        label="Company Culture Snapshot"
        value={form.companyCulture}
        onChange={(v) => set('companyCulture', v)}
        placeholder="E.g., Flat hierarchy, Outcome-driven, Peer-led learning"
      />

      <TextInput
        label="Diversity or Inclusion Practices"
        value={form.diversityPractices}
        onChange={(v) => set('diversityPractices', v)}
        placeholder="Describe any diversity or inclusion practices"
      />
    </div>
  );
}

function Step4({ form, set }: { form: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextInput
          label="Compensation"
          value={form.compensation}
          onChange={(v) => set('compensation', v)}
          placeholder="Enter your compensation"
        />
        <SelectDropdown
          label="Payment Frequency"
          value={form.paymentFrequency}
          options={PAYMENT_FREQUENCIES}
          placeholder="Enter your Payment Frequency"
          onChange={(v) => set('paymentFrequency', v)}
        />
      </div>

      <TextInput
        label="Any Additional Perks or Benefits"
        value={form.additionalPerks}
        onChange={(v) => set('additionalPerks', v)}
        placeholder="Enter any additional perks or benefits"
      />
    </div>
  );
}

function Step5({ form, set }: { form: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextInput
          label="Mandatory Attributes"
          value={form.mandatoryAttributes}
          onChange={(v) => set('mandatoryAttributes', v)}
          placeholder="Enter your Mandatory Attributes"
        />
        <TextInput
          label="Preferred Educational Background or Skillsets"
          value={form.preferredSkillsets}
          onChange={(v) => set('preferredSkillsets', v)}
          placeholder="Enter your Skillsets"
        />
      </div>

      <RepeatableFields
        label="Mention the eligibility criteria ( If applicable )"
        values={form.eligibilityCriteria}
        onChange={(v) => set('eligibilityCriteria', v)}
        placeholder="Enter your criteria"
      />

      <RepeatableFields
        label="Document to be attached by applicant (If any)"
        values={form.requiredDocuments}
        onChange={(v) => set('requiredDocuments', v)}
        placeholder="Enter document name"
      />
    </div>
  );
}

function Step6({ form, set }: { form: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-6">
      <TextInput
        label="Expected Weekly Hours"
        value={form.weeklyHours}
        onChange={(v) => set('weeklyHours', v)}
        placeholder="Enter your Expected Weekly Hours"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel>Last Date to Apply</FieldLabel>
          <div className="relative">
            <input
              type="date"
              value={form.lastDateToApply}
              onChange={(e) => set('lastDateToApply', e.target.value)}
              className="w-full h-12 bg-white border border-[#e4e5e8] rounded-full px-4 pr-12 text-sm text-[#18191c] focus:outline-none focus:border-[#f77f00] transition-colors appearance-none cursor-pointer"
              style={{ colorScheme: 'light' }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#9f9f9f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="#9f9f9f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <FieldLabel>End Time</FieldLabel>
          <div className="h-12 bg-white border border-[#e4e5e8] rounded-full flex items-center px-4 gap-1">
            <input
              type="text"
              value={form.endTimeHH}
              onChange={(e) => set('endTimeHH', e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="00"
              maxLength={2}
              className="w-7 text-center text-sm text-[#18191c] focus:outline-none bg-transparent"
            />
            <span className="text-[#9f9f9f] font-medium">:</span>
            <input
              type="text"
              value={form.endTimeMM}
              onChange={(e) => set('endTimeMM', e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="00"
              maxLength={2}
              className="w-7 text-center text-sm text-[#18191c] focus:outline-none bg-transparent"
            />
            <div className="flex items-center gap-1 ml-auto">
              {(['AM', 'PM'] as AMPM[]).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => set('endTimeAMPM', period)}
                  className={cn(
                    'px-3 h-8 rounded-full text-xs font-semibold transition-colors',
                    form.endTimeAMPM === period ? 'bg-[#f77f00] text-white' : 'text-[#6b6b6b] hover:bg-[#fff8ee]',
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TextInput
        label="Selection Process"
        value={form.selectionProcess}
        onChange={(v) => set('selectionProcess', v)}
        placeholder="Enter your Selection Process"
      />
    </div>
  );
}

// ─── Step 7: Upload + FAQs ────────────────────────────────────────────────────

function UploadZone({ file, onFile }: { file: File | null; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={cn(
        'border border-[#e4e5e8] rounded-2xl flex flex-col items-center justify-center py-10 cursor-pointer transition-colors bg-white',
        dragOver ? 'border-[#f77f00] bg-[#fff8ee]' : 'hover:border-[#f77f00]/50',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,.pdf,image/*"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {file ? (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#f77f00] flex items-center justify-center mb-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#f77f00]">{file.name}</p>
          <p className="text-xs text-[#9f9f9f] mt-1">Click to replace</p>
        </div>
      ) : (
        <>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#9f9f9f] mb-3">
            <polyline points="16 16 12 12 8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-[#18191c]">
            <span className="font-semibold text-[#f77f00]">Browse video</span> or drop here
          </p>
          <p className="text-xs text-[#9f9f9f] mt-1 text-center max-w-[320px]">
            Supported format MP4. Max size 55 MB.
          </p>
        </>
      )}
    </div>
  );
}

function FAQSection({ faqs, onChange }: { faqs: FAQ[]; onChange: (f: FAQ[]) => void }) {
  function addFaq() { onChange([...faqs, { q: '', a: '' }]); }
  function updateFaq(i: number, key: 'q' | 'a', v: string) {
    const next = [...faqs]; next[i] = { ...next[i], [key]: v }; onChange(next);
  }
  function removeFaq(i: number) { onChange(faqs.filter((_, idx) => idx !== i)); }

  return (
    <div className="border border-[#e4e5e8] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        <span className="text-sm font-semibold text-[#18191c]">FAQs</span>
        <button type="button" onClick={addFaq} className="text-[#6b6b6b] hover:text-[#f77f00] transition-colors p-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="px-4 pb-4 bg-white border-t border-[#f2f2f3]">
        {faqs.length === 0 ? (
          <p className="text-sm text-[#9f9f9f] py-2">No FAQ questions yet. Add here</p>
        ) : (
          <div className="space-y-4 pt-3">
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={faq.q}
                    onChange={(e) => updateFaq(i, 'q', e.target.value)}
                    placeholder="Question"
                    className="flex-1 h-10 bg-[#f8f8f8] border border-[#e4e5e8] rounded-full px-4 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors"
                  />
                  <button type="button" onClick={() => removeFaq(i)} className="text-xs text-red-500 font-semibold hover:text-red-600 shrink-0">
                    Remove
                  </button>
                </div>
                <input
                  value={faq.a}
                  onChange={(e) => updateFaq(i, 'a', e.target.value)}
                  placeholder="Answer"
                  className="w-full h-10 bg-[#f8f8f8] border border-[#e4e5e8] rounded-full px-4 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Step7({
  form, set, videoFile, onVideoFile,
}: {
  form: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  videoFile: File | null;
  onVideoFile: (f: File) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#18191c] mb-3">
          Upload Intro Video / Culture Clip — MP4, PDF, or image for applicants' reference
        </p>
        <UploadZone file={videoFile} onFile={onVideoFile} />
      </div>
      <FAQSection faqs={form.faqs} onChange={(v) => set('faqs', v)} />
    </div>
  );
}

// ─── Preview step ─────────────────────────────────────────────────────────────

function PreviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p className="text-sm leading-relaxed">
      <span className="font-semibold text-[#18191c]">{label} : </span>
      <span className="text-[#6b6b6b]">{value}</span>
    </p>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-6 border-t border-[#f2f2f3] mt-6">
      <h3 className="text-[#18191c] font-bold text-[15px] mb-3">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function PreviewStep({
  form, videoFile, visibility, posterName, posterAvatar,
}: {
  form: FormData;
  videoFile: File | null;
  visibility: Visibility;
  posterName: string;
  posterAvatar: string;
}) {
  const initials = posterName ? posterName.charAt(0).toUpperCase() : 'U';
  const endTime = form.endTimeHH && form.endTimeMM ? `${form.endTimeHH}:${form.endTimeMM} ${form.endTimeAMPM}` : '';
  const eligibility = form.eligibilityCriteria.filter(Boolean).join(', ') || 'NA';
  const documents = form.requiredDocuments.filter(Boolean);

  function formatDate(d: string) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  }

  return (
    <div>
      {/* Card header */}
      <h2 className="text-[#18191c] font-bold text-xl">{form.jobTitle || 'Untitled Posting'}</h2>

      {/* Poster row */}
      <div className="flex items-start gap-3 mt-4">
        {posterAvatar ? (
          <img src={posterAvatar} alt={posterName} className="w-10 h-10 rounded-full object-cover border border-[#e4e5e8] shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#f77f00] flex items-center justify-center text-white font-bold shrink-0">
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-[#18191c]">{posterName || 'You'}</p>
          {form.department && <p className="text-xs text-[#6b6b6b] mt-0.5">{form.department}</p>}
          <div className="flex items-center gap-1 mt-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#6b6b6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" stroke="#6b6b6b" strokeWidth="1.5" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#6b6b6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs text-[#6b6b6b] capitalize">{visibility}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-4">
        {form.workMode && <span className="bg-[#f2f2f3] text-[#18191c] text-xs font-medium px-3 py-1.5 rounded-full">{form.workMode}</span>}
        {form.lastDateToApply && <span className="bg-[#f2f2f3] text-[#18191c] text-xs font-medium px-3 py-1.5 rounded-full">{formatDate(form.lastDateToApply)}</span>}
        {form.jobTitle && <span className="bg-[#f2f2f3] text-[#18191c] text-xs font-medium px-3 py-1.5 rounded-full">{form.jobTitle}</span>}
      </div>

      {/* Sections */}
      <PreviewSection title="Basic Details">
        <PreviewRow label="Job Title" value={form.jobTitle} />
        <PreviewRow label="Organization Name" value={form.orgName} />
        <PreviewRow label="Career Level" value={form.careerLevel} />
        <div className="flex flex-wrap gap-8">
          <PreviewRow label="Job Type" value={form.jobType} />
          <PreviewRow label="Work Mode" value={form.workMode} />
        </div>
      </PreviewSection>

      <PreviewSection title="Role Clarity & Working Environment">
        <PreviewRow label="Is the role fixed or dynamic?" value={form.roleType} />
        <PreviewRow label="Who will the candidate report to" value={form.reportingTo} />
        <PreviewRow label="Training Support" value={form.trainingSupport} />
        <PreviewRow label="Day-to-Day Sample Tasks" value={form.dailyTasks} />
        <PreviewRow label="Employee Growth Potential" value={form.growthPotential} />
      </PreviewSection>

      <PreviewSection title="Work Culture & Flexibility">
        <PreviewRow label="Working Hours Flexibility" value={form.workingHours} />
        <PreviewRow label="Leave Flexibility & Policy" value={form.leavePolicy} />
        <PreviewRow label="Company Culture Snapshot" value={form.companyCulture} />
        <PreviewRow label="Diversity or Inclusion Practices" value={form.diversityPractices} />
      </PreviewSection>

      <PreviewSection title="Compensation & Benefits">
        <div className="flex flex-wrap gap-8">
          <PreviewRow label="Compensation" value={form.compensation} />
          <PreviewRow label="Payment Frequency" value={form.paymentFrequency} />
        </div>
        <PreviewRow label="Any Additional Perks or Benefits" value={form.additionalPerks} />
      </PreviewSection>

      <PreviewSection title="Ideal Candidate Profile">
        <PreviewRow label="Mandatory Attributes" value={form.mandatoryAttributes} />
        <PreviewRow label="Preferred Educational Background or Skillsets" value={form.preferredSkillsets} />
        <PreviewRow label="Eligibility Criteria (If any)" value={eligibility} />
        {documents.length > 0 && <PreviewRow label="Required Documents" value={documents.join(', ')} />}
      </PreviewSection>

      <PreviewSection title="Commitment & Application Process">
        <PreviewRow label="Expected Weekly Hours" value={form.weeklyHours} />
        <div className="flex flex-wrap gap-8">
          {form.lastDateToApply && <PreviewRow label="Application Deadline" value={formatDate(form.lastDateToApply)} />}
          {endTime && <PreviewRow label="End Time" value={endTime} />}
        </div>
        <PreviewRow label="Selection Process" value={form.selectionProcess} />
      </PreviewSection>

      <PreviewSection title="Showcase & Build Trust (Optional but Valuable)">
        {videoFile ? (
          <div>
            <p className="text-sm text-[#6b6b6b] mb-2">Intro Video / Culture Clip :</p>
            <video
              src={URL.createObjectURL(videoFile)}
              className="w-full max-h-[240px] rounded-xl object-cover border border-[#e4e5e8]"
              controls
            />
          </div>
        ) : (
          <p className="text-sm text-[#6b6b6b]">Intro Video / Culture Clip : <span className="text-[#9f9f9f]">None</span></p>
        )}

        {form.faqs.length > 0 && (
          <div className="mt-3 space-y-3">
            <p className="text-sm font-semibold text-[#18191c]">FAQs :</p>
            {form.faqs.map((faq, i) => (
              <div key={i}>
                {faq.q && <p className="text-sm font-medium text-[#18191c]">Q: {faq.q}</p>}
                {faq.a && <p className="text-sm text-[#6b6b6b] ml-2">A: {faq.a}</p>}
              </div>
            ))}
          </div>
        )}
      </PreviewSection>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmploymentHubPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const { profile } = useProfile('me');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [visibility, setVisibility] = useState<Visibility>('Public');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  const posterName = profile
    ? [profile.firstName, profile.lastName].filter((s) => s && s !== 'unknown').join(' ') || profile.orgName || ''
    : '';
  const posterAvatar = profile?.avatarUrl || '';

  function addToast(type: Toast['type'], message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key as string]: '' }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await createEmployerPosting({
        jobTitle: form.jobTitle,
        orgName: form.orgName,
        department: form.department,
        industry: form.industry,
        jobType: form.jobType,
        careerLevel: form.careerLevel,
        workMode: form.workMode,
        roleType: form.roleType,
        reportingTo: form.reportingTo,
        dailyTasks: form.dailyTasks,
        trainingSupport: form.trainingSupport,
        growthPotential: form.growthPotential,
        workingHours: form.workingHours,
        leavePolicy: form.leavePolicy,
        companyCulture: form.companyCulture,
        diversityPractices: form.diversityPractices,
        compensation: form.compensation,
        paymentFrequency: form.paymentFrequency,
        additionalPerks: form.additionalPerks,
        mandatoryAttributes: form.mandatoryAttributes,
        preferredSkillsets: form.preferredSkillsets,
        eligibilityCriteria: form.eligibilityCriteria,
        requiredDocuments: form.requiredDocuments,
        weeklyHours: form.weeklyHours,
        lastDateToApply: form.lastDateToApply,
        endTimeHH: form.endTimeHH,
        endTimeMM: form.endTimeMM,
        endTimeAMPM: form.endTimeAMPM,
        selectionProcess: form.selectionProcess,
        videoFile,
        faqs: form.faqs,
        visibility,
      });
      addToast('success', 'Job posting published successfully!');
      setForm(initialForm);
      setVideoFile(null);
      setStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to publish posting');
    } finally {
      setLoading(false);
    }
  }

  function validate(): boolean {
    if (step === 0) {
      const errs: Record<string, string> = {};
      if (!form.jobTitle.trim()) errs.jobTitle = 'Job title is required';
      if (!form.orgName.trim()) errs.orgName = 'Organization name is required';
      if (Object.keys(errs).length) { setErrors(errs); return false; }
    }
    return true;
  }

  function handleNext() {
    if (!validate()) return;
    if (step < 7) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(-1);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] overflow-x-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px]">
        <div className="px-4 sm:px-6 py-6 flex gap-5 items-start">

          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#f2f2f3]">
            <div className="px-6 pt-6 pb-2">
              {step < 7 && <RoleToggle />}
              <h2 className="text-[#f77f00] text-lg font-semibold mb-5">{STEP_TITLES[step]}</h2>
              <ProgressBar pct={STEP_PROGRESS[step]} complete={step === 7} />
            </div>

            <div className="px-6 pb-6 pt-2">
              {step === 0 && <Step1 form={form} set={set} errors={errors} />}
              {step === 1 && <Step2 form={form} set={set} />}
              {step === 2 && <Step3 form={form} set={set} />}
              {step === 3 && <Step4 form={form} set={set} />}
              {step === 4 && <Step5 form={form} set={set} />}
              {step === 5 && <Step6 form={form} set={set} />}
              {step === 6 && <Step7 form={form} set={set} videoFile={videoFile} onVideoFile={setVideoFile} />}
              {step === 7 && (
                <PreviewStep
                  form={form}
                  videoFile={videoFile}
                  visibility={visibility}
                  posterName={posterName}
                  posterAvatar={posterAvatar}
                />
              )}
            </div>

            <div className="border-t border-[#f2f2f3] px-6 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                style={{ width: 120, height: 39 }}
                className="border border-[#f77f00] text-[#f77f00] text-[13px] font-medium rounded-full hover:bg-[#fff8ee] transition-colors focus:outline-none disabled:opacity-50"
              >
                Back
              </button>

              <VisibilityToggle value={visibility} onChange={setVisibility} />

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                style={{ width: 120, height: 39 }}
                className="bg-[#f77f00] text-white text-[13px] font-medium rounded-full hover:bg-[#e07000] transition-colors focus:outline-none disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                ) : (step === 7 ? 'Proceed' : 'Next')}
              </button>
            </div>
          </div>

          <div className="hidden lg:block shrink-0 sticky top-[90px] self-start">
            <RightPanel />
          </div>

        </div>
      </div>
    </div>
  );
}
