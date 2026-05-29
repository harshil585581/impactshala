const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getToken(): string {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "{}").access_token ?? "";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type Conversation = {
  id: string;
  peer_id: string;
  peer_name: string;
  peer_avatar: string | null;
  peer_title: string;
  last_message: string | null;
  last_message_at: string | null;
};

export type DirectMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: "text" | "image" | "file" | "audio";
  file_url: string | null;
  file_name: string | null;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
};

// ─── API calls ────────────────────────────────────────────────────────────────

export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_URL}/api/messages/conversations`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load conversations");
  const data = await res.json();
  return data.conversations;
}

export async function getOrCreateConversation(peerId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/messages/conversations`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ addressee_id: peerId }),
  });
  if (!res.ok) throw new Error("Failed to open conversation");
  const data = await res.json();
  return data.id;
}

export async function fetchMessages(convId: string): Promise<DirectMessage[]> {
  const res = await fetch(`${API_URL}/api/messages/conversations/${convId}/messages`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load messages");
  const data = await res.json();
  return data.messages;
}

export async function sendMessage(
  convId: string,
  content: string,
  options?: {
    message_type?: "text" | "image" | "file" | "audio";
    file_url?: string;
    file_name?: string;
    reply_to_id?: string;
  }
): Promise<DirectMessage> {
  const res = await fetch(`${API_URL}/api/messages/conversations/${convId}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      content,
      message_type: options?.message_type ?? "text",
      file_url: options?.file_url,
      file_name: options?.file_name,
      reply_to_id: options?.reply_to_id,
    }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function editMessage(msgId: string, content: string): Promise<DirectMessage> {
  const res = await fetch(`${API_URL}/api/messages/messages/${msgId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to edit message");
  return res.json();
}

export async function deleteMessage(msgId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/messages/messages/${msgId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete message");
}

export async function uploadFile(file: File): Promise<{ url: string; name: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/messages/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export function getCurrentUserId(): string {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "{}").id ?? "";
  } catch {
    return "";
  }
}
