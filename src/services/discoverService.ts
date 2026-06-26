import { getFreshToken } from "../lib/authToken";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/** Prepend API_URL to relative paths so images load correctly in the browser. */
function absUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function normalizeItem(item: DiscoverItem): DiscoverItem {
  return { ...item, imageUrl: absUrl(item.imageUrl), avatarUrl: absUrl(item.avatarUrl) };
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getFreshToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export type DiscoverItem = {
  id: string;
  type: "provider" | "seeker";
  avatarUrl: string;
  name: string;
  role: string;
  company: string;
  postedAt: string;
  badge: string;
  title: string;
  categoryTag: string;
  subTags: string;
  mode: string;
  payment: string;
  targetAudience: string;
  lastDate: string;
  imageUrl: string;
  body: string;
  reactions: number;
  comments: number;
  isBookmarked: boolean;
  isLiked?: boolean;
  slug: string;
  opportunityNotes?: string;
  description?: string;
  onsiteVenue?: string;
  onlineAccess?: string;
  eligibilityCriteria?: string[];
  documentsRequired?: string[];
  communicationLanguage?: string;
  levelOfParticipant?: string;
  educationalLevel?: string;
  eventOccurrence?: string;
  address?: string;
};

export type DiscoverFeedPage = {
  items: DiscoverItem[];
  nextCursor: string | null;
};

export type DiscoverFeedParams = {
  cursor?: string;
  q?: string;
  orgType?: string;
  tags?: string;
  city?: string;
  radiusKm?: number;
  tab?: "providers" | "seekers";
  category?: string;
  subCategory?: string;
  deliveryMode?: string;
  payment?: string;
  levelOfParticipant?: string;
};

export async function fetchDiscoverPost(postId: string): Promise<DiscoverItem> {
  const res = await fetch(`${API_URL}/api/discover/post/${postId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const item: DiscoverItem = await res.json();
  return normalizeItem(item);
}

export async function fetchDiscoverFeed(
  params: DiscoverFeedParams = {}
): Promise<DiscoverFeedPage> {
  const query = new URLSearchParams();
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.q) query.set("q", params.q);
  if (params.orgType) query.set("orgType", params.orgType);
  if (params.tags) query.set("tags", params.tags);
  if (params.city) query.set("city", params.city);
  if (params.radiusKm) query.set("radiusKm", String(params.radiusKm));
  if (params.tab) query.set("tab", params.tab);
  if (params.category) query.set("category", params.category);
  if (params.subCategory) query.set("subCategory", params.subCategory);
  if (params.deliveryMode) query.set("deliveryMode", params.deliveryMode);
  if (params.payment) query.set("payment", params.payment);
  if (params.levelOfParticipant)
    query.set("levelOfParticipant", params.levelOfParticipant);

  const res = await fetch(`${API_URL}/api/discover/feed?${query}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const page: DiscoverFeedPage = await res.json();
  return { ...page, items: page.items.map(normalizeItem) };
}

export async function fetchDiscoverSearch(q: string): Promise<DiscoverItem[]> {
  const res = await fetch(
    `${API_URL}/api/discover/search?q=${encodeURIComponent(q)}`,
    { headers: await authHeaders() }
  );
  if (!res.ok) throw new Error(`${res.status}`);
  const items: DiscoverItem[] = await res.json();
  return items.map(normalizeItem);
}

export async function fetchTrending(): Promise<DiscoverItem[]> {
  const res = await fetch(`${API_URL}/api/discover/trending`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const items: DiscoverItem[] = await res.json();
  return items.map(normalizeItem);
}

export async function trackImpression(postId: string): Promise<void> {
  await fetch(`${API_URL}/api/discover/track`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ postId }),
  });
}

