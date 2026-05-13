import { createClient } from '@supabase/supabase-js';

export type PersonalAchievement = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  achieved_date: string | null;
  media_urls: string[] | null;
  visibility: 'public' | 'only_me' | 'community';
  created_at: string;
};

export type AchievementInput = Omit<PersonalAchievement, 'id' | 'user_id' | 'created_at'>;

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
  const path = `${userId}/achievements/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await client.storage.from('post-media').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = client.storage.from('post-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchPersonalAchievements(userId: string): Promise<PersonalAchievement[]> {
  const client = getAuthClient();
  const { data, error } = await client
    .from('personal_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PersonalAchievement[];
}

export async function createPersonalAchievement(
  input: Omit<AchievementInput, 'media_urls'>,
  mediaFiles: File[],
): Promise<void> {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');
  const mediaUrls = mediaFiles.length
    ? await Promise.all(mediaFiles.map(f => uploadMedia(f, userId)))
    : null;
  const client = getAuthClient();
  const { error } = await client.from('personal_achievements').insert({
    ...input,
    user_id: userId,
    media_urls: mediaUrls,
  });
  if (error) throw new Error(error.message);
}

export async function updatePersonalAchievement(
  id: string,
  input: Omit<AchievementInput, 'media_urls'>,
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
    .from('personal_achievements')
    .update({ ...input, media_urls: allUrls.length ? allUrls : null })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePersonalAchievement(id: string): Promise<void> {
  const client = getAuthClient();
  const { error } = await client.from('personal_achievements').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
