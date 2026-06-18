import { supabase, getAuthenticatedSession } from '../lib/supabase';

function getCurrentUserId(): string {
  try { return JSON.parse(localStorage.getItem('user') ?? '{}').id ?? ''; }
  catch { return ''; }
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  review_text: string;
  media_url?: string;
  created_at: string;
  reviewer?: { first_name: string; last_name: string; org_name?: string; avatar_url?: string };
}

export async function fetchReviews(targetUserId: string): Promise<Review[]> {
  await getAuthenticatedSession();
  const { data } = await supabase
    .from('user_reviews')
    .select('*')
    .eq('reviewed_id', targetUserId)
    .order('created_at', { ascending: false });
  if (!data || data.length === 0) return [];

  const ids = [...new Set(data.map((r: any) => r.reviewer_id))];
  const { data: usersData } = await supabase
    .from('users')
    .select('id, first_name, last_name, org_name, avatar_url')
    .in('id', ids);
  const usersMap: Record<string, any> = Object.fromEntries(
    (usersData ?? []).map((u: any) => [u.id, u])
  );
  return data.map((r: any) => ({ ...r, reviewer: usersMap[r.reviewer_id] ?? null })) as Review[];
}

export async function fetchReviewCount(targetUserId: string): Promise<number> {
  await getAuthenticatedSession();
  const { count } = await supabase
    .from('user_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reviewed_id', targetUserId);
  return count ?? 0;
}

export async function uploadReviewMedia(file: File): Promise<string> {
  const userId = getCurrentUserId();
  await getAuthenticatedSession();
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${userId}/reviews/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('post-media')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Media upload failed: ${error.message}`);
  const { data } = supabase.storage.from('post-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteReview(targetUserId: string): Promise<void> {
  const reviewerId = getCurrentUserId();
  if (!reviewerId) throw new Error('Not logged in');
  await getAuthenticatedSession();
  const { error } = await supabase
    .from('user_reviews')
    .delete()
    .eq('reviewer_id', reviewerId)
    .eq('reviewed_id', targetUserId);
  if (error) throw error;
}

export async function submitReview(
  targetUserId: string,
  rating: number,
  reviewText: string,
  mediaUrl?: string,
): Promise<void> {
  const reviewerId = getCurrentUserId();
  if (!reviewerId) throw new Error('Not logged in');
  await getAuthenticatedSession();
  const { error } = await supabase.from('user_reviews').upsert(
    {
      reviewer_id: reviewerId,
      reviewed_id: targetUserId,
      rating,
      review_text: reviewText,
      ...(mediaUrl ? { media_url: mediaUrl } : {}),
    },
    { onConflict: 'reviewer_id,reviewed_id' }
  );
  if (error) throw error;
}
