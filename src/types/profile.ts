export type UserRole = 'student' | 'professional' | 'entrepreneur' | 'educator';

export interface SocialLink {
  platform: string;
  url: string;
}

export interface ProfileStats {
  recommendations: number;
  credibility: number;
  achievement: number;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  title: string;           // e.g. "UI/UX Designer"
  company: string;         // e.g. "Accenture"
  location: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  skills: string[];
  socialLinks: SocialLink[];
  phone: string;
  languages: string;
  stats: ProfileStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
  // Role-specific
  workSector?: string;
  workIndustry?: string;
  teachSubject?: string;
  experience?: string;
  entrepreneurType?: 'established' | 'aspiring';
  describeAs?: string;
  website?: string;
  reachFor: string[];
}

export interface EditProfileForm {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  location: string;
  bio: string;
  phone: string;
  languages: string;
  website: string;
  skills: string[];
  socialLinks: SocialLink[];
  reachFor: string[];
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
