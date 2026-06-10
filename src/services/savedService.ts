import { createClient } from '@supabase/supabase-js';
import type { FeedPost } from './postService';
import { toggleBookmark } from './discoverService';
import type { EmployerPosting } from './employmentService';

// ─── Supabase helpers (same pattern as postService) ───────────────────────────

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

// ─── Community posts ──────────────────────────────────────────────────────────

/** Save a home-feed post for the logged-in user. */
export async function savePost(postId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  const { error } = await getAuthClient()
    .from('saved_community_posts')
    .upsert({ user_id: userId, post_id: postId }, { onConflict: 'user_id,post_id' });
  if (error) throw new Error(error.message);
}

/** Unsave a home-feed post. */
export async function unsavePost(postId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  const { error } = await getAuthClient()
    .from('saved_community_posts')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);
  if (error) throw new Error(error.message);
}

/** Return the set of post IDs saved by the logged-in user. */
export async function fetchSavedPostIds(): Promise<Set<string>> {
  const userId = getUserId();
  if (!userId) return new Set();
  const { data, error } = await getAuthClient()
    .from('saved_community_posts')
    .select('post_id')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map(r => r.post_id as string));
}

/** Fetch the full FeedPost objects saved by the logged-in user (for the Saved page). */
export async function fetchSavedCommunityPosts(): Promise<FeedPost[]> {
  const userId = getUserId();
  if (!userId) return [];
  const { data, error } = await getAuthClient()
    .from('saved_community_posts')
    .select(`
      saved_at,
      post:posts (
        id, post_type, visibility, content, media_urls, cover_image_url,
        event_type, event_title, registration_link, event_location,
        start_date, start_time, end_date, end_time, event_description,
        poll_question, poll_options, question_text, created_at,
        user:users!posts_user_id_fkey (
          first_name, last_name, org_name, user_type, org_type, avatar_url, title, company,
          experiences (role, company, is_current)
        )
      )
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(r => r.post).filter(Boolean) as unknown as FeedPost[];
}

// ─── Discover items ───────────────────────────────────────────────────────────

/**
 * Snapshot of a Discover item stored in Supabase.
 * We cache the full display data because discover items come from an external
 * REST API and cannot be re-fetched by ID from the saved page.
 */
export type SavedDiscoverSnapshot = {
  id: string;
  savedAt: string;
  userName: string;
  userRole: string;
  userAvatarUrl: string | null;
  time: string;
  title: string;
  badge: string;
  tags: string[];
  mode: string;
  payment: string;
  audience: string;
  lastDate: string;
  imageUrl: string;
  reactions: number;
  comments: number;
};

/** Save a Discover item snapshot for the logged-in user. */
export async function saveDiscoverItem(snapshot: SavedDiscoverSnapshot): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  const { error } = await getAuthClient()
    .from('saved_discover_items')
    .upsert(
      { user_id: userId, item_id: snapshot.id, item_data: snapshot },
      { onConflict: 'user_id,item_id' },
    );
  if (error) throw new Error(error.message);
}

/** Remove a saved Discover item. */
export async function unsaveDiscoverItem(itemId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  const { error } = await getAuthClient()
    .from('saved_discover_items')
    .delete()
    .eq('user_id', userId)
    .eq('item_id', itemId);
  if (error) throw new Error(error.message);

  // Sync Discover page bookmark state in the same tab
  window.dispatchEvent(new CustomEvent('impactshaala:discover-unsaved', { detail: { itemId } }));

  // Also update the REST API backend so isBookmarked reflects correctly on next load
  toggleBookmark(itemId, false).catch(() => {});
}

// ─── Learning courses ─────────────────────────────────────────────────────────

export type SavedLearningSnapshot = {
  id: string;
  image: string;
  university: string;
  title: string;
  level: string;
  mode: string;
  fee: string;
  duration: string;
  deadline: string;
  brochureUrl: string;
};

export async function saveLearningCourse(snapshot: SavedLearningSnapshot): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  const { error } = await getAuthClient()
    .from('saved_learning_courses')
    .upsert(
      { user_id: userId, course_id: snapshot.id, course_data: snapshot },
      { onConflict: 'user_id,course_id' },
    );
  if (error) throw new Error(error.message);
}

export async function unsaveLearningCourse(courseId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  const { error } = await getAuthClient()
    .from('saved_learning_courses')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId);
  if (error) throw new Error(error.message);
}

export async function fetchSavedLearningCourseIds(): Promise<Set<string>> {
  const userId = getUserId();
  if (!userId) return new Set();
  const { data } = await getAuthClient()
    .from('saved_learning_courses')
    .select('course_id')
    .eq('user_id', userId);
  return new Set((data ?? []).map(r => r.course_id as string));
}

export async function fetchSavedLearningCourses(): Promise<SavedLearningSnapshot[]> {
  const userId = getUserId();
  if (!userId) return [];
  const { data, error } = await getAuthClient()
    .from('saved_learning_courses')
    .select('course_data, saved_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => r.course_data as SavedLearningSnapshot);
}

/** Fetch all Discover items saved by the logged-in user. */
export async function fetchSavedDiscoverItems(): Promise<SavedDiscoverSnapshot[]> {
  const userId = getUserId();
  if (!userId) return [];
  const { data, error } = await getAuthClient()
    .from('saved_discover_items')
    .select('item_data, saved_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(r => ({
    ...(r.item_data as SavedDiscoverSnapshot),
    savedAt: r.saved_at as string,
  }));
}

// ─── Employment postings ──────────────────────────────────────────────────────

export async function fetchSavedEmploymentPostingIds(): Promise<Set<string>> {
  const userId = getUserId();
  if (!userId) return new Set();
  const { data } = await getAuthClient()
    .from('saved_employment_postings')
    .select('posting_id')
    .eq('user_id', userId);
  return new Set((data ?? []).map(r => r.posting_id as string));
}

export async function saveEmploymentPosting(postingId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  const { error } = await getAuthClient()
    .from('saved_employment_postings')
    .upsert({ user_id: userId, posting_id: postingId }, { onConflict: 'user_id,posting_id' });
  if (error) throw new Error(error.message);
}

export async function unsaveEmploymentPosting(postingId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  const { error } = await getAuthClient()
    .from('saved_employment_postings')
    .delete()
    .eq('user_id', userId)
    .eq('posting_id', postingId);
  if (error) throw new Error(error.message);
}

export async function fetchSavedEmploymentPostings(): Promise<EmployerPosting[]> {
  const userId = getUserId();
  if (!userId) return [];

  const { data: savedRows, error: savedError } = await getAuthClient()
    .from('saved_employment_postings')
    .select('posting_id, saved_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (savedError) throw new Error(savedError.message);

  const ids = (savedRows ?? []).map((r) => r.posting_id as string);
  if (ids.length === 0) return [];

  const { data, error } = await getAuthClient()
    .from('employment_hub_postings')
    .select('*')
    .in('id', ids);
  if (error) throw new Error(error.message);

  // Preserve saved_at order
  const byId = new Map((data ?? []).map((p) => [p.id as string, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as EmployerPosting[];
}
