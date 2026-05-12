import type { UserProfile, EditProfileForm } from '../types/profile';

const MOCK_AVATAR = "https://www.figma.com/api/mcp/asset/3705c617-5e62-4578-acf8-8f5a2af9ff8f";

/** Build a profile from localStorage user data + defaults */
function buildProfileFromStorage(): UserProfile {
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : {};
  return {
    id: user.id ?? 'me',
    firstName: user.first_name ?? 'My',
    lastName: user.last_name ?? 'Profile',
    email: user.email ?? '',
    role: user.role ?? 'student',
    title: '',
    company: '',
    location: '',
    bio: '',
    avatarUrl: MOCK_AVATAR,
    coverUrl: '',
    skills: [],
    socialLinks: [],
    phone: '',
    languages: '',
    website: '',
    stats: { recommendations: 0, credibility: 0, achievement: 0 },
    isOwnProfile: true,
    isFollowing: false,
    reachFor: [],
  };
}

export async function fetchProfile(userId: string): Promise<UserProfile> {
  await new Promise((r) => setTimeout(r, 400));

  if (userId === 'me' || userId === localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') ?? '{}').id : false) {
    return buildProfileFromStorage();
  }

  // Mock other user
  return {
    id: userId,
    firstName: 'Michael',
    lastName: 'Anderson',
    email: 'michael@example.com',
    role: 'professional',
    title: 'UI/UX Designer',
    company: 'Accenture',
    location: 'Mumbai, India',
    bio: 'Passionate designer with 5+ years of experience crafting digital products that users love. Specializing in SaaS platforms and mobile apps.',
    avatarUrl: MOCK_AVATAR,
    coverUrl: '',
    skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'User Research', 'Wireframing'],
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/michael' },
      { platform: 'GitHub', url: 'https://github.com/michael' },
    ],
    phone: '+91 98765 43210',
    languages: 'English, Hindi',
    website: 'https://michael.design',
    stats: { recommendations: 183, credibility: 60, achievement: 48 },
    isOwnProfile: false,
    isFollowing: false,
    workSector: 'Private Sector',
    workIndustry: 'Information Technology (IT) and Business Process Management (BPM)',
    reachFor: ['Design Reviews', 'Mentorship', 'Freelance Projects'],
  };
}

export async function updateProfile(data: Partial<EditProfileForm>): Promise<void> {
  await new Promise((r) => setTimeout(r, 600));
  const existing = buildProfileFromStorage();
  const updated = { ...existing, ...data };
  // Persist name changes back to localStorage user
  const raw = localStorage.getItem('user');
  if (raw) {
    const user = JSON.parse(raw);
    user.first_name = updated.firstName;
    user.last_name = updated.lastName;
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export async function toggleFollow(userId: string, follow: boolean): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
}
