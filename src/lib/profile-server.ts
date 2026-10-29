import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/profile";

/**
 * syncProfileToSupabase writes the full profile JSON to the user's `resumes` row
 * (`raw_text`) alongside the normalized tables, so that row is the one place to
 * read the whole profile back from.
 */
export async function loadStoredProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select("raw_text")
    .eq("user_id", userId)
    .limit(1);

  const rawText = data?.[0]?.raw_text;
  if (error || typeof rawText !== "string") return null;

  try {
    return JSON.parse(rawText) as UserProfile;
  } catch {
    return null;
  }
}

/** A name and email alone isn't enough to ground a tailored resume. */
export function hasGroundingData(profile: UserProfile | null): profile is UserProfile {
  if (!profile) return false;
  const skillLists = Object.values(profile.skills ?? {});
  return (
    (profile.experience?.length ?? 0) > 0 ||
    (profile.projects?.length ?? 0) > 0 ||
    (profile.education?.length ?? 0) > 0 ||
    skillLists.some((list) => Array.isArray(list) && list.length > 0)
  );
}
