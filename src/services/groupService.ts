import { getAuthedClient, getAuthenticatedSession } from '../lib/supabase';

function getCurrentUserId(): string {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  return stored?.id ?? '';
}

export type GroupChat = {
  id: string;
  name: string;
  avatar_color: string;
  created_by: string;
  created_at: string;
  member_count: number;
};

export type GroupMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name?: string;
  content: string | null;
  message_type: 'text' | 'image' | 'file' | 'audio';
  file_url: string | null;
  file_name: string | null;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
};

export type GroupMemberRow = {
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    org_name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function fetchUserGroups(): Promise<GroupChat[]> {
  const session = await getAuthenticatedSession();
  const userId = session?.user?.id ?? getCurrentUserId();
  if (!userId) return [];

  const db = getAuthedClient();

  const { data, error } = await db
    .from('group_members')
    .select('group_chats(id, name, avatar_color, created_by, created_at)')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  const rawGroups = ((data ?? []) as { group_chats: Omit<GroupChat, 'member_count'> | null }[])
    .map((r) => r.group_chats)
    .filter((g): g is Omit<GroupChat, 'member_count'> => g !== null);

  const ids = rawGroups.map((g) => g.id);
  if (!ids.length) return [];

  const { data: counts } = await db
    .from('group_members')
    .select('group_id')
    .in('group_id', ids);

  const countMap: Record<string, number> = {};
  for (const row of (counts ?? []) as { group_id: string }[]) {
    countMap[row.group_id] = (countMap[row.group_id] ?? 0) + 1;
  }

  return rawGroups.map((g) => ({ ...g, member_count: countMap[g.id] ?? 0 }));
}

export async function createGroup(name: string, memberIds: string[]): Promise<GroupChat> {
  const session = await getAuthenticatedSession();
  if (!session) throw new Error('Session expired — please refresh the page and try again.');
  const userId = session.user.id;

  const db = getAuthedClient();

  const colors = ['#8b5cf6', '#f77f00', '#6366f1', '#ec4899', '#0ea5e9', '#10b981', '#4f46e5', '#f59e0b'];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const { data: group, error: groupErr } = await db
    .from('group_chats')
    .insert({ name, avatar_color: avatarColor, created_by: userId })
    .select()
    .single();

  if (groupErr) throw new Error(groupErr.message);

  // Insert creator as owner FIRST — other member inserts check that the owner row exists (RLS)
  const { error: ownerErr } = await db
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'owner' });
  if (ownerErr) throw new Error(ownerErr.message);

  const otherIds = memberIds.filter((id) => id !== userId);
  let memberCount = 1;
  if (otherIds.length > 0) {
    const otherMembers = otherIds.map((id) => ({ group_id: group.id, user_id: id, role: 'member' }));
    const { error: membersErr } = await db.from('group_members').insert(otherMembers);
    if (membersErr) throw new Error(membersErr.message);
    memberCount += otherIds.length;
  }

  return { ...group, member_count: memberCount } as GroupChat;
}

export async function fetchGroupMessages(groupId: string, limit = 60): Promise<GroupMessage[]> {
  const db = getAuthedClient();

  const { data, error } = await db
    .from('group_messages')
    .select('*, sender:users!group_messages_sender_id_fkey(first_name, last_name, org_name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((m: GroupMessage & { sender: { first_name: string | null; last_name: string | null; org_name: string | null } | null }) => {
    const s = m.sender;
    const senderName = s
      ? [s.first_name, s.last_name].filter(Boolean).join(' ') || s.org_name || 'User'
      : 'User';
    return { ...m, sender_name: senderName };
  });
}

export async function sendGroupMessage(
  groupId: string,
  content: string,
  options?: {
    message_type?: 'text' | 'image' | 'file' | 'audio';
    file_url?: string;
    file_name?: string;
    reply_to_id?: string;
  }
): Promise<GroupMessage> {
  const session = await getAuthenticatedSession();
  if (!session) throw new Error('Session expired — please refresh the page.');
  const userId = session.user.id;

  const db = getAuthedClient();

  const { data, error } = await db
    .from('group_messages')
    .insert({
      group_id: groupId,
      sender_id: userId,
      content,
      message_type: options?.message_type ?? 'text',
      file_url: options?.file_url ?? null,
      file_name: options?.file_name ?? null,
      reply_to_id: options?.reply_to_id ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as GroupMessage;
}

export async function editGroupMessage(msgId: string, content: string): Promise<void> {
  const db = getAuthedClient();
  const { error } = await db
    .from('group_messages')
    .update({ content, is_edited: true })
    .eq('id', msgId);
  if (error) throw new Error(error.message);
}

export async function deleteGroupMessage(msgId: string): Promise<void> {
  const db = getAuthedClient();
  const { error } = await db
    .from('group_messages')
    .update({ is_deleted: true, content: null })
    .eq('id', msgId);
  if (error) throw new Error(error.message);
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMemberRow[]> {
  const db = getAuthedClient();
  const { data, error } = await db
    .from('group_members')
    .select('user_id, role, joined_at, user:users!group_members_user_id_fkey(first_name, last_name, org_name, avatar_url)')
    .eq('group_id', groupId);
  if (error) throw new Error(error.message);
  return (data ?? []) as GroupMemberRow[];
}

export async function addGroupMembers(groupId: string, userIds: string[]): Promise<void> {
  const db = getAuthedClient();
  const rows = userIds.map((id) => ({ group_id: groupId, user_id: id, role: 'member' as const }));
  const { error } = await db.from('group_members').insert(rows);
  if (error) throw new Error(error.message);
}

export async function leaveGroup(groupId: string): Promise<void> {
  const session = await getAuthenticatedSession();
  const userId = session?.user?.id ?? getCurrentUserId();
  if (!userId) throw new Error('Not logged in');

  const db = getAuthedClient();
  const { error } = await db
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function deleteGroup(groupId: string): Promise<void> {
  const db = getAuthedClient();
  // Delete messages, members, then the group
  await db.from('group_messages').delete().eq('group_id', groupId);
  await db.from('group_members').delete().eq('group_id', groupId);
  const { error } = await db.from('group_chats').delete().eq('id', groupId);
  if (error) throw new Error(error.message);
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  const db = getAuthedClient();
  const { error } = await db
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function updateGroupName(groupId: string, name: string): Promise<void> {
  const db = getAuthedClient();
  const { error } = await db
    .from('group_chats')
    .update({ name })
    .eq('id', groupId);
  if (error) throw new Error(error.message);
}
