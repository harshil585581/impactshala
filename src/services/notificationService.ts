import { createClient } from '@supabase/supabase-js';

export type NotificationType =
  | 'message'
  | 'job_alert'
  | 'employment'
  | 'application'
  | 'payment'
  | 'course'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  action_url?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

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
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  return stored?.id ?? '';
}

export async function fetchNotifications(
  limit = 20,
  offset = 0,
  onlyUnread = false,
): Promise<Notification[]> {
  const userId = getUserId();
  if (!userId) return [];

  let query = getAuthClient()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (onlyUnread) query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Notification[];
}

export async function fetchUnreadCount(): Promise<number> {
  const userId = getUserId();
  if (!userId) return 0;

  const { count, error } = await getAuthClient()
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count ?? 0;
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await getAuthClient()
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function markAllAsRead(): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  const { error } = await getAuthClient()
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await getAuthClient()
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export interface CreateNotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(payload: CreateNotificationPayload): Promise<void> {
  const { error } = await getAuthClient()
    .from('notifications')
    .insert(payload);
  if (error) throw new Error(error.message);
}
