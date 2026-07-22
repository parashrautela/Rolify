import { NextResponse } from "next/server";
import { UserProfile } from "@/lib/profile";

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

async function callAnthropic(systemPrompt: string, userPrompt: string, model = "claude-sonnet-4-5-20250929") {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API error status ${response.status}: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("Anthropic API key is missing or not configured.");
      return NextResponse.json(
        { error: "API key not configured." },
        { status: 500 }
      );
    }

    const { profile, jd }: { profile: UserProfile; jd: string } = await request.json();

    if (!profile || !jd) {
      return NextResponse.json(
        { error: "Profile and Job Description are required." },
        { status: 400 }
      );
    }

    const userPrompt = `Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jd}`;

    let rawContent = "";
    try {
      rawContent = await callAnthropic(SYSTEM_PROMPT, userPrompt, "claude-sonnet-4-5-20250929");
    } catch (apiError) {
      console.error("Anthropic API Error during generate-resume:", apiError);
      return NextResponse.json(
        { error: "Resume generation failed. Please try again." },
        { status: 500 }
      );
    }

    // Clean up potential markdown formatting (like ```json ... ```)
    let cleanedContent = rawContent.trim();
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    }
    cleanedContent = cleanedContent.trim();

    try {
      const parsedData = JSON.parse(cleanedContent);
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error("JSON parsing error for content:", cleanedContent, parseError);
      return NextResponse.json(
        { error: "Could not process response. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Generate resume route error:", error);
    return NextResponse.json(
      { error: "Resume generation failed. Please try again." },
      { status: 500 }
    );
  }
}
