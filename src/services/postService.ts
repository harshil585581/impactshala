import { createClient } from '@supabase/supabase-js';

export type PostVisibility = 'public' | 'community';

function getAuthClient() {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  const token: string | undefined = stored?.access_token;

  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : undefined,
  );
}

function getUserId(): string {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  return stored?.id ?? '';
}

async function uploadFile(file: File, userId: string): Promise<string> {
  const client = getAuthClient();
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await client.storage
    .from('post-media')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = client.storage.from('post-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function createPhotoPost(params: {
  files: File[];
  content: string;
  visibility: PostVisibility;
}) {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');

  const client = getAuthClient();
  const mediaUrls = await Promise.all(params.files.map(f => uploadFile(f, userId)));

  const { error } = await client.from('posts').insert({
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

  const client = getAuthClient();
  const mediaUrl = await uploadFile(params.file, userId);

  const { error } = await client.from('posts').insert({
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

  const client = getAuthClient();

  let coverImageUrl: string | null = null;
  if (params.coverFile) {
    coverImageUrl = await uploadFile(params.coverFile, userId);
  }

  const { error } = await client.from('posts').insert({
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

  const client = getAuthClient();
  const { error } = await client.from('posts').insert({
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

  const client = getAuthClient();
  const { error } = await client.from('posts').insert({
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

export async function fetchFeedPosts(filter: FeedFilter = 'all'): Promise<FeedPost[]> {
  const client = getAuthClient();
  let query = client
    .from('posts')
    .select('*, user:users(first_name, last_name, org_name, user_type, org_type, avatar_url, title, company, experiences(role, company, is_current))')
    .order('created_at', { ascending: false });

  if (filter === 'media') query = query.in('post_type', ['photo', 'video']);
  else if (filter === 'polls') query = query.in('post_type', ['poll', 'question']);
  else if (filter === 'event') query = query.eq('post_type', 'event');

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as FeedPost[];
}

export async function fetchUserPosts(userId: string): Promise<FeedPost[]> {
  const client = getAuthClient();
  const { data, error } = await client
    .from('posts')
    .select('*, user:users(first_name, last_name, org_name, user_type, org_type, avatar_url, title, company, experiences(role, company, is_current))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as FeedPost[];
}
