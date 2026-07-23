import { supabase, getAuthenticatedSession } from '../lib/supabase';
import { fetchConnectionIds } from './communityService';
import { fetchBlockedMeIds, fetchBlockedUsers } from './blockService';

export type PostVisibility = 'public' | 'community';

function getUserId(): string {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  return stored?.id ?? '';
}

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

async function uploadFile(file: File, userId: string): Promise<string> {
  await getAuthenticatedSession();
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('post-media')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('post-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function createPhotoPost(params: {
  files: File[];
  content: string;
  visibility: PostVisibility;
}) {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');

  const mediaUrls = await Promise.all(params.files.map(f => uploadFile(f, userId)));

  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    post_type: 'photo',
    content: params.content,
    media_urls: mediaUrls,
    visibility: params.visibility,
  });
  if (error) throw new Error(error.message);
}

export async function createVideoPost(params: {
  file: File;
  content: string;
  visibility: PostVisibility;
}) {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');

  const mediaUrl = await uploadFile(params.file, userId);

  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    post_type: 'video',
    content: params.content,
    media_urls: [mediaUrl],
    visibility: params.visibility,
  });
  if (error) throw new Error(error.message);
}

export async function createEventPost(params: {
  coverFile?: File | null;
  eventType: 'online' | 'inperson';
  title: string;
  registrationLink: string;
  eventLocation?: string;
  startDate: string;
  startTime: string;
  addEndDateTime: boolean;
  endDate: string;
  endTime: string;
  description: string;
  visibility: PostVisibility;
}) {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');

  let coverImageUrl: string | null = null;
  if (params.coverFile) {
    coverImageUrl = await uploadFile(params.coverFile, userId);
  } else {
    await getAuthenticatedSession();
  }

  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    post_type: 'event',
    event_type: params.eventType,
    cover_image_url: coverImageUrl,
    event_title: params.title,
    registration_link: params.registrationLink || null,
    event_location: params.eventLocation || null,
    start_date: params.startDate || null,
    start_time: params.startTime || null,
    end_date: params.addEndDateTime ? params.endDate || null : null,
    end_time: params.addEndDateTime ? params.endTime || null : null,
    event_description: params.description || null,
    visibility: params.visibility,
  });
  if (error) throw new Error(error.message);
}

export async function createPollPost(params: {
  question: string;
  options: string[];
  visibility: PostVisibility;
}) {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');

  await getAuthenticatedSession();
  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    post_type: 'poll',
    poll_question: params.question,
    poll_options: params.options.filter(o => o.trim()),
    visibility: params.visibility,
  });
  if (error) throw new Error(error.message);
}

export async function createQuestionPost(params: {
  question: string;
  visibility: PostVisibility;
}) {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');

  await getAuthenticatedSession();
  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    post_type: 'question',
    question_text: params.question,
    visibility: params.visibility,
  });
  if (error) throw new Error(error.message);
}

export type FeedFilter = 'all' | 'media' | 'polls' | 'event';

export type FeedPost = {
  id: string;
  post_type: 'photo' | 'video' | 'event' | 'poll' | 'question';
  visibility: PostVisibility;
  content: string | null;
  media_urls: string[] | null;
  cover_image_url: string | null;
  event_type: 'online' | 'inperson' | null;
  event_title: string | null;
  registration_link: string | null;
  event_location: string | null;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  event_description: string | null;
  poll_question: string | null;
  poll_options: string[] | null;
  question_text: string | null;
  created_at: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    org_name: string | null;
    user_type: 'individual' | 'organization' | null;
    org_type: string | null;
    avatar_url: string | null;
    title: string | null;
    company: string | null;
    experiences: {
      role: string;
      company: string;
      is_current: boolean;
    }[];
  } | null;
};

export const FEED_PAGE_SIZE = 10;

// Ranking constants for the LinkedIn-style feed score: a mix of recency,
// how connected the author is to the viewer, and how much engagement the
// post already has. Recency is weighted highest so the feed still reads as
// "fresh" — connections and engagement mainly reorder within that window.
const RECENCY_HALF_LIFE_HOURS = 36;
const RECENCY_WEIGHT = 3;
const CONNECTION_BOOST = 4;
const OWN_POST_BOOST = 1.5;
const LIKE_WEIGHT = 0.6;
const COMMENT_WEIGHT = 1;

