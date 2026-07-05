import { NextResponse } from "next/server";
import mammoth from "mammoth";

const SYSTEM_PROMPT = `You are an expert resume parser. Your job is to extract candidate profile data from the provided resume text and return it in a structured JSON format matching the schema below.

JSON Schema:
{
  "identity": {
    "name": "string (candidate full name)",
    "email": "string (email address)",
    "phone": "string (phone number)",
    "location": "string (city and country/state, e.g. New Delhi, India)",
    "linkedin": "string (clean linkedin URL or username, e.g. linkedin.com/in/username)",
    "portfolio": "string (portfolio URL or null)"
  },
  "education": [
    {
      "degree": "string (degree name)",
      "institution": "string (college/university name)",
      "year": "string (graduation year)",
      "gpa": "string or null"
    }
  ],
  "experience": [
    {
      "company": "string (company name)",
      "role": "string (role title)",
      "duration": "string (e.g. Jan 2023 - Present or Jul 2022 - Dec 2022)",
      "bullets": ["string (key achievements and responsibilities)"]
    }
  ],
  "projects": [
    {
      "name": "string (project name)",
      "stack": "string (comma-separated tech stack used)",
      "link": "string or null",
      "description": "string (brief summary of what the project is)"
    }
  ],
  "skills": {
    "languages": ["string"],
    "frameworks": ["string"],
    "tools": ["string"],
    "design": ["string"],
    "other": ["string"]
  },
  "certifications": ["string (certification name, issuer, year)"],
  "achievements": ["string (key achievements, awards, contests won)"]
}

Absolute Rules:
- Extract all data accurately from the resume. Do not invent any details.
- Categorize skills correctly into languages, frameworks, tools, design, or other.
- Format all lists correctly.
- Return ONLY valid JSON. No markdown. No explanation. No preamble.`;

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

async function callAnthropicWithAttachment(
  systemPrompt: string,
  userText: string,
  fileBase64: string,
  model = "claude-sonnet-4-5-20250929"
) {
  // Strip data URL prefix if present
  const base64Data = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;

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
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Data
              }
            },
            {
              type: "text",
              text: userText
            }
          ]
        }
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

    const { fileData, fileName, fileType, text } = await request.json();

    let rawContent = "";

    if (text) {
      try {
        rawContent = await callAnthropic(
          SYSTEM_PROMPT,
          `Please extract all profile details from this resume text:\n\n${text}`,
          "claude-haiku-4-5-20251001"
        );
      } catch (apiError: any) {
        console.error("Anthropic Claude Text API Error:", apiError);
        return NextResponse.json(
          { error: "Resume extraction failed. Please try again." },
          { status: 500 }
        );
      }
    } else if (fileData && (fileType === "application/pdf" || fileName.endsWith(".pdf"))) {
      try {
        rawContent = await callAnthropicWithAttachment(
          SYSTEM_PROMPT,
          "Please extract all profile details from this uploaded resume PDF file.",
          fileData,
          "claude-sonnet-4-5-20250929"
        );
      } catch (apiError: any) {
        console.error("Anthropic Claude PDF Multimodal API Error:", apiError);
        return NextResponse.json(
          { error: "Resume extraction failed. Please try again." },
          { status: 500 }
        );
      }
    } else if (
      fileData &&
      (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx"))
    ) {
      try {
        const base64Content = fileData.split(",")[1];
        if (!base64Content) {
          return NextResponse.json(
            { error: "Invalid file format." },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(base64Content, "base64");
        const result = await mammoth.extractRawText({ buffer });
        const extractedText = result.value;

        if (!extractedText || !extractedText.trim()) {
          return NextResponse.json(
            { error: "Could not extract text from the Word document." },
            { status: 400 }
          );
        }

        rawContent = await callAnthropic(
          SYSTEM_PROMPT,
          `Please extract all profile details from this resume text:\n\n${extractedText}`,
          "claude-haiku-4-5-20251001"
        );
      } catch (docxError) {
        console.error("DOCX parsing error:", docxError);
        return NextResponse.json(
          { error: "Resume extraction failed. Please try again." },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type or empty file content." },
        { status: 400 }
      );
    }

    let cleanedContent = rawContent.trim();
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    }
    cleanedContent = cleanedContent.trim();

    try {
      const parsedProfile = JSON.parse(cleanedContent);

      const completeProfile = {
        identity: {
          name: parsedProfile.identity?.name || "",
          email: parsedProfile.identity?.email || "",
          phone: parsedProfile.identity?.phone || "",
          location: parsedProfile.identity?.location || "",
          linkedin: parsedProfile.identity?.linkedin || "",
          portfolio: parsedProfile.identity?.portfolio || "",
        },
        education: parsedProfile.education || [],
        experience: parsedProfile.experience || [],
        projects: (parsedProfile.projects || []).map((p: any) => ({
          name: p.name || "",
          stack: p.stack || "",
          link: p.link || null,
          description: p.description || "",
          problem_solved: "",
          hardest_challenge: "",
          outcome: "",
        })),
        skills: {
          languages: parsedProfile.skills?.languages || [],
          frameworks: parsedProfile.skills?.frameworks || [],
          tools: parsedProfile.skills?.tools || [],
          design: parsedProfile.skills?.design || [],
          other: parsedProfile.skills?.other || [],
        },
        certifications: parsedProfile.certifications || [],
        achievements: parsedProfile.achievements || [],
        intent: {
          energizes: "",
          culture: "",
          proudest: "",
          goal: "",
        },
      };

      return NextResponse.json(completeProfile);
    } catch (parseError) {
      console.error("JSON parsing error during extraction:", cleanedContent, parseError);
      return NextResponse.json(
        { error: "Could not process response. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Extract resume route error:", error);
    return NextResponse.json(
      { error: "Resume extraction failed. Please try again." },
      { status: 500 }
    );
  }
}
