import { createClient } from '@supabase/supabase-js';

export type Experience = {
  id: string;
  user_id: string;
  role: string;
  company: string;
  emp_type: string | null;
  start_month: string | null;
  start_year: string | null;
  end_month: string | null;
  end_year: string | null;
  is_current: boolean;
  location: string | null;
  description: string | null;
  skills?: string[];
  created_at: string;
};

export type ExperienceInput = Omit<Experience, 'id' | 'user_id' | 'created_at'>;

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

export async function fetchExperiences(userId: string): Promise<Experience[]> {
  const client = getAuthClient();
  const { data, error } = await client
    .from('experiences')
    .select('*')
    .eq('user_id', userId)
    .order('is_current', { ascending: false })
    .order('start_year', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Experience[];
}

export async function createExperience(input: ExperienceInput): Promise<void> {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');
  const client = getAuthClient();
  const { error } = await client.from('experiences').insert({ ...input, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function updateExperience(id: string, input: ExperienceInput): Promise<void> {
  const client = getAuthClient();
  const { error } = await client.from('experiences').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteExperience(id: string): Promise<void> {
  const client = getAuthClient();
  const { error } = await client.from('experiences').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function formatPeriod(exp: Experience): string {
  const start = [exp.start_month, exp.start_year].filter(Boolean).join(' ');
  const end = exp.is_current ? 'Present' : [exp.end_month, exp.end_year].filter(Boolean).join(' ');
  return [start, end].filter(Boolean).join(' · ');
}
