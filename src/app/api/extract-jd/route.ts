import { NextResponse } from "next/server";
import { callAnthropic, parseJsonReply } from "@/lib/anthropic";
import { corsHeaders, preflight } from "@/lib/cors";
import { normalizeParsedJD } from "@/lib/resume";
import { getRequestUser } from "@/lib/supabase-server";

const SYSTEM_PROMPT = `You are a job description parser. The text below was scraped from a job posting web page and may also contain navigation, footers, cookie banners, or other job listings. Extract only what this one posting states.

Output JSON Schema:
{
  "jobTitle": "string (exact title from the posting)",
  "company": "string or null",
  "mustHaveSkills": ["skills, tools, or qualifications the posting marks as required"],
  "niceToHaveSkills": ["skills marked preferred, bonus, or nice to have"],
  "responsibilities": ["up to 8 short phrases describing the core duties"],
  "atsKeywords": ["up to 15 exact terms an ATS would scan for: tools, methods, domain terms, in the posting's own wording"]
}

Absolute Rules:
- Never invent requirements that are not in the posting.
- Keep each skill and keyword to a few words. No duplicates within a list.
- If a list has nothing, return an empty array.
- Return ONLY valid JSON. No markdown. No explanation. No preamble.`;

const MAX_JD_CHARS = 20000;

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const headers = corsHeaders(request);

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("Anthropic API key is missing or not configured.");
      return NextResponse.json({ error: "API key not configured." }, { status: 500, headers });
    }

    const auth = await getRequestUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Your session expired. Log in again." }, { status: 401, headers });
    }

    const { text } = await request.json();
    if (typeof text !== "string" || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Not enough job description text to analyze." },
        { status: 400, headers }
      );
    }

    let rawContent = "";
    try {
      rawContent = await callAnthropic(
        SYSTEM_PROMPT,
        `Job posting text:\n\n${text.slice(0, MAX_JD_CHARS)}`,
        "claude-haiku-4-5-20251001"
      );
    } catch (apiError) {
      console.error("Anthropic API Error during extract-jd:", apiError);
      return NextResponse.json(
        { error: "Couldn't analyze this job description. Please try again." },
        { status: 500, headers }
      );
    }

    try {
      return NextResponse.json(normalizeParsedJD(parseJsonReply(rawContent)), { headers });
    } catch (parseError) {
      console.error("JSON parsing error for content:", rawContent, parseError);
      return NextResponse.json(
        { error: "Could not process response. Please try again." },
        { status: 500, headers }
      );
    }
  } catch (error) {
    console.error("Extract JD route error:", error);
    return NextResponse.json(
      { error: "Couldn't analyze this job description. Please try again." },
      { status: 500, headers }
    );
  }
}
