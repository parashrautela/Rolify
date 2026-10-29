import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/profile";
import { callAnthropic, parseJsonReply } from "@/lib/anthropic";
import { corsHeaders, preflight } from "@/lib/cors";
import { hasGroundingData, loadStoredProfile } from "@/lib/profile-server";
import { normalizeParsedJD, type ParsedJD, type TailoredResumeData } from "@/lib/resume";
import { getRequestUser } from "@/lib/supabase-server";

const SYSTEM_PROMPT = `You are a world-class resume writer and ATS optimization expert. You help candidates land jobs at top companies by tailoring their resume to specific job descriptions.

Your job: take a candidate's profile data and a job description, and produce a perfectly tailored resume.

ABSOLUTE RULES — never violate these:
- Never invent, fabricate, or exaggerate any information not in the profile
- Only use information explicitly provided in the candidate profile
- Rewrite and reorganize real information to maximize relevance — this is tailoring, not lying
- Every bullet point must start with a strong action verb (Built, Designed, Led, Reduced, Increased, Shipped, Launched, Optimized)
- Every bullet describing measurable work must include a metric or specific outcome
- Never use passive voice in bullet points
- Never use: "was responsible for", "helped with", "worked on", "assisted in"
- The summary must reference the exact job title from the job description
- Skills must use exact terminology from the JD where the candidate genuinely has that skill
- Remove irrelevant experience and de-emphasize anything not related to this specific role
- Standard ATS section headers only: Contact, Summary, Experience, Projects, Skills, Education, Certifications

SECTION ORDER:
For freshers (0-2 years): Contact → Summary → Education → Projects → Skills → Experience → Certifications
For experienced (2+ years): Contact → Summary → Experience → Projects → Skills → Education → Certifications

Return ONLY valid JSON. No markdown. No explanation. No preamble.

JSON structure:
{
  "meta": {
    "job_title": "exact job title from JD",
    "company": "company name from JD",
    "tailoring_score": number 0-100,
    "missing_keywords": ["JD keywords not in profile"],
    "used_keywords": ["JD keywords woven into resume"]
  },
  "resume": {
    "contact": {
      "name": "string",
      "email": "string",
      "phone": "string or null",
      "location": "city only",
      "linkedin": "URL or null",
      "portfolio": "URL or null"
    },
    "summary": "2-4 sentences tailored to this specific JD",
    "experience": [
      {
        "company": "string",
        "role": "string",
        "duration": "e.g. Jun 2023 – Present",
        "bullets": ["action verb + what + result with metric"]
      }
    ],
    "projects": [
      {
        "name": "string",
        "stack": "comma separated tools",
        "link": "URL or null",
        "bullets": ["problem solved", "what was built", "outcome with metric"]
      }
    ],
    "skills": {
      "languages": ["string"],
      "frameworks": ["string"],
      "tools": ["string"],
      "design": ["string"],
      "other": ["string"]
    },
    "education": [
      {
        "degree": "string",
        "institution": "string",
        "year": "string",
        "gpa": "string or null — only if above 8.0 CGPA or 3.5 GPA"
      }
    ],
    "certifications": ["name, issuer, year"],
    "achievements": ["only include if directly relevant to JD"]
  },
  "cover_answers": {
    "why_this_role": "3-4 sentences using candidate intent data",
    "why_this_company": "2-3 sentences using company name and JD specifics",
    "biggest_strength": "2 sentences anchored in proudest achievement",
    "culture_fit": "2 sentences using stated culture preferences"
  }
}`;

const MAX_JD_CHARS = 20000;

async function tailor(profile: UserProfile, jdText: string): Promise<TailoredResumeData> {
  const userPrompt = `Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jdText}`;

  const rawContent = await callAnthropic(SYSTEM_PROMPT, userPrompt, "claude-sonnet-4-5-20250929");
  const parsed = parseJsonReply<TailoredResumeData>(rawContent);
  if (!parsed?.meta || !parsed?.resume) {
    console.error("Unexpected generate-resume shape:", rawContent);
    throw new SyntaxError("Response is missing meta or resume.");
  }
  return parsed;
}

