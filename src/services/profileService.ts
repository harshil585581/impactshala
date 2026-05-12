import type { UserProfile, EditProfileForm } from '../types/profile';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function getToken(): string {
  const user = JSON.parse(localStorage.getItem('user') ?? '{}');
  return user.access_token ?? '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
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
  };
}

export async function fetchProfile(userId: string): Promise<UserProfile> {
  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isOwn = userId === 'me' || userId === storedUser.id;

  const endpoint = isOwn
    ? `${API_URL}/api/profile`
    : `${API_URL}/api/profile/${userId}`;

  const res = await fetch(endpoint, { headers: authHeaders() });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return mapApiToProfile(data, isOwn);
}

export async function updateProfile(data: Partial<EditProfileForm>): Promise<void> {
  // Map camelCase back to snake_case for API
  const payload: Record<string, unknown> = {};
  if (data.firstName !== undefined) payload.first_name = data.firstName;
  if (data.lastName !== undefined) payload.last_name = data.lastName;
  if (data.title !== undefined) payload.title = data.title;
  if (data.company !== undefined) payload.company = data.company;
  if (data.location !== undefined) payload.location = data.location;
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.languages !== undefined) payload.languages = data.languages;
  if (data.website !== undefined) payload.website = data.website;
  if (data.skills !== undefined) payload.skills = data.skills;
  if (data.socialLinks !== undefined) payload.social_links = data.socialLinks;
  if (data.reachFor !== undefined) payload.reach_for = data.reachFor;

  const res = await fetch(`${API_URL}/api/profile`, {
    method: 'PATCH',
    headers: authHeaders(),
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
  // Placeholder — follow system not yet implemented in backend
  await new Promise((r) => setTimeout(r, 300));
  console.log(`${follow ? 'Following' : 'Unfollowing'} user ${userId}`);
}
