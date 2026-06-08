import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Returns the current Supabase session, bootstrapping it from the login-stored
 * tokens on the first call after a page refresh when Supabase has no session yet.
 * This is the single place that reads the custom "user" key.
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
