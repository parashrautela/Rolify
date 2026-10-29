/** Output of /api/generate-resume, rendered by the dashboard preview and /resume/[id]/print. */
export interface TailoredResumeData {
  meta: {
    job_title: string;
    company: string;
    tailoring_score: number;
    missing_keywords: string[];
    used_keywords: string[];
  };
  resume: {
    contact: {
      name: string;
      email: string;
      phone: string;
      location: string;
      linkedin: string;
      portfolio: string;
    };
    summary: string;
    experience: Array<{
      company: string;
      role: string;
      duration: string;
      bullets: string[];
    }>;
    projects: Array<{
      name: string;
      stack: string;
      link: string | null;
      bullets: string[];
    }>;
    skills: {
      languages: string[];
      frameworks: string[];
      tools: string[];
      design: string[];
      other: string[];
    };
    education: Array<{
      degree: string;
      institution: string;
      year: string;
      gpa: string | null;
    }>;
    certifications: string[];
    achievements: string[];
  };
  cover_answers: {
    why_this_role: string;
    why_this_company: string;
    biggest_strength: string;
    culture_fit: string;
  };
}

/** Job description breakdown shared with the Chrome extension (its lib/types.ts mirrors this). */
export interface ParsedJD {
  jobTitle: string;
  company: string | null;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  atsKeywords: string[];
}

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim())
    : [];

/** Coerces model output or a client payload into a well-formed ParsedJD. */
export function normalizeParsedJD(value: unknown): ParsedJD {
  const jd = (value ?? {}) as Record<string, unknown>;
  return {
    jobTitle: typeof jd.jobTitle === "string" ? jd.jobTitle.trim() : "",
    company: typeof jd.company === "string" && jd.company.trim() ? jd.company.trim() : null,
    mustHaveSkills: stringList(jd.mustHaveSkills),
    niceToHaveSkills: stringList(jd.niceToHaveSkills),
    responsibilities: stringList(jd.responsibilities),
    atsKeywords: stringList(jd.atsKeywords),
  };
}
