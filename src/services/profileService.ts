import { getAuthenticatedSession } from '../lib/supabase';
import { followUser, unfollowUser } from './followService';
import type { UserProfile, EditProfileForm } from '../types/profile';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getAuthenticatedSession();
  const token = session?.access_token ?? '';
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// Map snake_case API response → camelCase UserProfile
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToProfile(data: any, isOwn: boolean): UserProfile {
  return {
    id: data.id,
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    email: data.email ?? '',
    role: data.role ?? 'student',
    userType: data.user_type ?? 'individual',
    orgType: data.org_type ?? '',
    title: data.title ?? '',
    company: data.company ?? '',
    location: data.location ?? '',
    bio: data.bio ?? '',
    avatarUrl: data.avatar_url ?? '',
    coverUrl: data.cover_url ?? '',
    skills: data.skills ?? [],
    socialLinks: data.social_links ?? [],
    phone: '',
    languages: data.languages ?? '',
    website: data.website ?? '',
    stats: { recommendations: 0, credibility: 0, achievement: 0 },
    isOwnProfile: isOwn,
    isFollowing: false,
    workSector: data.work_sector,
    workIndustry: data.work_industry,
    teachSubject: data.teach_subject,
    experience: data.experience_years,
    entrepreneurType: data.entrepreneur_type,
    describeAs: data.describe_as,
    reachFor: data.reach_for ?? [],
    resumeUrl: data.resume_url,
    educationLevel: data.education_level,
    instituteName: data.institute_name,
    orgName: data.org_name,
    sector: data.sector,
    eduLevelsOffered: data.edu_levels_offered ?? [],
    applicableIndustries: data.applicable_industries ?? [],
    services: data.services ?? [],
    industries: data.industries ?? [],
  };
}

export async function fetchProfile(userId: string): Promise<UserProfile> {
  const session = await getAuthenticatedSession();
  const currentUserId = session?.user?.id ?? '';
  const isOwn = userId === 'me' || (!!currentUserId && userId === currentUserId);

  const endpoint = isOwn
    ? `${API_URL}/api/profile`
    : `${API_URL}/api/profile/${userId}`;

  const res = await fetch(endpoint, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return mapApiToProfile(data, isOwn);
}

export async function updateProfile(data: Partial<EditProfileForm>): Promise<void> {
  // Map camelCase back to snake_case for API
  const payload: Record<string, unknown> = {};
  if (data.firstName !== undefined) payload.first_name = data.firstName;
  if (data.lastName !== undefined) payload.last_name = data.lastName;
  if (data.orgName !== undefined) payload.org_name = data.orgName;
  if (data.title !== undefined) payload.title = data.title;
  if (data.company !== undefined) payload.company = data.company;
  if (data.location !== undefined) payload.location = data.location;
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.languages !== undefined) payload.languages = data.languages;
  if (data.website !== undefined) payload.website = data.website;
  if (data.skills !== undefined) payload.skills = data.skills;
  if (data.services !== undefined) payload.services = data.services;
  if (data.socialLinks !== undefined) payload.social_links = data.socialLinks;
  if (data.reachFor !== undefined) payload.reach_for = data.reachFor;
  if (data.educationLevel !== undefined) payload.education_level = data.educationLevel;
  if (data.instituteName !== undefined) payload.institute_name = data.instituteName;
  if (data.workSector !== undefined) payload.work_sector = data.workSector;
  if (data.workIndustry !== undefined) payload.work_industry = data.workIndustry;
  if (data.experience !== undefined) payload.experience_years = data.experience;
  if (data.entrepreneurType !== undefined) payload.entrepreneur_type = data.entrepreneurType;
  if (data.describeAs !== undefined) payload.describe_as = data.describeAs;
  if (data.teachSubject !== undefined) payload.teach_subject = data.teachSubject;

  const res = await fetch(`${API_URL}/api/profile`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Failed to update profile');
  }

  // Sync name back to localStorage
  const updated = await res.json();
  const raw = localStorage.getItem('user');
  if (raw) {
    const user = JSON.parse(raw);
    user.first_name = updated.first_name;
    user.last_name = updated.last_name;
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export async function toggleFollow(userId: string, follow: boolean): Promise<void> {
  if (follow) await followUser(userId);
  else await unfollowUser(userId);
}
