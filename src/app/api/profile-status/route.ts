import { NextResponse } from "next/server";
import { corsHeaders, preflight } from "@/lib/cors";
import { hasGroundingData, loadStoredProfile } from "@/lib/profile-server";
import { getRequestUser } from "@/lib/supabase-server";

export function OPTIONS(request: Request) {
  return preflight(request);
}

/**
 * The extension's "profile is empty" guard. It uses the same loader as
 * /api/generate-resume, so the popup and generation can't disagree.
 */
export async function GET(request: Request) {
  const headers = corsHeaders(request);

  try {
    const auth = await getRequestUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Your session expired. Log in again." }, { status: 401, headers });
    }

    const profile = await loadStoredProfile(auth.supabase, auth.user.id);
    return NextResponse.json({ hasProfile: hasGroundingData(profile) }, { headers });
  } catch (error) {
    console.error("Profile status route error:", error);
    return NextResponse.json({ error: "Couldn't load your profile. Please try again." }, { status: 500, headers });
  }
}
