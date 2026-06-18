import { supabase, getAuthenticatedSession } from '../lib/supabase';
import type { FeedPost } from './postService';

export type SearchUser = {
  id: string;
  name: string;
  title: string | null;
  avatar_url: string | null;
  user_type: 'individual' | 'organization' | null;
};

export type SearchResults = {
  users: SearchUser[];
  posts: FeedPost[];
  postsFallback: boolean;
};

const POST_SELECT = '*, user:users!posts_user_id_fkey(id, first_name, last_name, org_name, user_type, org_type, avatar_url, title, company, experiences(role, company, is_current))';

export async function searchGlobal(query: string): Promise<SearchResults> {
  if (!query.trim()) return { users: [], posts: [], postsFallback: false };
  await getAuthenticatedSession();
  const q = `%${query.trim()}%`;

  const usersRes = await supabase
    .from('users')
    .select('id, first_name, last_name, org_name, title, avatar_url, user_type')
    .or(`first_name.ilike.${q},last_name.ilike.${q},org_name.ilike.${q},title.ilike.${q}`)
    .limit(8);

  const postsRes = await supabase
    .from('posts')
    .select(POST_SELECT)
    .or(`content.ilike.${q},event_title.ilike.${q},question_text.ilike.${q},poll_question.ilike.${q}`)
    .order('created_at', { ascending: false })
    .limit(20);

  const users: SearchUser[] = (usersRes.data ?? []).map(u => ({
    id: u.id,
    name: u.user_type === 'organization'
      ? (u.org_name ?? '')
      : [u.first_name, u.last_name].filter(Boolean).join(' '),
    title: u.title ?? null,
    avatar_url: u.avatar_url ?? null,
    user_type: u.user_type,
  }));

  let posts = (postsRes.data ?? []) as unknown as FeedPost[];
  let postsFallback = false;

  if (posts.length === 0) {
    const fallback = await supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
      .limit(20);
    posts = (fallback.data ?? []) as unknown as FeedPost[];
    postsFallback = true;
  }

  return { users, posts, postsFallback };
}
