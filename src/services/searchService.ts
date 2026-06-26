import { supabase, getAuthenticatedSession } from '../lib/supabase';
import type { FeedPost } from './postService';
import { fetchBlockedMeIds } from './blockService';
import { fetchBlockedUsers } from './blockService';

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

const POST_SELECT = '*, user:users!posts_user_id_fkey(id, first_name, last_name, org_name, user_type, org_type, avatar_url, title, company, deactivated_at, experiences(role, company, is_current))';

function maskDeactivatedUser(user: any) {
  if (user && user.deactivated_at) {
    return {
      ...user,
      first_name: "Impactshaala",
      last_name: "Member",
      org_name: "Impactshaala Member",
      avatar_url: null,
      title: null,
      company: null,
    };
  }
  return user;
}

export async function searchGlobal(query: string): Promise<SearchResults> {
  if (!query.trim()) return { users: [], posts: [], postsFallback: false };
  await getAuthenticatedSession();
  const q = `%${query.trim()}%`;

  // Fetch both directions of blocks concurrently
  const [blockedMeIds, myBlockedUsers] = await Promise.all([
    fetchBlockedMeIds().catch(() => [] as string[]),
    fetchBlockedUsers().catch(() => [] as { id: string }[]),
  ]);
  const hiddenIds = new Set([
    ...blockedMeIds,
    ...myBlockedUsers.map(u => u.id),
  ]);

  const usersRes = await supabase
    .from('users')
    .select('id, first_name, last_name, org_name, title, avatar_url, user_type')
    .or(`first_name.ilike.${q},last_name.ilike.${q},org_name.ilike.${q},title.ilike.${q}`)
    .is('deactivated_at', null)
    .limit(20);

  const postsRes = await supabase
    .from('posts')
    .select(POST_SELECT)
    .or(`content.ilike.${q},event_title.ilike.${q},question_text.ilike.${q},poll_question.ilike.${q}`)
    .order('created_at', { ascending: false })
    .limit(40);

  const users: SearchUser[] = (usersRes.data ?? [])
    .filter(u => !hiddenIds.has(u.id))
    .slice(0, 8)
    .map(u => ({
      id: u.id,
      name: u.user_type === 'organization'
        ? (u.org_name ?? '')
        : [u.first_name, u.last_name].filter(Boolean).join(' '),
      title: u.title ?? null,
      avatar_url: u.avatar_url ?? null,
      user_type: u.user_type,
    }));

  let posts = ((postsRes.data ?? []) as unknown as FeedPost[])
    .map(p => ({
      ...p,
      user: p.user ? maskDeactivatedUser(p.user) : null
    }))
    .filter(p => !p.user?.id || !hiddenIds.has(p.user.id));
  let postsFallback = false;

  if (posts.length === 0) {
    const fallback = await supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
      .limit(40);
    posts = ((fallback.data ?? []) as unknown as FeedPost[])
      .map(p => ({
        ...p,
        user: p.user ? maskDeactivatedUser(p.user) : null
      }))
      .filter(p => !p.user?.id || !hiddenIds.has(p.user.id))
      .slice(0, 20);
    postsFallback = true;
  } else {
    posts = posts.slice(0, 20);
  }

  return { users, posts, postsFallback };
}
