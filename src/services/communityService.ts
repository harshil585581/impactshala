import { getFreshToken } from "../lib/authToken";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getFreshToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export type CommunityUser = {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar_url: string | null;
  cover_url: string | null;
  endorsement_count?: number;
  review_count?: number;
  achievement_count?: number;
  mutual_connections?: number;
};

export type Connection = CommunityUser & {
  connection_id: string;
  connected_at: string;
};

export type PendingRequest = CommunityUser & {
  request_id: string;
  requested_at: string;
};

export type SentRequest = CommunityUser & {
  request_id: string;
  sent_at: string;
};

export async function fetchConnections(q?: string): Promise<{ connections: Connection[]; total: number }> {
  const url = new URL(`${API_URL}/api/community/connections`);
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString(), { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch connections");
  return res.json();
}

export async function fetchPendingRequests(): Promise<{ requests: PendingRequest[] }> {
  const res = await fetch(`${API_URL}/api/community/pending`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch pending requests");
  return res.json();
}

export async function fetchSuggestions(): Promise<{ suggestions: CommunityUser[] }> {
  const res = await fetch(`${API_URL}/api/community/suggestions`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch suggestions");
  return res.json();
}

export async function sendConnectionRequest(addresseeId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/community/request`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ addressee_id: addresseeId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Failed to send request");
  }
}

export async function acceptRequest(requestId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/community/accept/${requestId}`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to accept request");
}

export async function rejectOrCancelRequest(requestId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/community/reject/${requestId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove request");
}

export async function fetchSentRequests(): Promise<{ requests: SentRequest[] }> {
  const res = await fetch(`${API_URL}/api/community/sent`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch sent requests");
  return res.json();
}

export async function removeConnection(peerId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/community/remove/${peerId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove connection");
}

export interface ProfileMember {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar_url: string | null;
  user_type: string;
}

export async function fetchProfileCommunityMembers(
  profileUserId: string,
  q?: string,
  userType?: string,
): Promise<{ members: ProfileMember[]; total: number; restricted: boolean }> {
  const url = new URL(`${API_URL}/api/community/members/${profileUserId}`);
  if (q) url.searchParams.set('q', q);
  if (userType) url.searchParams.set('user_type', userType);
  const res = await fetch(url.toString(), { headers: await authHeaders() });
  if (!res.ok) return { members: [], total: 0, restricted: false };
  return res.json();
}

export async function searchMentionableUsers(q?: string): Promise<{ users: CommunityUser[] }> {
  const url = new URL(`${API_URL}/api/mentions/search`);
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString(), { headers: await authHeaders() });
  if (!res.ok) return { users: [] };
  return res.json();
}
