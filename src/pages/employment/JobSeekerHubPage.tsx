import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import { cn } from '@/lib/cn';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { fetchProfile } from '../../services/profileService';
import { createOrUpdateSeekerProfile, fetchMySeekerProfile } from '../../services/employmentService';
import type { Toast } from '../../types/profile';
import ToastContainer from '../../components/ui/Toast';
import {
  type Visibility,
  FieldLabel, TextInput, SelectDropdown, IndustrySelectorGrid,
  ProgressBar, VisibilityToggle, RightPanel,
} from './shared';

// ─── Constants ────────────────────────────────────────────────────────────────

const WORK_MODES = ['Onsite', 'Remote', 'Hybrid'];
const CURRENT_STATUS_OPTIONS = [
  'Student', 'Fresh Graduate', 'Early Career (0-3 years)',
  'Mid Career (3-7 years)', 'Senior (8+ years)', 'Career Break',
];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
const REPORTING_COMFORT_OPTIONS = [
  'Single manager', 'Multiple managers', 'Team/Group',
  'Direct to CEO/Founder', 'Independent/Self-directed',
];
const TRAINING_EXPECTATION_OPTIONS = [
  'Onboarding only', 'Onboarding + Self-paced',
  'Structured training', 'Mentorship provided', 'No training needed',
];
const WORK_HOURS_FLEXIBILITY_OPTIONS = [
  'Fixed schedule', 'Flexible hours', 'Shift-based', 'Hybrid flexibility',
];
const NEGOTIATION_OPTIONS = ['Yes', 'No', 'Open to discuss'];
const WORK_CULTURE_OPTIONS = [
  'Collaborative', 'Competitive', 'Innovative', 'Structured', 'Startup-like', 'Corporate',
];

const STEP_TITLES = [
  '1 of 6: Personal Information',
  '2 of 6: Desired Role & Work Preferences',
  '3 of 6: Compensation & Availability',
  '4 of 6: Skills, Tools & Attributes',
  '5 of 6: Culture & Values Alignment',
  '6 of 6: Human Touch & Differentiators (Optional)',
];

const STEP_PROGRESS = [0, 16, 33, 50, 66, 83];

// ─── Types ────────────────────────────────────────────────────────────────────

type SeekerFormData = {
  name: string;
  currentLocation: string;
  jobIndustry: string;
  lookingForRoles: string;
  preferredWorkMode: string;
  preferredBaseCity: string;
  currentStatus: string;
  jobType: string;
  specificJD: string;
  reportingComfort: string;
  trainingExpectation: string;
  workHoursFlexibility: string;
  leaveExpectation: string;
  expectedSalary: string;
  openToNegotiation: string;
  department: string;
  availableFrom: string;
  weeklyCommitment: string;
  technicalSkills: string[];
  softSkills: string[];
  certifications: string[];
  toolsPlatforms: string;
  portfolioLink: string;
  profileLink: string;
  preferredWorkCulture: string;
  eligibilityCriteria: string[];
  documentsRequired: string[];
  workDrivesYou: string;
  careerGoals: string;
  specialNotes: string;
  seekingEmployerWho: string;
};

const initialForm: SeekerFormData = {
  name: '',
  currentLocation: '',
  jobIndustry: '',
  lookingForRoles: '',
  preferredWorkMode: '',
  preferredBaseCity: '',
  currentStatus: '',
  jobType: '',
  specificJD: '',
  reportingComfort: '',
  trainingExpectation: '',
  workHoursFlexibility: '',
  leaveExpectation: '',
  expectedSalary: '',
  openToNegotiation: '',
  department: '',
  availableFrom: '',
  weeklyCommitment: '',
  technicalSkills: [],
  softSkills: [],
  certifications: [],
  toolsPlatforms: '',
  portfolioLink: '',
  profileLink: '',
  preferredWorkCulture: '',
  eligibilityCriteria: [],
  documentsRequired: [],
  workDrivesYou: '',
  careerGoals: '',
  specialNotes: '',
  seekingEmployerWho: '',
};