// The pool candidates are ranked over needs to be bigger than one page so
// posts from connections/high engagement can surface above merely-newer
// public posts. It grows with page depth so deep infinite-scroll pages still
// have enough candidates to slice from, capped to bound query/scoring cost.
const CANDIDATE_POOL_MIN = 150;
const CANDIDATE_POOL_MAX = 400;

function computeFeedScore(
  post: FeedPost,
  opts: { myId: string; connectedIds: Set<string>; likes: number; comments: number },
): number {
  const ageHours = (Date.now() - new Date(post.created_at).getTime()) / 3_600_000;
  const recencyScore = Math.pow(2, -ageHours / RECENCY_HALF_LIFE_HOURS);

  let networkScore = 0;
  if (post.user?.id === opts.myId) networkScore = OWN_POST_BOOST;
  else if (post.user?.id && opts.connectedIds.has(post.user.id)) networkScore = CONNECTION_BOOST;

  const engagementScore = Math.log1p(opts.likes * LIKE_WEIGHT + opts.comments * COMMENT_WEIGHT);

  return recencyScore * RECENCY_WEIGHT + networkScore + engagementScore;
}

export async function fetchFeedPosts(
  filter: FeedFilter = 'all',
  page = 0,
): Promise<FeedPost[]> {
  await getAuthenticatedSession();
  const myId = getUserId();

  // Only connection IDs are needed up front to build the visibility filter
  // (and later, the network-boost part of the ranking score). Block lists
  // are only needed to filter the result afterwards, so they're fetched in
  // parallel with the posts query itself instead of gating it — this cuts
  // two blocking round trips off the critical path to first paint.
  const connectedIds = await fetchConnectionIds().catch(() => [] as string[]);

  // Community posts are visible only from self or connections
  const communityIds = [...new Set([myId, ...connectedIds])].filter(Boolean);
  const visFilter = communityIds.length > 0
    ? `visibility.eq.public,and(visibility.eq.community,user_id.in.(${communityIds.join(',')}))`
    : 'visibility.eq.public';

  const poolSize = Math.min(
    CANDIDATE_POOL_MAX,
    Math.max(CANDIDATE_POOL_MIN, (page + 2) * FEED_PAGE_SIZE * 3),
  );

  let query = supabase
    .from('posts')
    .select('*, user:users!posts_user_id_fkey(id, first_name, last_name, org_name, user_type, org_type, avatar_url, title, company, deactivated_at, experiences(role, company, is_current))')
    .or(visFilter)
    .order('created_at', { ascending: false })
    .range(0, poolSize - 1);

  if (filter === 'media') query = query.in('post_type', ['photo', 'video']);
  else if (filter === 'polls') query = query.in('post_type', ['poll', 'question']);
  else if (filter === 'event') query = query.eq('post_type', 'event');

  const [{ data, error }, blockedMeIds, myBlockedUsers] = await Promise.all([
    query,
    fetchBlockedMeIds().catch(() => [] as string[]),
    fetchBlockedUsers().catch(() => [] as { id: string }[]),
  ]);
  if (error) throw new Error(error.message);

  // Build set of user IDs whose posts should be hidden
  const hiddenIds = new Set([
    ...blockedMeIds,
    ...myBlockedUsers.map(u => u.id),
  ]);

  const candidates = ((data ?? []) as unknown as FeedPost[])
    .map(p => ({
      ...p,
      user: p.user ? maskDeactivatedUser(p.user) : null
    }))
    .filter(p => !p.user?.id || !hiddenIds.has(p.user.id));

  const connectedSet = new Set(connectedIds);
  const candidateIds = candidates.map(p => p.id);
  const [likesCounts, commentCounts] = await Promise.all([
    fetchLikesCounts(candidateIds).catch(() => ({} as Record<string, number>)),
    fetchCommentCounts(candidateIds).catch(() => ({} as Record<string, number>)),
  ]);

  const ranked = candidates
    .map(post => ({
      post,
      score: computeFeedScore(post, {
        myId,
        connectedIds: connectedSet,
        likes: likesCounts[post.id] ?? 0,
        comments: commentCounts[post.id] ?? 0,
      }),
    }))
    // Tie-break by recency so equally-scored posts still read newest-first.
    .sort((a, b) => b.score - a.score || (new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime()))
    .map(r => r.post);

  const from = page * FEED_PAGE_SIZE;
  return ranked.slice(from, from + FEED_PAGE_SIZE);
}

