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

function getToken(): string {
  try {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    return user.access_token ?? "";
  } catch {
    return "";
  }
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
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
  slug: string;
  opportunityNotes?: string;
  description?: string;
  onsiteVenue?: string;
  onlineAccess?: string;
  eligibilityCriteria?: string;
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
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const page: DiscoverFeedPage = await res.json();
  return { ...page, items: page.items.map(normalizeItem) };
}

export async function fetchDiscoverSearch(q: string): Promise<DiscoverItem[]> {
  const res = await fetch(
    `${API_URL}/api/discover/search?q=${encodeURIComponent(q)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`${res.status}`);
  const items: DiscoverItem[] = await res.json();
  return items.map(normalizeItem);
}

export async function fetchTrending(): Promise<DiscoverItem[]> {
  const res = await fetch(`${API_URL}/api/discover/trending`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const items: DiscoverItem[] = await res.json();
  return items.map(normalizeItem);
}

export async function trackImpression(postId: string): Promise<void> {
  await fetch(`${API_URL}/api/discover/track`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ postId }),
  });
}

export async function toggleBookmark(
  postId: string,
  bookmarked: boolean
): Promise<void> {
  const res = await fetch(`${API_URL}/api/discover/bookmark`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ postId, bookmarked }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

export type ApplicationPayload = {
  postId: string;
  name: string;
  email: string;
  phone: string;
  documents: File[];
};

export async function submitApplication(
  payload: ApplicationPayload
): Promise<void> {
  const form = new FormData();
  form.append("postId", payload.postId);
  form.append("name", payload.name);
  form.append("email", payload.email);
  form.append("phone", payload.phone);
  payload.documents.forEach((f) => form.append("documents", f));

  const res = await fetch(`${API_URL}/api/discover/apply`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
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
  eligibilityCriteria?: string;
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
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${res.status}`);
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
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function uploadCoverImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/discover/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return data.url as string;
}