// ─── Seeker-specific UI components ───────────────────────────────────────────

function LinkInput({
  label, value, onChange, placeholder, className,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f77f00]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? ''}
          className="w-full h-12 bg-white border border-[#e4e5e8] rounded-full pl-10 pr-4 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors"
        />
      </div>
    </div>
  );
}

function TagInput({
  label, tags, onAdd, onRemove, placeholder, addLabel,
}: {
  label: string; tags: string[]; onAdd: (tag: string) => void;
  onRemove: (index: number) => void; placeholder?: string; addLabel: string;
}) {
  const [inputValue, setInputValue] = useState('');

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (trimmed) { onAdd(trimmed); setInputValue(''); }
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="w-full min-h-[48px] bg-white border border-[#e4e5e8] rounded-xl px-3 py-2 flex flex-wrap items-center gap-2 focus-within:border-[#f77f00] transition-colors">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-[#f2f2f3] text-[#18191c] text-xs font-medium px-3 py-1.5 rounded-full">
            {tag}
            <button type="button" onClick={() => onRemove(i)} className="text-[#9f9f9f] hover:text-red-500 transition-colors ml-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder={tags.length === 0 ? (placeholder ?? '') : ''}
          className="flex-1 min-w-[120px] text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none bg-transparent"
        />
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 w-full flex items-center justify-center gap-2 bg-[#fff3e0] text-[#f77f00] text-sm font-semibold h-12 rounded-full hover:bg-[#ffe0b2] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#f77f00" strokeWidth="1.5" />
          <path d="M12 8v8M8 12h8" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {addLabel}
      </button>
    </div>
  );
}

function TextareaField({
  label, value, onChange, placeholder, maxLength = 500,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; maxLength?: number;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder ?? ''}
        rows={5}
        className="w-full bg-white border border-[#e4e5e8] rounded-2xl px-4 py-3 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors resize-none"
      />
      <p className="text-right text-xs text-[#9f9f9f] mt-1">{value.length}/{maxLength} characters</p>
    </div>
  );
}

