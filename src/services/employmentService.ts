import { createClient } from '@supabase/supabase-js';
import { supabase, getAuthenticatedSession } from '../lib/supabase';

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function requireSession() {
  const session = await getAuthenticatedSession();
  if (!session) throw new Error('Not logged in');
  return session;
}

// Direct-auth client — injects Bearer token in headers (same pattern as savedService).
// Avoids relying on the shared supabase singleton's session state for RLS.
function getAuthClient() {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  const token: string | undefined = stored?.access_token;
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined,
  );
}

function getStoredUserId(): string {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  return stored?.id ?? '';
}

async function uploadFile(bucket: string, folder: string, file: File): Promise<string> {
  const session = await requireSession();
  const userId = session.user.id;
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FAQ = { q: string; a: string };

export type EmployerPosting = {
  id: string;
  user_id: string;
  job_title: string;
  org_name: string;
  department: string | null;
  industry: string | null;
  job_type: string | null;
  career_level: string | null;
  work_mode: string | null;
  role_type: string | null;
  reporting_to: string | null;
  daily_tasks: string | null;
  training_support: string | null;
  growth_potential: string | null;
  working_hours: string | null;
  leave_policy: string | null;
  company_culture: string | null;
  diversity_practices: string | null;
  compensation: string | null;
  payment_frequency: string | null;
  additional_perks: string | null;
  mandatory_attributes: string | null;
  preferred_skillsets: string | null;
  eligibility_criteria: string[];
  required_documents: string[];
  weekly_hours: string | null;
  last_date_to_apply: string | null;
  end_time: string | null;
  selection_process: string | null;
  video_url: string | null;
  faqs: FAQ[];
  visibility: string;
  status: string;
  created_at: string;
};

export type CreateEmployerPayload = {
  jobTitle: string;
  orgName: string;
  department: string;
  industry: string;
  jobType: string;
  careerLevel: string;
  workMode: string;
  roleType: string;
  reportingTo: string;
  dailyTasks: string;
  trainingSupport: string;
  growthPotential: string;
  workingHours: string;
  leavePolicy: string;
  companyCulture: string;
  diversityPractices: string;
  compensation: string;
  paymentFrequency: string;
  additionalPerks: string;
  mandatoryAttributes: string;
  preferredSkillsets: string;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  weeklyHours: string;
  lastDateToApply: string;
  endTimeHH: string;
  endTimeMM: string;
  endTimeAMPM: string;
  selectionProcess: string;
  videoFile: File | null;
  faqs: FAQ[];
  visibility: string;
};

export type SeekerProfile = {
  id: string;
  user_id: string;
  name: string;
  current_location: string | null;
  job_industry: string | null;
  looking_for_roles: string | null;
  preferred_work_mode: string | null;
  preferred_base_city: string | null;
  current_status: string | null;
  job_type: string | null;
  specific_jd: string | null;
  reporting_comfort: string | null;
  training_expectation: string | null;
  work_hours_flexibility: string | null;
  leave_expectation: string | null;
  expected_salary: string | null;
  open_to_negotiation: string | null;
  department: string | null;
  available_from: string | null;
  weekly_commitment: string | null;
  technical_skills: string[];
  soft_skills: string[];
  certifications: string[];
  tools_platforms: string | null;
  portfolio_link: string | null;
  profile_link: string | null;
  resume_url: string | null;
  preferred_work_culture: string | null;
  eligibility_criteria: string[];
  documents_required: string[];
  work_drives_you: string | null;
  career_goals: string | null;
  intro_video_url: string | null;
  special_notes: string | null;
  seeking_employer_who: string | null;
  visibility: string;
  status: string;
  created_at: string;
};

export type CreateSeekerPayload = {
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
  resumeFile: File | null;
  existingResumeUrl?: string | null;
  preferredWorkCulture: string;
  eligibilityCriteria: string[];
  documentsRequired: string[];
  workDrivesYou: string;
  careerGoals: string;
  introVideoFile: File | null;
  existingIntroVideoUrl?: string | null;
  specialNotes: string;
  seekingEmployerWho: string;
  visibility: string;
};

// ─── Employer Postings ────────────────────────────────────────────────────────

export async function createEmployerPosting(
  payload: CreateEmployerPayload,
): Promise<EmployerPosting> {
  const session = await requireSession();
  const userId = session.user.id;

  let videoUrl: string | null = null;
  if (payload.videoFile) {
    videoUrl = await uploadFile('employment-hub-media', 'videos', payload.videoFile);
  }

  const endTime = payload.endTimeHH && payload.endTimeMM
    ? `${payload.endTimeHH}:${payload.endTimeMM} ${payload.endTimeAMPM}`
    : null;

  const { data, error } = await supabase
    .from('employment_hub_postings')
    .insert({
      user_id: userId,
      job_title: payload.jobTitle || null,
      org_name: payload.orgName || null,
      department: payload.department || null,
      industry: payload.industry || null,
      job_type: payload.jobType || null,
      career_level: payload.careerLevel || null,
      work_mode: payload.workMode || null,
      role_type: payload.roleType || null,
      reporting_to: payload.reportingTo || null,
      daily_tasks: payload.dailyTasks || null,
      training_support: payload.trainingSupport || null,
      growth_potential: payload.growthPotential || null,
      working_hours: payload.workingHours || null,
      leave_policy: payload.leavePolicy || null,
      company_culture: payload.companyCulture || null,
      diversity_practices: payload.diversityPractices || null,
      compensation: payload.compensation || null,
      payment_frequency: payload.paymentFrequency || null,
      additional_perks: payload.additionalPerks || null,
      mandatory_attributes: payload.mandatoryAttributes || null,
      preferred_skillsets: payload.preferredSkillsets || null,
      eligibility_criteria: payload.eligibilityCriteria.filter(Boolean),
      required_documents: payload.requiredDocuments.filter(Boolean),
      weekly_hours: payload.weeklyHours || null,
      last_date_to_apply: payload.lastDateToApply || null,
      end_time: endTime,
      selection_process: payload.selectionProcess || null,
      video_url: videoUrl,
      faqs: payload.faqs,
      visibility: payload.visibility.toLowerCase(),
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EmployerPosting;
}

export async function fetchMyEmployerPostings(): Promise<EmployerPosting[]> {
  const userId = getStoredUserId();
  if (!userId) return [];

  const { data, error } = await getAuthClient()
    .from('employment_hub_postings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as EmployerPosting[];
}

export async function updateEmployerPosting(
  id: string,
  payload: Partial<CreateEmployerPayload>,
): Promise<void> {
  const session = await requireSession();
  const userId = session.user.id;

  const updates: Record<string, unknown> = {};
  if (payload.jobTitle !== undefined) updates.job_title = payload.jobTitle || null;
  if (payload.orgName !== undefined) updates.org_name = payload.orgName || null;
  if (payload.department !== undefined) updates.department = payload.department || null;
  if (payload.industry !== undefined) updates.industry = payload.industry || null;
  if (payload.jobType !== undefined) updates.job_type = payload.jobType || null;
  if (payload.careerLevel !== undefined) updates.career_level = payload.careerLevel || null;
  if (payload.workMode !== undefined) updates.work_mode = payload.workMode || null;
  if (payload.roleType !== undefined) updates.role_type = payload.roleType || null;
  if (payload.reportingTo !== undefined) updates.reporting_to = payload.reportingTo || null;
  if (payload.dailyTasks !== undefined) updates.daily_tasks = payload.dailyTasks || null;
  if (payload.trainingSupport !== undefined) updates.training_support = payload.trainingSupport || null;
  if (payload.growthPotential !== undefined) updates.growth_potential = payload.growthPotential || null;
  if (payload.workingHours !== undefined) updates.working_hours = payload.workingHours || null;
  if (payload.leavePolicy !== undefined) updates.leave_policy = payload.leavePolicy || null;
  if (payload.companyCulture !== undefined) updates.company_culture = payload.companyCulture || null;
  if (payload.diversityPractices !== undefined) updates.diversity_practices = payload.diversityPractices || null;
  if (payload.compensation !== undefined) updates.compensation = payload.compensation || null;
  if (payload.paymentFrequency !== undefined) updates.payment_frequency = payload.paymentFrequency || null;
  if (payload.additionalPerks !== undefined) updates.additional_perks = payload.additionalPerks || null;
  if (payload.mandatoryAttributes !== undefined) updates.mandatory_attributes = payload.mandatoryAttributes || null;
  if (payload.preferredSkillsets !== undefined) updates.preferred_skillsets = payload.preferredSkillsets || null;
  if (payload.eligibilityCriteria !== undefined) updates.eligibility_criteria = payload.eligibilityCriteria.filter(Boolean);
  if (payload.requiredDocuments !== undefined) updates.required_documents = payload.requiredDocuments.filter(Boolean);
  if (payload.weeklyHours !== undefined) updates.weekly_hours = payload.weeklyHours || null;
  if (payload.lastDateToApply !== undefined) updates.last_date_to_apply = payload.lastDateToApply || null;
  if (payload.selectionProcess !== undefined) updates.selection_process = payload.selectionProcess || null;
  if (payload.faqs !== undefined) updates.faqs = payload.faqs;
  if (payload.visibility !== undefined) updates.visibility = payload.visibility.toLowerCase();

  if (payload.videoFile) {
    updates.video_url = await uploadFile('employment-hub-media', 'videos', payload.videoFile);
  }

  const { error } = await supabase
    .from('employment_hub_postings')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function deleteEmployerPosting(id: string): Promise<void> {
  const session = await requireSession();
  const userId = session.user.id;

  const { error } = await supabase
    .from('employment_hub_postings')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function fetchEmployerPostingById(id: string): Promise<EmployerPosting | null> {
  const { data, error } = await getAuthClient()
    .from('employment_hub_postings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as EmployerPosting;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export type ApplicationStatus = 'applied' | 'not_a_fit' | 'maybe' | 'goodfit';

export type EmploymentApplication = {
  id: string;
  posting_id: string;
  applicant_id: string;
  name: string;
  email: string;
  mobile: string | null;
  message: string | null;
  status: ApplicationStatus;
  applied_at: string;
};

export type MyApplication = EmploymentApplication & { posting: EmployerPosting | null };

export async function submitApplication(
  postingId: string,
  data: { name: string; email: string; mobile: string; message?: string },
): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) throw new Error('Not logged in');
  const { error } = await getAuthClient()
    .from('employment_applications')
    .upsert(
      {
        posting_id: postingId,
        applicant_id: userId,
        name: data.name,
        email: data.email,
        mobile: data.mobile || null,
        message: data.message || null,
      },
      { onConflict: 'posting_id,applicant_id' },
    );
  if (error) throw new Error(error.message);
}

export async function fetchApplicationsForPosting(
  postingId: string,
): Promise<EmploymentApplication[]> {
  const { data, error } = await getAuthClient()
    .from('employment_applications')
    .select('*')
    .eq('posting_id', postingId)
    .order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EmploymentApplication[];
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<void> {
  const { error } = await getAuthClient()
    .from('employment_applications')
    .update({ status })
    .eq('id', applicationId);
  if (error) throw new Error(error.message);
}

export async function fetchMyApplicationsAsSeeker(): Promise<MyApplication[]> {
  const userId = getStoredUserId();
  if (!userId) return [];
  const { data, error } = await getAuthClient()
    .from('employment_applications')
    .select('*, posting:employment_hub_postings (*)')
    .eq('applicant_id', userId)
    .order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MyApplication[];
}

export async function fetchApplicationCountsForPostings(
  postingIds: string[],
): Promise<Map<string, number>> {
  if (postingIds.length === 0) return new Map();
  const { data, error } = await getAuthClient()
    .from('employment_applications')
    .select('posting_id')
    .in('posting_id', postingIds);
  if (error) return new Map();
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.posting_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

// ─── Job Seeker Profiles ──────────────────────────────────────────────────────

export async function createOrUpdateSeekerProfile(
  payload: CreateSeekerPayload,
): Promise<SeekerProfile> {
  const session = await requireSession();
  const userId = session.user.id;

  const [resumeUrl, introVideoUrl] = await Promise.all([
    payload.resumeFile
      ? uploadFile('employment-hub-media', 'resumes', payload.resumeFile)
      : Promise.resolve(payload.existingResumeUrl ?? null),
    payload.introVideoFile
      ? uploadFile('employment-hub-media', 'intro-videos', payload.introVideoFile)
      : Promise.resolve(payload.existingIntroVideoUrl ?? null),
  ]);

  const record = {
    user_id: userId,
    name: payload.name || null,
    current_location: payload.currentLocation || null,
    job_industry: payload.jobIndustry || null,
    looking_for_roles: payload.lookingForRoles || null,
    preferred_work_mode: payload.preferredWorkMode || null,
    preferred_base_city: payload.preferredBaseCity || null,
    current_status: payload.currentStatus || null,
    job_type: payload.jobType || null,
    specific_jd: payload.specificJD || null,
    reporting_comfort: payload.reportingComfort || null,
    training_expectation: payload.trainingExpectation || null,
    work_hours_flexibility: payload.workHoursFlexibility || null,
    leave_expectation: payload.leaveExpectation || null,
    expected_salary: payload.expectedSalary || null,
    open_to_negotiation: payload.openToNegotiation || null,
    department: payload.department || null,
    available_from: payload.availableFrom || null,
    weekly_commitment: payload.weeklyCommitment || null,
    technical_skills: payload.technicalSkills,
    soft_skills: payload.softSkills,
    certifications: payload.certifications,
    tools_platforms: payload.toolsPlatforms || null,
    portfolio_link: payload.portfolioLink || null,
    profile_link: payload.profileLink || null,
    resume_url: resumeUrl,
    preferred_work_culture: payload.preferredWorkCulture || null,
    eligibility_criteria: payload.eligibilityCriteria,
    documents_required: payload.documentsRequired,
    work_drives_you: payload.workDrivesYou || null,
    career_goals: payload.careerGoals || null,
    intro_video_url: introVideoUrl,
    special_notes: payload.specialNotes || null,
    seeking_employer_who: payload.seekingEmployerWho || null,
    visibility: payload.visibility.toLowerCase(),
    status: 'active',
  };

  const { data, error } = await supabase
    .from('job_seeker_profiles')
    .upsert(record, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SeekerProfile;
}

export async function fetchMySeekerProfile(): Promise<SeekerProfile | null> {
  const session = await requireSession();
  const userId = session.user.id;

  const { data, error } = await supabase
    .from('job_seeker_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as SeekerProfile | null;
}

export async function fetchAllEmployerPostings(): Promise<EmployerPosting[]> {
  await getAuthenticatedSession();

  const { data, error } = await supabase
    .from('employment_hub_postings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as EmployerPosting[];
}

export async function fetchAllSeekerProfiles(): Promise<SeekerProfile[]> {
  await getAuthenticatedSession();

  const { data, error } = await supabase
    .from('job_seeker_profiles')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SeekerProfile[];
}
