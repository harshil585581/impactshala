import { supabase, getAuthenticatedSession } from '../lib/supabase';

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
  title?: string | null;
  message: string;
  type: NotificationType;
  is_read: boolean;
  action_url?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface AppNotification extends Notification {
  actor?: {
    first_name?: string | null;
    last_name?: string | null;
    org_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

function getUserId(): string {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  return stored?.id ?? '';
}

async function ensureAuth() {
  await getAuthenticatedSession();
}

export async function fetchNotifications(
  limit = 20,
  offset = 0,
  onlyUnread = false,
): Promise<Notification[]> {
  await ensureAuth();
  const userId = getUserId();
  if (!userId) return [];

  let query = supabase
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
  await ensureAuth();
  const userId = getUserId();
  if (!userId) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count ?? 0;
}

export async function markAsRead(id: string): Promise<void> {
  await ensureAuth();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function markAllAsRead(): Promise<void> {
  await ensureAuth();
  const userId = getUserId();
  if (!userId) return;
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}

export async function deleteNotification(id: string): Promise<void> {
  await ensureAuth();
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAllNotifications(): Promise<void> {
  await ensureAuth();
  const userId = getUserId();
  if (!userId) return;
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export interface CreateNotificationPayload {
  user_id: string;
  title?: string;
  message: string;
  type: NotificationType;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(payload: CreateNotificationPayload): Promise<void> {
  await ensureAuth();
  const { error } = await supabase
    .from('notifications')
    .insert(payload);
  if (error) throw new Error(error.message);
}
