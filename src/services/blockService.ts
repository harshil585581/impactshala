import { getFreshToken } from "../lib/authToken";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getFreshToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface BlockedUser {
  id: string;
  name: string;
  user_type: string;
}

export async function blockUser(targetId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/block/${targetId}`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to block user");
}

export async function unblockUser(targetId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/block/${targetId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to unblock user");
}

export async function fetchBlockedUsers(): Promise<BlockedUser[]> {
  const res = await fetch(`${API_URL}/api/blocks`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch blocked users");
  const data = await res.json();
  return data.blocked as BlockedUser[];
}

export async function fetchIsBlocked(targetId: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/block/${targetId}/status`, {
    headers: await authHeaders(),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.is_blocked as boolean;
}

export async function fetchBlockedMeIds(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/blocks/blocked-me`, {
    headers: await authHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.blocked_by as string[];
}
