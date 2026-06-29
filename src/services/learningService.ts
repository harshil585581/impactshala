import { supabase as _supabase, getAuthenticatedSession } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getAuthenticatedSession();
  const token = session?.access_token ?? '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type CourseApplicationStatus = 'applied' | 'not_a_fit' | 'maybe' | 'goodfit';

export type CourseFilters = {
  programLevel?: 'school' | 'college' | 'professional';
  mode?: string;
};

export type CourseRecord = {
  id: string;
  program_level: string;
  title: string;
  course_mode: string;
  venue: string | null;
  online_access: string | null;
  visibility: string;
  status: string;
  thumbnail_url: string | null;
  brochure_url: string | null;
  admission_for: string[];
  education_board: string | null;
  board_affiliation: string | null;
  grades_for: string[];
  academic_levels: string[];
  college_stream: string | null;
  course_levels: string[];
  pro_stream: string | null;
  curriculum_features: Record<string, string[]>;
  languages: string[];
  duration: string | null;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  last_date_to_apply: string | null;
  certification: string | null;
  other_benefits: string | null;
  career_outcomes: string | null;
  eligibility_criteria: string[];
  required_documents: string[];
  fee_type: string | null;
  description: string | null;
  created_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    org_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type CreateCoursePayload = {
  programLevel: string;
  courseTitle: string;
  courseMode: string;
  venue: string;
  onlineAccess: string;
  visibility: string;
  admissionFor: string[];
  educationBoard: string;
  boardAffiliation: string;
  gradesFor: string[];
  academicLevels: string[];
  collegeStream: string;
  courseLevels: string[];
  proStream: string;
  features: Record<string, string[]>;
  languages: string[];
  duration: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  lastDateToApply: string;
  certification: string;
  otherBenefits: string;
  careerOutcomes: string;
  eligibility: string[];
  documents: string[];
  feeType: string;
  description: string;
  thumbnailUrl?: string;
  brochureUrl?: string;
};

export async function fetchCourses(filters: CourseFilters = {}): Promise<CourseRecord[]> {
  const params = new URLSearchParams();
  if (filters.programLevel) params.set('program_level', filters.programLevel);
  if (filters.mode) params.set('mode', filters.mode);

  const res = await fetch(`${API_URL}/api/learning/courses?${params}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function createCourse(data: CreateCoursePayload): Promise<CourseRecord> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/learning/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      program_level: data.programLevel,
      title: data.courseTitle,
      course_mode: data.courseMode,
      venue: data.venue || null,
      online_access: data.onlineAccess || null,
      visibility: data.visibility,
      admission_for: data.admissionFor,
      education_board: data.educationBoard || null,
      board_affiliation: data.boardAffiliation || null,
      grades_for: data.gradesFor,
      academic_levels: data.academicLevels,
      college_stream: data.collegeStream || null,
      course_levels: data.courseLevels,
      pro_stream: data.proStream || null,
      curriculum_features: data.features,
      languages: data.languages,
      duration: data.duration || null,
      start_date: data.startDate || null,
      start_time: data.startTime || null,
      end_date: data.endDate || null,
      end_time: data.endTime || null,
      last_date_to_apply: data.lastDateToApply || null,
      certification: data.certification || null,
      other_benefits: data.otherBenefits || null,
      career_outcomes: data.careerOutcomes || null,
      eligibility_criteria: data.eligibility,
      required_documents: data.documents,
      fee_type: data.feeType || null,
      description: data.description || null,
      thumbnail_url: data.thumbnailUrl || null,
      brochure_url: data.brochureUrl || null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? 'Failed to create course');
  }
  return res.json();
}

export async function uploadCourseImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/api/upload/course-image`, {
    method: 'POST',
    headers: await authHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload image');
  const { url } = await res.json() as { url: string };
  return url;
}

export type MyCourse = {
  id: string;
  title: string;
  program_level: string;
  course_mode: string;
  status: string;
  created_at: string;
  eligibility_criteria: string[];
  required_documents: string[];
};

export type CourseApplication = {
  id: string;
  course_id: string;
  user_id: string | null;
  applicant_name: string;
  applicant_email: string;
  applicant_mobile: string | null;
  message: string | null;
  document_urls: string[];
  status: CourseApplicationStatus;
  created_at: string;
  user_profile?: {
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
    org_name: string | null;
    resume_signed_url?: string | null;
  } | null;
  experiences?: Array<{
    role: string; company: string; emp_type: string | null;
    start_month: string | null; start_year: string | null;
    end_month: string | null; end_year: string | null;
    is_current: boolean; location: string | null;
  }>;
  educations?: Array<{
    school: string; level: string | null; field_of_study: string | null;
    start_date: string | null; end_date: string | null;
  }>;
};

export async function fetchMyCourses(): Promise<MyCourse[]> {
  const headers = await authHeaders();
  if (!headers.Authorization) return [];
  const res = await fetch(`${API_URL}/api/learning/my-courses`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCourseApplications(courseId: string): Promise<CourseApplication[]> {
  const headers = await authHeaders();
  if (!headers.Authorization) return [];
  const res = await fetch(`${API_URL}/api/learning/my-courses/${courseId}/applications`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCourseApplicationCountsBatch(courseIds: string[]): Promise<Map<string, number>> {
  if (!courseIds.length) return new Map();
  await getAuthenticatedSession();
  const { data } = await _supabase
    .from('course_applications')
    .select('course_id')
    .in('course_id', courseIds);
  const map = new Map<string, number>();
  (data ?? []).forEach((r: { course_id: string }) => {
    map.set(r.course_id, (map.get(r.course_id) ?? 0) + 1);
  });
  return map;
}

export type MyLearningApplication = {
  id: string;
  course_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_mobile: string | null;
  message: string | null;
  document_urls: string[];
  status: CourseApplicationStatus;
  created_at: string;
  course: {
    id: string;
    title: string;
    program_level: string;
    course_mode: string;
    status: string;
  } | null;
};

export async function fetchMyLearningApplications(): Promise<MyLearningApplication[]> {
  await getAuthenticatedSession();
  const { data: { session } } = await _supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return [];
  const { data, error } = await _supabase
    .from('course_applications')
    .select('id, course_id, applicant_name, applicant_email, applicant_mobile, message, document_urls, status, created_at, course:learning_courses(id, title, program_level, course_mode, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (!error) return (data ?? []) as unknown as MyLearningApplication[];

  // Fallback: status column may not exist yet — query without it
  const { data: data2, error: error2 } = await _supabase
    .from('course_applications')
    .select('id, course_id, applicant_name, applicant_email, applicant_mobile, message, document_urls, created_at, course:learning_courses(id, title, program_level, course_mode, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error2) throw new Error(error2.message);
  return ((data2 ?? []) as unknown as Omit<MyLearningApplication, 'status'>[]).map(
    a => ({ ...a, status: 'applied' as CourseApplicationStatus }),
  );
}

export async function updateCourseApplicationStatus(appId: string, status: CourseApplicationStatus): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/learning/applications/${appId}/status`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
}

export async function withdrawLearningApplication(appId: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/learning/applications/${appId}/withdraw`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to withdraw application');
}

export async function applyToCourse(
  courseId: string,
  application: { name: string; email: string; mobile: string; message: string },
  documents: (File | null)[],
): Promise<void> {
  const formData = new FormData();
  formData.append('applicant_name', application.name);
  formData.append('applicant_email', application.email);
  if (application.mobile) formData.append('applicant_mobile', application.mobile);
  if (application.message) formData.append('message', application.message);
  documents.forEach((doc) => {
    if (doc) formData.append('documents', doc);
  });

  const res = await fetch(`${API_URL}/api/learning/courses/${courseId}/apply`, {
    method: 'POST',
    headers: await authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? 'Failed to submit application');
  }
}
