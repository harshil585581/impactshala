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

export interface ProfileData {
  id: string;
  user_type: string;
  role: string;
  email: string;
  first_name: string;
  last_name: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  languages?: string;
  skills?: string[];
  social_links?: { platform: string; url: string }[];
  reach_for?: string[];
  work_sector?: string;
  work_industry?: string;
  teach_subject?: string;
  experience_years?: string;
  entrepreneur_type?: 'established' | 'aspiring';
  describe_as?: string;
  website?: string;
  setup_complete?: boolean;
  education_level?: string;
  institute_name?: string;
  resume_url?: string;
}

export async function fetchMyProfile(): Promise<ProfileData> {
  const res = await fetch(`${API_URL}/api/profile`, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${res.status}: ${err.detail ?? 'Failed to fetch profile'}`);
  }
  return res.json();
}

export async function uploadProfileImage(file: File, imageType: 'avatar' | 'cover'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image_type', imageType);
  const res = await fetch(`${API_URL}/api/upload/profile-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Upload failed');
  }
  const data = await res.json();
  return data.url as string;
}

export async function uploadDocument(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/api/upload/document`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Upload failed');
  }
  const data = await res.json();
  return data.url as string;
}

export async function saveProfile(data: Partial<ProfileData>): Promise<ProfileData> {
  // Remove undefined/null — only send changed fields
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
  );
  const res = await fetch(`${API_URL}/api/profile`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Failed to save profile');
  }
  return res.json();
}
