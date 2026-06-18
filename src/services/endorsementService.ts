import { supabase, getAuthenticatedSession } from '../lib/supabase';

function getCurrentUserId(): string {
  try {
    return JSON.parse(localStorage.getItem('user') ?? '{}').id ?? '';
  } catch {
    return '';
  }
}

export async function fetchEndorsementCount(targetUserId: string): Promise<number> {
  await getAuthenticatedSession();
  const { count } = await supabase
    .from('user_endorsements')
    .select('*', { count: 'exact', head: true })
    .eq('endorsed_id', targetUserId);
  return count ?? 0;
}

export async function fetchIsEndorsed(targetUserId: string): Promise<boolean> {
  const endorserId = getCurrentUserId();
  if (!endorserId) return false;
  await getAuthenticatedSession();
  const { data } = await supabase
    .from('user_endorsements')
    .select('id')
    .eq('endorser_id', endorserId)
    .eq('endorsed_id', targetUserId)
    .maybeSingle();
  return !!data;
}

export async function toggleEndorsement(targetUserId: string, endorse: boolean): Promise<void> {
  const endorserId = getCurrentUserId();
  if (!endorserId) throw new Error('Not logged in');
  await getAuthenticatedSession();
  if (endorse) {
    await supabase
      .from('user_endorsements')
      .upsert({ endorser_id: endorserId, endorsed_id: targetUserId });
  } else {
    await supabase
      .from('user_endorsements')
      .delete()
      .eq('endorser_id', endorserId)
      .eq('endorsed_id', targetUserId);
  }
}

// Requires a Supabase function: get_community_members_count(p_user_id uuid) SECURITY DEFINER
export async function fetchCommunityMembersCount(targetUserId: string): Promise<number> {
  await getAuthenticatedSession();
  const { data, error } = await supabase.rpc('get_community_members_count', {
    p_user_id: targetUserId,
  });
  if (error) return 0;
  return data ?? 0;
}