export async function toggleReaction(
  postId: string
): Promise<{ reacted: boolean; count: number }> {
  const res = await fetch(`${API_URL}/api/discover/react`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ postId }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function toggleBookmark(
  postId: string,
  bookmarked: boolean
): Promise<void> {
  const res = await fetch(`${API_URL}/api/discover/bookmark`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ postId, bookmarked }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

export type ApplicationPayload = {
  postId: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  documents: File[];
  documentLabels?: string[];
};

export async function submitApplication(
  payload: ApplicationPayload
): Promise<void> {
  const form = new FormData();
  form.append("postId", payload.postId);
  form.append("name", payload.name);
  form.append("email", payload.email);
  form.append("phone", payload.phone);
  if (payload.message) form.append("message", payload.message);
  payload.documents.forEach((f, i) => {
    form.append("documents", f);
    form.append("document_labels", payload.documentLabels?.[i] ?? f.name);
  });

  const res = await fetch(`${API_URL}/api/discover/apply`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getFreshToken()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

export type ProviderPostPayload = {
  type: "opportunity" | "service";
  domain: string;
  nature: string;
  keyword?: string;
  targetAudience: string;
  educationalLevel?: string;
  eventOccurrence: "one_day" | "weekly" | "custom_multi_day";
  title: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  deliveryMode?: string;
  address?: string;
  communicationLanguage?: string;
  levelOfParticipant?: string;
  eligibilityCriteria?: string[];
  documentsRequired?: string[];
  lastDateToApply?: string;
  fee?: string;
  onsiteVenue?: string;
  onlineAccess?: string;
  description?: string;
  coverImageUrl?: string;
  visibleTo: "public" | "community";
  weeklySlots?: { day: string; startTime: string; endTime: string }[];
};

export async function createProviderPost(
  payload: ProviderPostPayload
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/api/discover/create/provider`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail ? JSON.stringify(body.detail) : `${res.status}`;
    throw new Error(detail);
  }
  return res.json();
}

export type SeekerPostPayload = {
  title: string;
  professionalLevel?: string;
  address?: string;
  canPay: boolean;
  budget?: string;
  providerPreferences?: string;
  preferredDate?: string;
  description?: string;
  coverImageUrl?: string;
  visibleTo: "public" | "community";
};

export async function createSeekerPost(
  payload: SeekerPostPayload
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/api/discover/create/seeker`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export type DiscoverMyPost = {
  id: string;
  title: string;
  domain: string;
  nature: string;
  deliveryMode: string;
  address: string;
  imageUrl: string;
  eligibilityCriteria: string[];
  documentsRequired: string[];
  status: string;
  createdAt: string;
  applicant_count?: number;
};

export type MyDiscoverApplication = {
  id: string;
  post_id: string;
  status: "applied" | "not_a_fit" | "maybe" | "goodfit";
  created_at: string;
  post?: {
    title: string;
    domain: string;
    nature: string;
    address: string;
    delivery_mode: string;
  };
  post_creator?: {
    org_name: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

export type DiscoverApplication = {
  id: string;
  post_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  message?: string;
  status: "applied" | "not_a_fit" | "maybe" | "goodfit";
  created_at: string;
  document_data?: Array<{ name: string; url: string }>;
  user_profile?: {
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
    org_name: string | null;
    resume_signed_url?: string | null;
  };
  seeker_profile?: {
    career_goals: string | null;
    work_drives_you: string | null;
    current_location: string | null;
    job_industry: string | null;
    department: string | null;
    technical_skills: string[] | null;
    soft_skills: string[] | null;
    institute_name: string | null;
    education_level: string | null;
  };
  experiences?: Array<{
    role: string;
    company: string;
    emp_type: string | null;
    start_month: string | null;
    start_year: string | null;
    end_month: string | null;
    end_year: string | null;
    is_current: boolean;
    location: string | null;
  }>;
  educations?: Array<{
    school: string;
    level: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
  }>;
};

export type DiscoverApplicationStatus = "applied" | "not_a_fit" | "maybe" | "goodfit";

export async function fetchMyDiscoverPosts(): Promise<DiscoverMyPost[]> {
  const res = await fetch(`${API_URL}/api/discover/my-posts`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function fetchDiscoverPostApplications(postId: string): Promise<DiscoverApplication[]> {
  const res = await fetch(`${API_URL}/api/discover/posts/${postId}/applications`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function deleteDiscoverApplication(appId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/discover/applications/${appId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

export async function updateDiscoverApplicationStatus(
  appId: string,
  status: DiscoverApplicationStatus,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/discover/applications/${appId}/status`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

export async function fetchMyDiscoverApplications(): Promise<MyDiscoverApplication[]> {
  const res = await fetch(`${API_URL}/api/discover/my-applications`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function withdrawDiscoverApplication(appId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/discover/applications/${appId}/withdraw`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

export async function uploadCoverImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/discover/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getFreshToken()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return data.url as string;
}