function InlineAddField({
  label, values, onAdd, onRemove, placeholder,
}: {
  label: string; values: string[]; onAdd: (v: string) => void;
  onRemove: (i: number) => void; placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (trimmed) { onAdd(trimmed); setInputValue(''); }
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-3">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder={placeholder ?? 'Enter here'}
          className="flex-1 h-12 bg-white border border-[#e4e5e8] rounded-full px-4 text-sm text-[#18191c] placeholder-[#9f9f9f] focus:outline-none focus:border-[#f77f00] transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 bg-[#fff3e0] text-[#f77f00] text-sm font-semibold px-4 h-12 rounded-full hover:bg-[#ffe0b2] transition-colors shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f77f00" strokeWidth="1.5" />
            <path d="M12 8v8M8 12h8" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 space-y-2">
          {values.map((val, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 bg-[#f8f8f8] rounded-xl">
              <span className="text-sm text-[#18191c]">{val}</span>
              <button type="button" onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600 text-xs font-semibold">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeUploadZone({ file, onFile }: { file: File | null; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (file) {
    return (
      <div
        className="border border-[#e4e5e8] rounded-2xl flex items-center justify-center py-10 cursor-pointer hover:border-[#f77f00]/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,image/*" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <div className="flex items-center gap-2">
          <span className="text-[#f77f00] font-semibold text-sm">Resume Uploaded Successfully — {file.name}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#22c55e" />
            <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    );
  }

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
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,image/*" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#9f9f9f] mb-3">
        <polyline points="16 16 12 12 8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm text-[#18191c]">
        <span className="font-semibold text-[#f77f00]">Browse docs</span> or drop here
      </p>
      <p className="text-xs text-[#9f9f9f] mt-1 text-center">
        Supported formats: PDF, DOC, DOCX. Max size 5 MB.
      </p>
    </div>
  );
}

function VideoUploadZone({ file, onFile }: { file: File | null; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (file) {
    return (
      <div
        className="border border-[#e4e5e8] rounded-2xl overflow-hidden bg-[#1a1a2e] flex items-center justify-center cursor-pointer"
        style={{ minHeight: 240 }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="video/*" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <div className="flex flex-col items-center gap-2">
          <button type="button" className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          <p className="text-white/60 text-xs">{file.name}</p>
        </div>
      </div>
    );
  }

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
      <input ref={inputRef} type="file" accept="video/*" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#9f9f9f] mb-3">
        <polyline points="16 16 12 12 8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm text-[#18191c]">
        <span className="font-semibold text-[#f77f00]">Browse video</span> or drop here
      </p>
      <p className="text-xs text-[#9f9f9f] mt-1 text-center">Supported format MP4. Max size 55 MB.</p>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({
  form, set, errors,
}: {
  form: SeekerFormData;
  set: <K extends keyof SeekerFormData>(k: K, v: SeekerFormData[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel>Name</FieldLabel>
          <div className="relative">
            <input
              value={form.name}
              readOnly
              className="w-full h-12 bg-white border border-[#e4e5e8] rounded-full px-4 pr-12 text-sm text-[#18191c] focus:outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#22c55e" />
                <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <TextInput
          label="Current Location"
          value={form.currentLocation}
          onChange={(v) => set('currentLocation', v)}
          placeholder="Enter your Current Location (city, state)"
          error={errors.currentLocation}
        />
      </div>

      <div>
        <FieldLabel>Select Job Industry</FieldLabel>
        <IndustrySelectorGrid value={form.jobIndustry} onChange={(v) => set('jobIndustry', v)} />
      </div>

      <TextInput
        label="Looking For Roles In"
        value={form.lookingForRoles}
        onChange={(v) => set('lookingForRoles', v)}
        placeholder="Enter your Looking For Roles In"
        error={errors.lookingForRoles}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectDropdown
          label="Preferred Work Mode"
          value={form.preferredWorkMode}
          options={WORK_MODES}
          placeholder="Select your Preferred Work Location Type"
          onChange={(v) => set('preferredWorkMode', v)}
        />
        <TextInput
          label="Preferred Base City"
          value={form.preferredBaseCity}
          onChange={(v) => set('preferredBaseCity', v)}
          placeholder="Select your Preferred Base City"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectDropdown
          label="Current Status"
          value={form.currentStatus}
          options={CURRENT_STATUS_OPTIONS}
          placeholder="Select your Current Status"
          onChange={(v) => set('currentStatus', v)}
        />
        <SelectDropdown
          label="Job Type"
          value={form.jobType}
          options={JOB_TYPES}
          placeholder="Select your Job Type"
          onChange={(v) => set('jobType', v)}
        />
      </div>
    </div>
  );
}

function Step2({
  form, set,
}: {
  form: SeekerFormData;
  set: <K extends keyof SeekerFormData>(k: K, v: SeekerFormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <TextareaField
        label="Are you looking for a specific JD or open to dynamic roles?"
        value={form.specificJD}
        onChange={(v) => set('specificJD', v)}
        placeholder="Enter your specific JD"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectDropdown
          label="Reporting Comfort"
          value={form.reportingComfort}
          options={REPORTING_COMFORT_OPTIONS}
          placeholder="Enter your Reporting specific person"
          onChange={(v) => set('reportingComfort', v)}
        />
        <SelectDropdown
          label="Training Expectation"
          value={form.trainingExpectation}
          options={TRAINING_EXPECTATION_OPTIONS}
          placeholder="Enter your Training Expectation"
          onChange={(v) => set('trainingExpectation', v)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectDropdown
          label="Work Hours Flexibility"
          value={form.workHoursFlexibility}
          options={WORK_HOURS_FLEXIBILITY_OPTIONS}
          placeholder="Select your Work Hours Flexibility"
          onChange={(v) => set('workHoursFlexibility', v)}
        />
        <TextInput
          label="Leave Expectation"
          value={form.leaveExpectation}
          onChange={(v) => set('leaveExpectation', v)}
          placeholder="Select your Leave Expectation"
        />
      </div>
    </div>
  );
}

function Step3({
  form, set,
}: {
  form: SeekerFormData;
  set: <K extends keyof SeekerFormData>(k: K, v: SeekerFormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextInput
          label="Expected Salary / Stipend Range"
          value={form.expectedSalary}
          onChange={(v) => set('expectedSalary', v)}
          placeholder="Enter your Expected Salary / Stipend Range"
        />
        <SelectDropdown
          label="Open to Negotiation?"
          value={form.openToNegotiation}
          options={NEGOTIATION_OPTIONS}
          placeholder="Enter your preference"
          onChange={(v) => set('openToNegotiation', v)}
        />
      </div>

      <TextInput
        label="Department"
        value={form.department}
        onChange={(v) => set('department', v)}
        placeholder="Enter your department name E.g., (Product, Sales, Marketing, Operations)"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel>Available From</FieldLabel>
          <div className="relative">
            <input
              type="date"
              value={form.availableFrom}
              onChange={(e) => set('availableFrom', e.target.value)}
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
        <TextInput
          label="Weekly Commitment"
          value={form.weeklyCommitment}
          onChange={(v) => set('weeklyCommitment', v)}
          placeholder="Select your Weekly Commitment in per hour"
        />
      </div>
    </div>
  );
}

function Step4({
  form, set, resumeFile, onResumeFile,
}: {
  form: SeekerFormData;
  set: <K extends keyof SeekerFormData>(k: K, v: SeekerFormData[K]) => void;
  resumeFile: File | null;
  onResumeFile: (f: File) => void;
}) {
  function addTag(field: 'technicalSkills' | 'softSkills' | 'certifications', tag: string) {
    set(field, [...form[field], tag]);
  }
  function removeTag(field: 'technicalSkills' | 'softSkills' | 'certifications', index: number) {
    set(field, form[field].filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <TagInput
        label="Top 3 Technical Skills"
        tags={form.technicalSkills}
        onAdd={(tag) => addTag('technicalSkills', tag)}
        onRemove={(i) => removeTag('technicalSkills', i)}
        placeholder="Enter your Technical Skills"
        addLabel="Add Technical Skills"
      />

      <TagInput
        label="Top 3 Soft Skills / Traits"
        tags={form.softSkills}
        onAdd={(tag) => addTag('softSkills', tag)}
        onRemove={(i) => removeTag('softSkills', i)}
        placeholder="Enter your Soft Skills / Traits"
        addLabel="Add Soft Skills / Traits"
      />

      <TagInput
        label="Certifications / Courses"
        tags={form.certifications}
        onAdd={(tag) => addTag('certifications', tag)}
        onRemove={(i) => removeTag('certifications', i)}
        placeholder="Enter your Certifications / Courses"
        addLabel="Add Certifications / Courses"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextInput
          label="Tools / Platforms Familiar With"
          value={form.toolsPlatforms}
          onChange={(v) => set('toolsPlatforms', v)}
          placeholder="Enter your Tools / Platforms Familiar With"
        />
        <LinkInput
          label="Portfolio / GitHub / Behance"
          value={form.portfolioLink}
          onChange={(v) => set('portfolioLink', v)}
          placeholder="Paste your link here"
        />
      </div>

      <LinkInput
        label="Impactshaala / Profile Link"
        value={form.profileLink}
        onChange={(v) => set('profileLink', v)}
        placeholder="Paste your link here"
      />

      <div>
        <FieldLabel>Resume Upload</FieldLabel>
        <ResumeUploadZone file={resumeFile} onFile={onResumeFile} />
      </div>
    </div>
  );
}

function Step5({
  form, set,
}: {
  form: SeekerFormData;
  set: <K extends keyof SeekerFormData>(k: K, v: SeekerFormData[K]) => void;
}) {
  function addItem(field: 'eligibilityCriteria' | 'documentsRequired', val: string) {
    set(field, [...form[field], val]);
  }
  function removeItem(field: 'eligibilityCriteria' | 'documentsRequired', i: number) {
    set(field, form[field].filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <SelectDropdown
        label="Preferred Work Culture"
        value={form.preferredWorkCulture}
        options={WORK_CULTURE_OPTIONS}
        placeholder="Enter your Preferred Work Culture"
        onChange={(v) => set('preferredWorkCulture', v)}
      />

      <InlineAddField
        label="Mention the eligibility criteria ( If applicable )"
        values={form.eligibilityCriteria}
        onAdd={(v) => addItem('eligibilityCriteria', v)}
        onRemove={(i) => removeItem('eligibilityCriteria', i)}
        placeholder="Enter your criteria"
      />

      <InlineAddField
        label="Document to be attached by applicant (If any)"
        values={form.documentsRequired}
        onAdd={(v) => addItem('documentsRequired', v)}
        onRemove={(i) => removeItem('documentsRequired', i)}
        placeholder="Enter document name"
      />

      <TextareaField
        label="What Kind of Work Drives You?"
        value={form.workDrivesYou}
        onChange={(v) => set('workDrivesYou', v)}
        placeholder="Enter your What Kind of Work Drives You?"
      />

      <TextareaField
        label="Career Goals (Next 1-2 years)"
        value={form.careerGoals}
        onChange={(v) => set('careerGoals', v)}
        placeholder="Enter your Career Goals"
      />
    </div>
  );
}

function Step6({
  form, set, introVideoFile, onIntroVideoFile,
}: {
  form: SeekerFormData;
  set: <K extends keyof SeekerFormData>(k: K, v: SeekerFormData[K]) => void;
  introVideoFile: File | null;
  onIntroVideoFile: (f: File) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Short Intro Video (60-90 sec)</FieldLabel>
        <VideoUploadZone file={introVideoFile} onFile={onIntroVideoFile} />
      </div>

      <TextInput
        label="Special Notes / Needs"
        value={form.specialNotes}
        onChange={(v) => set('specialNotes', v)}
        placeholder="Write your Special Notes / Needs"
      />

      <TextInput
        label="Specifically seeking for employer who is"
        value={form.seekingEmployerWho}
        onChange={(v) => set('seekingEmployerWho', v)}
        placeholder="Write your Specifically seeking for employer who is"
      />
    </div>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────

function PreviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p className="text-sm">
      <span className="font-semibold text-[#18191c]">{label} : </span>
      <span className="text-[#6b6b6b]">{value}</span>
    </p>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[#18191c] font-bold text-[15px] mb-4">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ApplicationPreview({
  form, resumeFile, introVideoFile,
}: {
  form: SeekerFormData;
  resumeFile: File | null;
  introVideoFile: File | null;
}) {
  const jdLines = form.specificJD.split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <div>
      <h2 className="text-[#f77f00] text-xl font-bold mb-6">Preview your application</h2>

      <PreviewSection title="Personal Information">
        <PreviewRow label="Looking For Roles In" value={form.lookingForRoles} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          <PreviewRow label="Current Location" value={form.currentLocation} />
          <PreviewRow label="Work Location Type" value={form.preferredWorkMode} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          <PreviewRow label="Preferred Base City" value={form.preferredBaseCity} />
          <PreviewRow label="Job Type" value={form.jobType} />
        </div>
        <PreviewRow label="Current Status" value={form.currentStatus} />
        {form.jobIndustry && <PreviewRow label="Job Industry" value={form.jobIndustry} />}
      </PreviewSection>

      <div className="border-t border-[#f2f2f3] mb-6" />

      <PreviewSection title="Desired Role & Work Preferences">
        {form.specificJD && (
          <div>
            <p className="text-sm font-semibold text-[#18191c] mb-2">
              Are you looking for a specific JD or open to dynamic roles? :
            </p>
            {jdLines.length > 1 ? (
              <ul className="list-disc list-inside space-y-1">
                {jdLines.map((line, i) => <li key={i} className="text-sm text-[#6b6b6b]">{line}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-[#6b6b6b]">{form.specificJD}</p>
            )}
          </div>
        )}
        <PreviewRow label="Reporting to" value={form.reportingComfort} />
        <PreviewRow label="Training Expectation" value={form.trainingExpectation} />
        <PreviewRow label="Work Hours Flexibility" value={form.workHoursFlexibility} />
        <PreviewRow label="Leave Expectation" value={form.leaveExpectation} />
      </PreviewSection>

      <div className="border-t border-[#f2f2f3] mb-6" />

      <PreviewSection title="Compensation & Availability">
        <PreviewRow label="Expected Salary / Stipend Range" value={form.expectedSalary} />
        <PreviewRow label="Open to Negotiation?" value={form.openToNegotiation} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          <PreviewRow label="Department" value={form.department} />
          <PreviewRow label="Available From" value={form.availableFrom} />
        </div>
        <PreviewRow label="Weekly Commitment" value={form.weeklyCommitment} />
      </PreviewSection>

      <div className="border-t border-[#f2f2f3] mb-6" />

      <PreviewSection title="Skills, Tools & Attributes">
        {form.technicalSkills.length > 0 && (
          <PreviewRow label="Top 3 Technical Skills" value={form.technicalSkills.join(', ')} />
        )}
        {form.softSkills.length > 0 && (
          <PreviewRow label="Top 3 Soft Skills / Traits" value={form.softSkills.join(', ')} />
        )}
        {form.certifications.length > 0 && (
          <PreviewRow label="Certifications / Courses" value={form.certifications.join(', ')} />
        )}
        <PreviewRow label="Tools / Platforms Familiar With" value={form.toolsPlatforms} />
        <PreviewRow label="Portfolio / GitHub / Behance" value={form.portfolioLink} />
        <PreviewRow label="Impactshaala / Profile Link" value={form.profileLink} />
        {resumeFile && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#18191c]">Resume Upload :</span>
            <span className="text-[#f77f00] text-sm font-semibold">
              Resume Uploaded Successfully — {resumeFile.name}
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#22c55e" />
              <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </PreviewSection>

      <div className="border-t border-[#f2f2f3] mb-6" />

      <PreviewSection title="Culture & Values Alignment">
        <PreviewRow label="Preferred Work Culture" value={form.preferredWorkCulture} />
        {form.eligibilityCriteria.length > 0 && (
          <PreviewRow label="Eligibility Criteria" value={form.eligibilityCriteria.join(', ')} />
        )}
        {form.documentsRequired.length > 0 && (
          <PreviewRow label="Documents Required" value={form.documentsRequired.join(', ')} />
        )}
        <PreviewRow label="What Kind of Work Drives You?" value={form.workDrivesYou} />
        <PreviewRow label="Career Goals (Next 1-2 years)" value={form.careerGoals} />
      </PreviewSection>

      <div className="border-t border-[#f2f2f3] mb-6" />

      <PreviewSection title="Human Touch & Differentiators (Optional)">
        <PreviewRow label="Special Notes / Needs" value={form.specialNotes} />
        <PreviewRow label="Specifically seeking for employer who is" value={form.seekingEmployerWho} />
        {introVideoFile && (
          <div>
            <p className="text-sm font-semibold text-[#18191c] mb-2">Intro Video / Culture Clip :</p>
            <div className="rounded-2xl overflow-hidden bg-[#1a1a2e] flex items-center justify-center" style={{ minHeight: 200 }}>
              <div className="flex flex-col items-center gap-2">
                <button type="button" className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
                <p className="text-white/60 text-xs">{introVideoFile.name}</p>
              </div>
            </div>
          </div>
        )}
      </PreviewSection>
    </div>
  );
}

// ─── Role toggle ──────────────────────────────────────────────────────────────

function RoleToggle() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 mb-5 p-1 bg-[#f5f5f5] rounded-full w-fit">
      <button
        type="button"
        onClick={() => navigate('/employment-hub/employer')}
        className="px-5 h-9 rounded-full text-sm font-medium text-[#6b6b6b] hover:bg-white transition-colors"
      >
        Employer
      </button>
      <button type="button" className="px-5 h-9 rounded-full text-sm font-semibold bg-[#f77f00] text-white shadow-sm">
        Job Seeker
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JobSeekerHubPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState(0); // 0–5: form steps; 6: preview
  const [form, setFormData] = useState<SeekerFormData>(initialForm);
  const [visibility, setVisibility] = useState<Visibility>('Public');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [introVideoFile, setIntroVideoFile] = useState<File | null>(null);
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  const [existingIntroVideoUrl, setExistingIntroVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Pre-fill name from the user's real profile on mount.
  // Auth session user_metadata is never populated (signup only sets
  // email/password there — first/last name live in the users table), so
  // reading from it here always silently returned nothing, leaving this
  // read-only field permanently blank and every seeker post "Anonymous".
  useEffect(() => {
    let cancelled = false;
    fetchProfile('me').then((profile) => {
      if (cancelled) return;
      const name = [profile.firstName, profile.lastName]
        .filter((s): s is string => !!s && s !== 'unknown')
        .join(' ') || profile.orgName || '';
      if (name) setFormData((prev) => ({ ...prev, name }));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Load existing profile if one exists — cancelled flag prevents the stale
  // second invocation in React Strict Mode from overwriting user's in-progress edits
  useEffect(() => {
    let cancelled = false;
    fetchMySeekerProfile()
      .then((profile) => {
        if (cancelled || !profile) return;
        setExistingResumeUrl(profile.resume_url ?? null);
        setExistingIntroVideoUrl(profile.intro_video_url ?? null);
        setFormData((prev) => ({
          name: profile.name || prev.name,
          currentLocation: profile.current_location ?? '',
          jobIndustry: profile.job_industry ?? '',
          lookingForRoles: profile.looking_for_roles ?? '',
          preferredWorkMode: profile.preferred_work_mode ?? '',
          preferredBaseCity: profile.preferred_base_city ?? '',
          currentStatus: profile.current_status ?? '',
          jobType: profile.job_type ?? '',
          specificJD: profile.specific_jd ?? '',
          reportingComfort: profile.reporting_comfort ?? '',
          trainingExpectation: profile.training_expectation ?? '',
          workHoursFlexibility: profile.work_hours_flexibility ?? '',
          leaveExpectation: profile.leave_expectation ?? '',
          expectedSalary: profile.expected_salary ?? '',
          openToNegotiation: profile.open_to_negotiation ?? '',
          department: profile.department ?? '',
          availableFrom: profile.available_from ?? '',
          weeklyCommitment: profile.weekly_commitment ?? '',
          technicalSkills: profile.technical_skills ?? [],
          softSkills: profile.soft_skills ?? [],
          certifications: profile.certifications ?? [],
          toolsPlatforms: profile.tools_platforms ?? '',
          portfolioLink: profile.portfolio_link ?? '',
          profileLink: profile.profile_link ?? '',
          preferredWorkCulture: profile.preferred_work_culture ?? '',
          eligibilityCriteria: profile.eligibility_criteria ?? [],
          documentsRequired: profile.documents_required ?? [],
          workDrivesYou: profile.work_drives_you ?? '',
          careerGoals: profile.career_goals ?? '',
          specialNotes: profile.special_notes ?? '',
          seekingEmployerWho: profile.seeking_employer_who ?? '',
        }));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function addToast(type: Toast['type'], message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function set<K extends keyof SeekerFormData>(key: K, value: SeekerFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key as string]: '' }));
  }

  async function handleProceed() {
    setLoading(true);
    try {
      await createOrUpdateSeekerProfile({
        name: form.name,
        currentLocation: form.currentLocation,
        jobIndustry: form.jobIndustry,
        lookingForRoles: form.lookingForRoles,
        preferredWorkMode: form.preferredWorkMode,
        preferredBaseCity: form.preferredBaseCity,
        currentStatus: form.currentStatus,
        jobType: form.jobType,
        specificJD: form.specificJD,
        reportingComfort: form.reportingComfort,
        trainingExpectation: form.trainingExpectation,
        workHoursFlexibility: form.workHoursFlexibility,
        leaveExpectation: form.leaveExpectation,
        expectedSalary: form.expectedSalary,
        openToNegotiation: form.openToNegotiation,
        department: form.department,
        availableFrom: form.availableFrom,
        weeklyCommitment: form.weeklyCommitment,
        technicalSkills: form.technicalSkills,
        softSkills: form.softSkills,
        certifications: form.certifications,
        toolsPlatforms: form.toolsPlatforms,
        portfolioLink: form.portfolioLink,
        profileLink: form.profileLink,
        resumeFile,
        existingResumeUrl,
        preferredWorkCulture: form.preferredWorkCulture,
        eligibilityCriteria: form.eligibilityCriteria,
        documentsRequired: form.documentsRequired,
        workDrivesYou: form.workDrivesYou,
        careerGoals: form.careerGoals,
        introVideoFile,
        existingIntroVideoUrl,
        specialNotes: form.specialNotes,
        seekingEmployerWho: form.seekingEmployerWho,
        visibility,
      });
      addToast('success', 'Profile saved successfully!');
      navigate('/employment-hub');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  function validate(): boolean {
    if (step === 0) {
      const errs: Record<string, string> = {};
      if (!form.currentLocation.trim()) errs.currentLocation = 'Location is required';
      if (!form.lookingForRoles.trim()) errs.lookingForRoles = 'This field is required';
      if (Object.keys(errs).length) { setErrors(errs); return false; }
    }
    return true;
  }

  function handleNext() {
    if (!validate()) return;
    if (step < 6) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleProceed();
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

  const isPreview = step === 6;

  return (
    <div className="min-h-screen bg-[#f5f5f5] overflow-x-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6 items-start">

          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#f2f2f3]">
            {profileLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <svg className="animate-spin" width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#f77f00" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                </svg>
              </div>
            ) : (
              <>
                <div className="px-6 pt-6 pb-2">
                  {!isPreview && <RoleToggle />}
                  {!isPreview ? (
                    <>
                      <h2 className="text-[#f77f00] text-lg font-semibold mb-5">{STEP_TITLES[step]}</h2>
                      <ProgressBar pct={STEP_PROGRESS[step]} />
                    </>
                  ) : (
                    <ProgressBar pct={100} complete />
                  )}
                </div>

                <div className="px-6 pb-6 pt-2">
                  {step === 0 && <Step1 form={form} set={set} errors={errors} />}
                  {step === 1 && <Step2 form={form} set={set} />}
                  {step === 2 && <Step3 form={form} set={set} />}
                  {step === 3 && <Step4 form={form} set={set} resumeFile={resumeFile} onResumeFile={setResumeFile} />}
                  {step === 4 && <Step5 form={form} set={set} />}
                  {step === 5 && <Step6 form={form} set={set} introVideoFile={introVideoFile} onIntroVideoFile={setIntroVideoFile} />}
                  {step === 6 && <ApplicationPreview form={form} resumeFile={resumeFile} introVideoFile={introVideoFile} />}
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
                    ) : (isPreview ? 'Proceed' : 'Next')}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="hidden xl:block w-[340px] shrink-0 self-start sticky top-[-155px]">
            <RightPanel />
          </div>

        </div>
      </div>
    </div>
  );
}
