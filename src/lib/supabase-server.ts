import { createServerClient } from "@supabase/ssr";
import {
  createClient,
  isAuthRetryableFetchError,
  type AuthError,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Supabase client bound to the signed-in user's cookies (Server Components and Route Handlers). */
export async function createCookieClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't set cookies; proxy.ts keeps the session fresh instead.
          }
        },
      },
    }
  );
}

// Supabase being unreachable must not read as "signed out", or callers would see a bogus session error.
function userOrNull(user: User | null, error: AuthError | null): User | null {
  if (error && isAuthRetryableFetchError(error)) throw error;
  return user;
}

/**
 * Resolves the caller of an API route. The Chrome extension sends
 * `Authorization: Bearer <supabase access token>`; the website sends its session
 * cookies. Either way the returned client runs queries as that user, so RLS applies.
 * Returns null when signed out; throws when Supabase can't be reached.
 */
export async function getRequestUser(
  request: Request
): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const bearer = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");

  if (bearer) {
    const token = bearer[1];
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }
    );
    const { data, error } = await supabase.auth.getUser(token);
    const user = userOrNull(data.user, error);
    return user ? { supabase, user } : null;
  }

  const supabase = await createCookieClient();
  const { data, error } = await supabase.auth.getUser();
  const user = userOrNull(data.user, error);
  return user ? { supabase, user } : null;
}
