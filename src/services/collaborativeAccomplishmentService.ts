import { createClient } from '@supabase/supabase-js';

export type Collaborator = {
  id: string;
  name: string;
};

export type CollaborativeAccomplishment = {
  id: string;
  user_id: string;
  title: string;
  collaborators: Collaborator[];
  description: string | null;
  achieved_month: string | null;
  achieved_year: string | null;
  media_urls: string[] | null;
  visibility: 'public' | 'only_me' | 'community';
  created_at: string;
};

export type CollabInput = Omit<CollaborativeAccomplishment, 'id' | 'user_id' | 'created_at'>;

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
  return JSON.parse(localStorage.getItem('user') ?? '{}')?.id ?? '';
}

async function uploadMedia(file: File, userId: string): Promise<string> {
  const client = getAuthClient();
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${userId}/collab/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await client.storage.from('post-media').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = client.storage.from('post-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchCollaborativeAccomplishments(userId: string): Promise<CollaborativeAccomplishment[]> {
  const client = getAuthClient();
  const { data, error } = await client
    .from('collaborative_accomplishments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CollaborativeAccomplishment[];
}

export async function createCollaborativeAccomplishment(
  input: Omit<CollabInput, 'media_urls'>,
  mediaFiles: File[],
): Promise<void> {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');
  const mediaUrls = mediaFiles.length
    ? await Promise.all(mediaFiles.map(f => uploadMedia(f, userId)))
    : null;
  const client = getAuthClient();
  const { error } = await client.from('collaborative_accomplishments').insert({
    ...input,
    user_id: userId,
    media_urls: mediaUrls,
  });
  if (error) throw new Error(error.message);
}

export async function updateCollaborativeAccomplishment(
  id: string,
  input: Omit<CollabInput, 'media_urls'>,
  newMediaFiles: File[],
  existingMediaUrls: string[],
): Promise<void> {
  const userId = getUserId();
  const newUrls = newMediaFiles.length
    ? await Promise.all(newMediaFiles.map(f => uploadMedia(f, userId)))
    : [];
  const allUrls = [...existingMediaUrls, ...newUrls];
  const client = getAuthClient();
  const { error } = await client
    .from('collaborative_accomplishments')
    .update({ ...input, media_urls: allUrls.length ? allUrls : null })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCollaborativeAccomplishment(id: string): Promise<void> {
  const client = getAuthClient();
  const { error } = await client.from('collaborative_accomplishments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function searchUsers(query: string): Promise<Collaborator[]> {
  if (!query.trim() || query.length < 2) return [];
  const client = getAuthClient();
  const q = query.trim();
  const { data, error } = await client
    .from('users')
    .select('id, first_name, last_name, org_name, email')
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,org_name.ilike.%${q}%`)
    .limit(8);
  if (error) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((u: any) => ({
    id: u.id,
    name: u.org_name
      ? u.org_name
      : `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || u.id,
  }));
}
