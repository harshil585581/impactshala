const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch connections");
  return res.json();
}

export async function fetchPendingRequests(): Promise<{ requests: PendingRequest[] }> {
  const res = await fetch(`${API_URL}/api/community/pending`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch pending requests");
  return res.json();
}

export async function fetchSuggestions(): Promise<{ suggestions: CommunityUser[] }> {
  const res = await fetch(`${API_URL}/api/community/suggestions`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch suggestions");
  return res.json();
}

export async function sendConnectionRequest(addresseeId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/community/request`, {
    method: "POST",
    headers: authHeaders(),
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
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to accept request");
}

export async function rejectOrCancelRequest(requestId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/community/reject/${requestId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove request");
}

export async function fetchSentRequests(): Promise<{ requests: SentRequest[] }> {
  const res = await fetch(`${API_URL}/api/community/sent`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch sent requests");
  return res.json();
}

export async function removeConnection(peerId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/community/remove/${peerId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove connection");
}
