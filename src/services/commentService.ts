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
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  return stored?.id ?? '';
}

export type PostComment = {
  id: string;
  post_id: string;
  post_table: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    org_name: string | null;
    avatar_url: string | null;
    title: string | null;
    company: string | null;
    experiences: { role: string; company: string; is_current: boolean }[] | null;
  } | null;
};

const USER_SELECT =
  'first_name, last_name, org_name, avatar_url, title, company, experiences(role, company, is_current)';

const PAGE_SIZE = 5;

export async function fetchComments(
  postId: string,
  postTable: 'posts' | 'discover_posts' = 'posts',
  page = 0,
): Promise<PostComment[]> {
  const client = getAuthClient();
  const { data, error } = await client
    .from('post_comments')
    .select(`*, user:users(${USER_SELECT})`)
    .eq('post_id', postId)
    .eq('post_table', postTable)
    .order('created_at', { ascending: true })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PostComment[];
}

export async function createComment(
  postId: string,
  content: string,
  postTable: 'posts' | 'discover_posts' = 'posts',
): Promise<PostComment> {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');

  const client = getAuthClient();
  const { data, error } = await client
    .from('post_comments')
    .insert({ post_id: postId, post_table: postTable, user_id: userId, content })
    .select(`*, user:users(${USER_SELECT})`)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as PostComment;
}

export { PAGE_SIZE };

export async function deleteComment(commentId: string): Promise<void> {
  const client = getAuthClient();
  const { error } = await client.from('post_comments').delete().eq('id', commentId);
  if (error) throw new Error(error.message);
}

export function getCurrentUserId(): string {
  return getUserId();
}
