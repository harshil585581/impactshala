import { supabase } from "./supabase";

export async function getFreshToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // Keep localStorage in sync with the (possibly refreshed) session
    try {
      const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
      if (stored.access_token !== session.access_token) {
        stored.access_token = session.access_token;
        stored.refresh_token = session.refresh_token;
        localStorage.setItem("user", JSON.stringify(stored));
      }
    } catch {}
    return session.access_token;
  }

  // No in-memory session — try to restore from localStorage
  try {
    const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
    if (stored.access_token && stored.refresh_token) {
      const { data } = await supabase.auth.setSession({
        access_token: stored.access_token,
        refresh_token: stored.refresh_token,
      });
      if (data.session) {
        stored.access_token = data.session.access_token;
        stored.refresh_token = data.session.refresh_token;
        localStorage.setItem("user", JSON.stringify(stored));
        return data.session.access_token;
      }
    }
  } catch {}

  return "";
}
