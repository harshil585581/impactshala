import { createClient } from '@supabase/supabase-js';

export type Education = {
  id: string;
  user_id: string;
  level: string | null;
  school: string;
  grade: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  visibility: 'public' | 'only_me' | 'community';
  created_at: string;
};

export type EducationInput = Omit<Education, 'id' | 'user_id' | 'created_at'>;

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

export async function fetchEducations(userId: string): Promise<Education[]> {
  const client = getAuthClient();
  const { data, error } = await client
    .from('educations')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Education[];
}

export async function createEducation(input: EducationInput): Promise<void> {
  const userId = getUserId();
  if (!userId) throw new Error('Not logged in');
  const client = getAuthClient();
  const { error } = await client.from('educations').insert({ ...input, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function updateEducation(id: string, input: EducationInput): Promise<void> {
  const client = getAuthClient();
  const { error } = await client.from('educations').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteEducation(id: string): Promise<void> {
  const client = getAuthClient();
  const { error } = await client.from('educations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function formatEducationPeriod(edu: Education): string {
  const startYear = edu.start_date ? edu.start_date.split('-')[0] : null;
  const endYear = edu.end_date ? edu.end_date.split('-')[0] : null;
  if (!startYear && !endYear) return '';
  if (startYear && !endYear) return startYear;
  return `${startYear} – ${endYear}`;
}

export function formatEducationDegree(edu: Education): string {
  const parts = [edu.level, edu.field_of_study].filter(Boolean);
  return parts.join(', ');
}
