import { supabase, getAuthenticatedSession } from '../lib/supabase';

function getCurrentUserId(): string {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  return stored?.id ?? '';
}

export async function followUser(targetUserId: string): Promise<void> {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) throw new Error('Not logged in');
  await getAuthenticatedSession();
  const { error } = await supabase.from('user_follows').insert({
    follower_id: currentUserId,
    following_id: targetUserId,
  });
  // 23505 = unique_violation — already following, treat as success
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) throw new Error('Not logged in');
  await getAuthenticatedSession();
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId);
  if (error) throw new Error(error.message);
}

export async function checkIsFollowing(targetUserId: string): Promise<boolean> {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return false;
  await getAuthenticatedSession();
  const { count } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId);
  return (count ?? 0) > 0;
}

export async function fetchFollowedUserIds(): Promise<Set<string>> {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return new Set();
  await getAuthenticatedSession();
  const { data } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', currentUserId);
  return new Set((data ?? []).map((r: { following_id: string }) => r.following_id));
}