/** The extension's review step lets the user drop items, so the kept ones lead the prompt. */
function describeReviewedJd(jd: ParsedJD, sourceText: string): string {
  const lines = [`Job title: ${jd.jobTitle}`];
  if (jd.company) lines.push(`Company: ${jd.company}`);
  if (jd.mustHaveSkills.length) lines.push(`Must-have skills: ${jd.mustHaveSkills.join(", ")}`);
  if (jd.niceToHaveSkills.length) lines.push(`Nice-to-have skills: ${jd.niceToHaveSkills.join(", ")}`);
  if (jd.atsKeywords.length) lines.push(`ATS keywords: ${jd.atsKeywords.join(", ")}`);
  if (jd.responsibilities.length) lines.push(`Responsibilities:\n- ${jd.responsibilities.join("\n- ")}`);
  lines.push("", "The candidate reviewed this breakdown and kept only the items above. Emphasize them.");
  if (sourceText.trim()) {
    lines.push("", "Original posting text, scraped from the job page:", sourceText.slice(0, MAX_JD_CHARS));
  }
  return lines.join("\n");
}

function failure(error: unknown, headers: Record<string, string>) {
  if (error instanceof SyntaxError) {
    console.error("JSON parsing error during generate-resume:", error);
    return NextResponse.json(
      { error: "Could not process response. Please try again." },
      { status: 500, headers }
    );
  }
  console.error("Generate resume route error:", error);
  return NextResponse.json(
    { error: "Resume generation failed. Please try again." },
    { status: 500, headers }
  );
}

/**
 * Chrome extension: the profile comes from Supabase, never the request, and the
 * result is saved so /resume/[id]/print can render it.
 */
async function generateForExtension(
  supabase: SupabaseClient,
  user: User,
  body: { jdParsed: unknown; jdSourceText?: unknown; pageUrl?: unknown },
  headers: Record<string, string>
) {
  const jd = normalizeParsedJD(body.jdParsed);
  const sourceText = typeof body.jdSourceText === "string" ? body.jdSourceText : "";
  const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl : null;

  if (!jd.jobTitle && !sourceText.trim()) {
    return NextResponse.json({ error: "Job description is required." }, { status: 400, headers });
  }

  const profile = await loadStoredProfile(supabase, user.id);
  if (!hasGroundingData(profile)) {
    return NextResponse.json(
      { error: "Your Rolify profile is empty. Finish setting it up on rolify.app first." },
      { status: 409, headers }
    );
  }

  const result = await tailor(profile, describeReviewedJd(jd, sourceText));

  const { data: saved, error: saveError } = await supabase
    .from("tailored_resumes")
    .insert({
      user_id: user.id,
      job_title: result.meta.job_title || jd.jobTitle,
      company: result.meta.company || jd.company,
      page_url: pageUrl,
      jd_source_text: sourceText,
      jd_parsed: jd,
      result,
    })
    .select("id")
    .single();

  if (saveError || !saved) {
    console.error("Failed to save tailored resume:", saveError);
    return NextResponse.json(
      { error: "Your resume was generated but couldn't be saved. Please try again." },
      { status: 500, headers }
    );
  }

  return NextResponse.json(
    {
      resumeId: saved.id,
      matchedKeywords: result.meta.used_keywords ?? [],
      missingKeywords: result.meta.missing_keywords ?? [],
    },
    { headers }
  );
}

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const headers = corsHeaders(request);

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("Anthropic API key is missing or not configured.");
      return NextResponse.json(
        { error: "API key not configured." },
        { status: 500, headers }
      );
    }

    const auth = await getRequestUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Your session expired. Log in again." },
        { status: 401, headers }
      );
    }

    const body = await request.json();

    if (body?.jdParsed) {
      return await generateForExtension(auth.supabase, auth.user, body, headers);
    }

    // Website dashboard: sends its local profile and the pasted JD, gets the full result back.
    const { profile, jd }: { profile: UserProfile; jd: string } = body;

    if (!profile || !jd) {
      return NextResponse.json(
        { error: "Profile and Job Description are required." },
        { status: 400, headers }
      );
    }

    return NextResponse.json(await tailor(profile, jd), { headers });
  } catch (error) {
    return failure(error, headers);
  }
}
