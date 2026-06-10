import { createClient } from '@supabase/supabase-js';

function getAuthClient() {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  const token: string | undefined = stored?.access_token;
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined,
  );
}

function getUserId(): string {
  return JSON.parse(localStorage.getItem('user') ?? '{}').id ?? '';
}

export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'message' | 'post' | 'like' | 'comment' | 'connection';
  post_id: string | null;
  conversation_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    first_name: string | null;
    last_name: string | null;
    org_name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function fetchNotifications(): Promise<AppNotification[]> {
  const userId = getUserId();
  if (!userId) return [];
  const { data, error } = await getAuthClient()
    .from('notifications')
    .select('*, actor:users!notifications_actor_id_fkey(first_name, last_name, org_name, avatar_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  await getAuthClient().from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  await getAuthClient()
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

export async function dismissNotification(id: string): Promise<void> {
  await getAuthClient().from('notifications').delete().eq('id', id);
}

export async function dismissAllNotifications(): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  await getAuthClient().from('notifications').delete().eq('user_id', userId);
}
