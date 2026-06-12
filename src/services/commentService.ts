import { supabase, getAuthenticatedSession } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function ensureSession() {
  return await getAuthenticatedSession();
}

function getUserId(): string {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  return stored?.id ?? '';
}

async function getSessionUserId(): Promise<string> {
  const session = await ensureSession();
  return session?.user?.id ?? getUserId();
}

export type PostComment = {
  id: string;
  post_id: string;
  post_table: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    org_name: string | null;
    avatar_url: string | null;
    title: string | null;
    company: string | null;
  } | null;
};

const USER_SELECT =
  'first_name, last_name, org_name, avatar_url, title, company';

const COMMENT_SELECT = `*, user:users!post_comments_user_id_fkey(${USER_SELECT})`;

export const PAGE_SIZE = 5;

export async function fetchComments(
  postId: string,
  postTable: 'posts' | 'discover_posts' = 'posts',
  page = 0,
): Promise<PostComment[]> {
  await ensureSession();

  // Try with parent_id IS NULL filter first (requires migration)
  const { data, error } = await supabase
    .from('post_comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .eq('post_table', postTable)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (!error) return (data ?? []) as unknown as PostComment[];

  // Fallback: column may not exist yet
  const { data: fallback, error: fallbackErr } = await supabase
    .from('post_comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .eq('post_table', postTable)
    .order('created_at', { ascending: true })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (fallbackErr) throw new Error(fallbackErr.message);
  return (fallback ?? []) as unknown as PostComment[];
}

export async function fetchReplies(parentId: string): Promise<PostComment[]> {
  await ensureSession();
  const { data, error } = await supabase
    .from('post_comments')
    .select(COMMENT_SELECT)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PostComment[];
}

export async function fetchReplyCountsBatch(
  commentIds: string[],
): Promise<Record<string, number>> {
  if (!commentIds.length) return {};
  try {
    await ensureSession();
    const { data, error } = await supabase
      .from('post_comments')
      .select('parent_id')
      .in('parent_id', commentIds);
    if (error) return {};
    const map: Record<string, number> = {};
    (data ?? []).forEach((r: { parent_id: string | null }) => {
      if (r.parent_id) map[r.parent_id] = (map[r.parent_id] ?? 0) + 1;
    });
    return map;
  } catch {
    return {};
  }
}

export async function createComment(
  postId: string,
  content: string,
  postTable: 'posts' | 'discover_posts' = 'posts',
  parentId?: string,
): Promise<PostComment> {
  const session = await ensureSession();
  const userId = session?.user?.id ?? getUserId();
  if (!userId) throw new Error('Not logged in');

  const payload: Record<string, unknown> = {
    post_id: postId,
    post_table: postTable,
    user_id: userId,
    content,
  };
  if (parentId) payload.parent_id = parentId;

  const { data, error } = await supabase
    .from('post_comments')
    .insert(payload)
    .select(COMMENT_SELECT)
    .single();

  if (error) throw new Error(error.message);

  // Notify @mentioned users — backend resolves slugs server-side via supabase_admin
  if (/@[\w]+/.test(content)) {
    try {
      const { data: me } = await supabase
        .from('users')
        .select('first_name, last_name, org_name')
        .eq('id', userId)
        .single();
      const commenterName = me
        ? ([me.first_name, me.last_name].filter(Boolean).join(' ') || me.org_name || 'Someone')
        : 'Someone';
      const token = session?.access_token ?? '';
      const res = await fetch(`${API_URL}/api/comments/notify-mentions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content,
          commenter_name: commenterName,
          post_id: postId,
          post_table: postTable,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.warn('[mention notify] backend error:', err);
      }
    } catch (e) {
      console.warn('[mention notify] failed:', e);
    }
  }

  return data as unknown as PostComment;
}

export async function deleteComment(commentId: string): Promise<void> {
  await ensureSession();
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
  if (error) throw new Error(error.message);
}

export async function toggleCommentLike(
  commentId: string,
  commentAuthorId?: string | null,
): Promise<{ liked: boolean; count: number }> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('Not logged in');

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('comment_likes').delete()
      .eq('comment_id', commentId).eq('user_id', userId);
  } else {
    await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });

    // Notify comment author (skip self-likes)
    if (commentAuthorId && commentAuthorId !== userId) {
      try {
        const { data: liker } = await supabase
          .from('users')
          .select('first_name, last_name, org_name')
          .eq('id', userId)
          .single();
        const likerName = liker
          ? ([liker.first_name, liker.last_name].filter(Boolean).join(' ') || liker.org_name || 'Someone')
          : 'Someone';
        await supabase.from('notifications').insert({
          user_id: commentAuthorId,
          title: 'Someone liked your comment',
          message: `${likerName} liked your comment`,
          type: 'application',
        });
      } catch { /* notification failure is non-fatal */ }
    }
  }

  const { count } = await supabase
    .from('comment_likes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId);

  return { liked: !existing, count: count ?? 0 };
}

export async function fetchCommentLikesBatch(
  commentIds: string[],
): Promise<{ counts: Record<string, number>; likedIds: Set<string> }> {
  if (!commentIds.length) return { counts: {}, likedIds: new Set() };
  try {
    const userId = await getSessionUserId();
    const { data } = await supabase
      .from('comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', commentIds);

    const counts: Record<string, number> = {};
    const likedIds = new Set<string>();
    (data ?? []).forEach((r: { comment_id: string; user_id: string }) => {
      counts[r.comment_id] = (counts[r.comment_id] ?? 0) + 1;
      if (r.user_id === userId) likedIds.add(r.comment_id);
    });
    return { counts, likedIds };
  } catch {
    return { counts: {}, likedIds: new Set() };
  }
}

export function getCurrentUserId(): string {
  return getUserId();
}
