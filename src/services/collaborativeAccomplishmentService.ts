import { supabase, getAuthenticatedSession } from '../lib/supabase';

export type Collaborator = {
  id: string;
  name: string;
  avatar_url?: string | null;
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

function getUserId(): string {
  return JSON.parse(localStorage.getItem('user') ?? '{}')?.id ?? '';
}

async function uploadMedia(file: File, userId: string): Promise<string> {
  await getAuthenticatedSession();
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${userId}/collab/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('post-media').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from('post-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchCollaborativeAccomplishments(userId: string): Promise<CollaborativeAccomplishment[]> {
  await getAuthenticatedSession();
  const { data, error } = await supabase
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
  const { error } = await supabase.from('collaborative_accomplishments').insert({
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
  const { error } = await supabase
    .from('collaborative_accomplishments')
    .update({ ...input, media_urls: allUrls.length ? allUrls : null })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCollaborativeAccomplishment(id: string): Promise<void> {
  await getAuthenticatedSession();
  const { error } = await supabase.from('collaborative_accomplishments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchCollaboratorAvatars(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  await getAuthenticatedSession();
  const { data, error } = await supabase
    .from('users')
    .select('id, avatar_url')
    .in('id', ids);
  if (error || !data) return {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.fromEntries((data as any[]).filter(u => u.avatar_url).map(u => [u.id, u.avatar_url]));
}

export async function searchUsers(query: string): Promise<Collaborator[]> {
  if (!query.trim() || query.length < 2) return [];
  await getAuthenticatedSession();
  const q = query.trim();
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, org_name, email, avatar_url')
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,org_name.ilike.%${q}%`)
    .limit(8);
  if (error) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((u: any) => ({
    id: u.id,
    name: u.org_name
      ? u.org_name
      : `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || u.id,
    avatar_url: u.avatar_url ?? null,
  }));
}
