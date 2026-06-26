import { supabase, getAuthedClient } from '../lib/supabase';

export type CallSignalType =
  | 'incoming-call'
  | 'call-accepted'
  | 'call-declined'
  | 'ice-candidate'
  | 'call-ended';

export type CallSignalRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  signal_type: CallSignalType;
  payload: Record<string, unknown>;
  created_at: string;
};

export async function sendCallSignal(
  toUserId: string,
  fromUserId: string,
  signalType: CallSignalType,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const db = getAuthedClient();
  const { error } = await db.from('call_signals').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    signal_type: signalType,
    payload,
  });
  if (error) throw new Error(error.message);
}

export function subscribeToCallSignals(
  myUserId: string,
  onSignal: (row: CallSignalRow) => void
) {
  return supabase
    .channel(`call_signals:${myUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'call_signals',
        filter: `to_user_id=eq.${myUserId}`,
      },
      (payload) => {
        const row = payload.new as CallSignalRow;
        if (row.to_user_id !== myUserId) return;
        onSignal(row);
      }
    )
    .subscribe();
}
