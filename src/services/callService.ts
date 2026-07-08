import { getAuthedClient, getAuthenticatedSession } from '../lib/supabase';

export type CallLogDB = {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: 'audio' | 'video';
  status: 'outgoing' | 'missed' | 'incoming' | 'completed';
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  caller: { first_name: string | null; last_name: string | null; org_name: string | null; avatar_url: string | null } | null;
  callee: { first_name: string | null; last_name: string | null; org_name: string | null; avatar_url: string | null } | null;
};

export async function fetchCallLogs(): Promise<CallLogDB[]> {
  const session = await getAuthenticatedSession();
  if (!session) return [];
  const userId = session.user.id;
  const db = getAuthedClient();

  const { data, error } = await db
    .from('call_logs')
    .select(`
      *,
      caller:users!call_logs_caller_id_fkey(first_name, last_name, org_name, avatar_url),
      callee:users!call_logs_callee_id_fkey(first_name, last_name, org_name, avatar_url)
    `)
    .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
    .order('started_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []) as CallLogDB[];
}

export async function logCall(calleeId: string, callType: 'audio' | 'video' = 'audio'): Promise<string> {
  const session = await getAuthenticatedSession();
  if (!session) throw new Error('Not logged in');
  const db = getAuthedClient();

  const { data, error } = await db
    .from('call_logs')
    .insert({
      caller_id: session.user.id,
      callee_id: calleeId,
      call_type: callType,
      status: 'outgoing',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

export async function endCall(callId: string, durationSeconds: number): Promise<void> {
  const db = getAuthedClient();
  const { error } = await db
    .from('call_logs')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', callId);
  if (error) throw new Error(error.message);
}

export async function uploadCallRecording(callId: string, blob: Blob): Promise<string> {
  const session = await getAuthenticatedSession();
  if (!session) throw new Error('Not logged in');
  const db = getAuthedClient();
  const path = `${session.user.id}/call-recordings/${callId}.webm`;

  const { error: uploadError } = await db.storage
    .from('post-media')
    .upload(path, blob, { cacheControl: '3600', upsert: true, contentType: blob.type || 'audio/webm' });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = db.storage.from('post-media').getPublicUrl(path);
  const url = data.publicUrl;

  const { error: updateError } = await db
    .from('call_logs')
    .update({ recording_url: url })
    .eq('id', callId);
  if (updateError) throw new Error(updateError.message);

  return url;
}
