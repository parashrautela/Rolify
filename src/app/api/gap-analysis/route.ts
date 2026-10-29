import { NextResponse } from "next/server";
import { UserProfile } from "@/lib/profile";

const SYSTEM_PROMPT = `You are a career gap analyzer. Analyze the user's current professional profile (contact details, projects, education, experience, career intent) and determine what additional details are needed to format a premium resume.

You must look for the following gaps:
1. Contact Details: check if location, LinkedIn, portfolio etc. are missing.
2. Experience: check if roles, durations, or achievement bullet points are lacking detail.
3. Projects: check if stack, description, or project achievements are missing.
4. Skills: check if skills are sparsely populated.
5. Intent: check if the user's career goals or cultural preferences are unspecified.

Choose the most important gaps and generate a list of exactly 3 to 5 clear, conversational follow-up questions. Assign each question to a specific "bucket" (e.g. project_deepdive, bucket_fill, intent).

Output JSON Schema:
{
  "questions": [
    {
      "id": "unique_string (e.g. project_stack_myproject)",
      "type": "project_deepdive | bucket_fill | intent",
      "bucket": "projects | skills | experience | certifications | intent",
      "project_name": "string or null",
      "question": "the exact question to show the user",
      "placeholder": "example answer shown as input placeholder",
      "why_asking": "internal note not shown to user"
    }
  ],
  "total_questions": number,
  "profile_completeness": number between 0 and 100
}

Absolute Rules:
- Generate 3 to 5 questions maximum.
- Be highly specific (e.g. ask about a specific project name if that project has no tech stack).
- Do not repeat questions.
- Calculate profile_completeness based on how much detail they have filled (identity + education + experience + projects + skills).
- Return ONLY valid JSON matching the schema. No markdown, no notes.`;

async function callAnthropic(systemPrompt: string, userPrompt: string, model = "claude-haiku-4-5-20251001") {
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

    const profile: UserProfile = await request.json();
    const userPrompt = JSON.stringify(profile, null, 2);

    let rawContent = "";
    try {
      rawContent = await callAnthropic(SYSTEM_PROMPT, userPrompt, "claude-haiku-4-5-20251001");
    } catch (apiError) {
      console.error("Anthropic API Error during gap-analysis:", apiError);
      return NextResponse.json(
        { error: "Resume extraction failed. Please try again." },
        { status: 500 }
      );
    }

    // Clean up potential markdown formatting (like ```json ... ```) that the LLM might return
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
    console.error("Gap analysis route error:", error);
    return NextResponse.json(
      { error: "Resume extraction failed. Please try again." },
      { status: 500 }
    );
  }
}
