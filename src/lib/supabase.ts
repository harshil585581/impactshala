import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cached client keyed by token — avoids re-creating on every call
let _cachedToken = '';
let _authedClient: ReturnType<typeof createClient> | null = null;

/**
 * Returns a Supabase client with the JWT explicitly set in the Authorization header.
 * This is more reliable than relying on supabase.auth.setSession() because it
 * bypasses the auth module's internal state and puts the token directly on every request.
 */
export function getAuthedClient() {
  try {
    const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
    const token: string = stored?.access_token ?? '';
    if (token && token === _cachedToken && _authedClient) return _authedClient;
    if (token) {
      _cachedToken = token;
      _authedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'sb-authed-service-client', // separate key avoids GoTrueClient conflict
        },
      });
      return _authedClient;
    }
  } catch { /* fall through */ }
  return supabase;
}

/**
 * Returns the current Supabase session, bootstrapping it from the login-stored
 * tokens on the first call after a page refresh when Supabase has no session yet.
 */
export async function getAuthenticatedSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  try {
    const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
    if (stored?.access_token && stored?.refresh_token) {
      const { data } = await supabase.auth.setSession({
        access_token: stored.access_token,
        refresh_token: stored.refresh_token,
      });
      return data.session ?? null;
    }
  } catch {}
  return null;
}