export async function fetchPostById(postId: string): Promise<FeedPost | null> {
  await getAuthenticatedSession();
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:users!posts_user_id_fkey(id, first_name, last_name, org_name, user_type, org_type, avatar_url, title, company, deactivated_at, experiences(role, company, is_current))')
    .eq('id', postId)
    .single();
  if (error) return null;
  const post = data as unknown as FeedPost;
  if (post && post.user) {
    post.user = maskDeactivatedUser(post.user);
  }
  return post;
}

export async function togglePostLike(postId: string, like: boolean): Promise<void> {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');
  await getAuthenticatedSession();
  if (like) {
    // Plain insert instead of upsert — post_likes only has INSERT/DELETE RLS
    // policies (no UPDATE), and upsert falls back to an UPDATE when the row
    // already exists, which RLS would silently reject. A duplicate-key error
    // just means it's already liked, which is the outcome we want anyway.
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    if (error && error.code !== '23505') throw new Error(error.message);
  } else {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    if (error) throw new Error(error.message);
  }
}

export async function fetchCommentCounts(postIds: string[]): Promise<Record<string, number>> {
  if (!postIds.length) return {};
  await getAuthenticatedSession();
  const { data } = await supabase
    .from('post_comments')
    .select('post_id')
    .eq('post_table', 'posts')
    .in('post_id', postIds);
  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as { post_id: string }[]) {
    counts[r.post_id] = (counts[r.post_id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchLikedPostIds(): Promise<Set<string>> {
  const userId = getUserId();
  if (!userId) return new Set();
  await getAuthenticatedSession();
  const { data } = await supabase.from('post_likes').select('post_id').eq('user_id', userId);
  return new Set((data ?? []).map((r: { post_id: string }) => r.post_id));
}

export async function fetchLikesCounts(postIds: string[]): Promise<Record<string, number>> {
  if (!postIds.length) return {};
  await getAuthenticatedSession();
  const { data } = await supabase.from('post_likes').select('post_id').in('post_id', postIds);
  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as { post_id: string }[]) {
    counts[r.post_id] = (counts[r.post_id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchPollData(postId: string): Promise<{
  voteCounts: Record<number, number>;
  userVote: number | null;
  totalVotes: number;
}> {
  const userId = getUserId();
  await getAuthenticatedSession();
  const { data } = await supabase
    .from('poll_votes')
    .select('option_index, user_id')
    .eq('post_id', postId);
  const rows = (data ?? []) as { option_index: number; user_id: string }[];
  const voteCounts: Record<number, number> = {};
  for (const r of rows) {
    voteCounts[r.option_index] = (voteCounts[r.option_index] ?? 0) + 1;
  }
  const userVote = userId
    ? (rows.find((r) => r.user_id === userId)?.option_index ?? null)
    : null;
  return { voteCounts, userVote, totalVotes: rows.length };
}

export async function voteOnPoll(postId: string, optionIndex: number): Promise<void> {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');
  await getAuthenticatedSession();
  await supabase
    .from('poll_votes')
    .upsert({ post_id: postId, user_id: userId, option_index: optionIndex });
}

export async function unvoteOnPoll(postId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');
  await getAuthenticatedSession();
  await supabase
    .from('poll_votes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);
}

export async function deletePost(postId: string): Promise<void> {
  await getAuthenticatedSession();
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw new Error(error.message);
}

export async function fetchUserPosts(userId: string): Promise<FeedPost[]> {
  await getAuthenticatedSession();
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:users!posts_user_id_fkey(id, first_name, last_name, org_name, user_type, org_type, avatar_url, title, company, deactivated_at, experiences(role, company, is_current))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as FeedPost[]).map(p => ({
    ...p,
    user: p.user ? maskDeactivatedUser(p.user) : null
  }));
}
