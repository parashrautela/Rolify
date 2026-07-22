"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, UserProfile } from "@/lib/profile";

interface TailoredResumeData {
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

const SAMPLE_JDS = [
  {
    label: "CRED — Product Designer",
    text: `CRED is hiring a Product Designer to join our member experience team.
Role requirements:
- 1+ years experience in product design, ideally in a fast-paced environment or fintech space.
- Highly skilled in Figma, Framer, and building modular design systems.
- Strong grounding in interaction design, wireframing, and usability testing.
- Detail-oriented visual skills with focus on clean layout, typography, and checkout flows.
- Ability to collaborate with frontend engineers and understand implementation constraints.`
  },
  {
    label: "Stripe — Senior Product Designer",
    text: `Stripe is looking for a Product Designer to design the future of online payments.
Responsibilities:
- Own end-to-end UX for Payment Links and merchant dashboard experiences.
- Translate complex financial flows into simple, clear, and high-performance screens.
- Collaborate with product and frontend engineering to ship weekly updates.
- Requirements: Expert in Figma, user research, rapid prototyping, and visual design.
- Experience with fintech, payments, or developer tools is highly valued.`
  }
];

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailoredResumeData | null>(null);
  const [coverExpanded, setCoverExpanded] = useState(false);

  useEffect(() => {
    const loaded = loadProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loaded);
  }, []);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-soft">
        <div className="text-ink-mute animate-pulse text-sm">Loading dashboard...</div>
      </div>
    );
  }

  const loadSampleJd = (text: string) => {
    setJd(text);
  };

  const handleTailor = async () => {
    if (!jd.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, jd }),
      });
      const data = await res.json();
      if (data.meta) {
        setResult(data);
        // Scroll to results
        setTimeout(() => {
          document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Technical Debt Note: window.print() is used for v1 client-side PDF generation.
    // Replace with a server-side PDF generator (like Puppeteer or PDF-lib) in future iterations
    // to provide offline/email delivery and strict pixel matching.
    window.print();
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas-soft no-print">
      {/* Navigation */}
      <header className="border-b border-hairline bg-canvas py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl text-primary font-bold">⚡️</span>
          <span className="text-lg font-bold tracking-tight text-ink uppercase">Rolify</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/onboarding/upload")}
            className="text-xs font-semibold text-ink-secondary hover:text-primary transition-colors"
          >
            Edit Profile
          </button>
          <span className="text-hairline">|</span>
          <button
            onClick={() => router.push("/onboarding/questions")}
            className="text-xs font-semibold text-ink-secondary hover:text-primary transition-colors"
          >
            Gap Analysis
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 space-y-10">
        
        {/* Step 1: Input JD */}
        <section className="bg-canvas border border-hairline rounded-lg shadow-blue-md p-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary-bg-subdued px-2.5 py-1 rounded-pill">
              Tailoring Engine
            </span>
            <h1 className="mt-4 text-3xl font-light text-ink tracking-tight">
              Optimize for a Job Description
            </h1>
            <p className="mt-2 text-sm text-ink-secondary">
              Paste the target job description below. We will extract key requirements, perform ATS-friendly keyword mapping, and rewrite your resume bullets to emphasize relevant achievements.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-ink-mute font-medium mr-2">Quick Load Sample JD:</span>
              {SAMPLE_JDS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => loadSampleJd(sample.text)}
                  className="bg-canvas border border-hairline hover:border-primary text-ink-secondary text-xs rounded-pill px-3.5 py-1.5 transition-colors font-medium"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={8}
              placeholder="Paste the full job description here..."
              className="w-full px-3 py-2 bg-canvas text-ink text-sm border border-hairline-input hover:border-primary rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans leading-relaxed"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleTailor}
              disabled={loading || !jd.trim()}
              className={`bg-primary text-white font-medium text-sm rounded-pill px-8 py-3 hover:bg-primary-deep active:bg-primary-press transition-colors shadow-blue-sm flex items-center gap-2 ${
                loading || !jd.trim() ? "opacity-55 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Keyword Matching...
                </>
              ) : (
                "Tailor Resume"
              )}
            </button>
          </div>
        </section>

        {/* Step 2: Tailoring Results */}
        {result && (
          <section id="results-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8 scroll-mt-6">
            
            {/* Left Column: Metrics & Keywords */}
            <div className="lg:col-span-1 space-y-6">
              {/* Match Score Card */}
              <div className="bg-canvas border border-hairline rounded-lg shadow-blue-md p-6">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">
                  ATS Match Score
                </span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-light text-primary tracking-tight body-tabular">
                    {result.meta.tailoring_score}%
                  </span>
                  <span className="text-sm font-semibold text-ink-secondary">Tailored</span>
                </div>
                <div className="w-full h-2 bg-canvas-soft rounded-pill overflow-hidden mt-4">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${result.meta.tailoring_score}%` }}
                  />
                </div>
                <p className="text-xs text-ink-mute mt-3 leading-relaxed">
                  This resume is {result.meta.tailoring_score}% matched to the target {result.meta.job_title} role at {result.meta.company}.
                </p>
              </div>

              {/* Keywords Match Cards */}
              <div className="bg-canvas border border-hairline rounded-lg shadow-blue-md p-6 space-y-6">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 block mb-3">
                    Keywords Woven In ({result.meta.used_keywords.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.meta.used_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-pill px-2.5 py-1 font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-hairline pt-6">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 block mb-2">
                    Missing Keywords / Gaps ({result.meta.missing_keywords.length})
                  </span>
                  <p className="text-xs text-ink-mute mb-3 leading-relaxed">
                    To be an even stronger candidate for this role, consider gaining experience in:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.meta.missing_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-pill px-2.5 py-1 font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expandable Cover Letter Section */}
              <div className="bg-canvas border border-hairline rounded-lg shadow-blue-md p-6">
                <button
                  onClick={() => setCoverExpanded(!coverExpanded)}
                  className="w-full flex justify-between items-center text-left"
                >
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute block">
                      Cover Letter / Interview Prep
                    </span>
                    <span className="text-sm font-medium text-ink mt-1 block">Tailored Answers</span>
                  </div>
                  <span className="text-primary text-xl font-bold">{coverExpanded ? "−" : "+"}</span>
                </button>

                {coverExpanded && (
                  <div className="mt-6 pt-6 border-t border-hairline space-y-6 text-xs text-ink-secondary leading-relaxed">
                    <div>
                      <h4 className="font-semibold text-primary uppercase tracking-wider mb-1">
                        Why this role?
                      </h4>
                      <p>{result.cover_answers.why_this_role}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary uppercase tracking-wider mb-1">
                        Why this company?
                      </h4>
                      <p>{result.cover_answers.why_this_company}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary uppercase tracking-wider mb-1">
                        Biggest Strength
                      </h4>
                      <p>{result.cover_answers.biggest_strength}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary uppercase tracking-wider mb-1">
                        Culture Fit
                      </h4>
                      <p>{result.cover_answers.culture_fit}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Resume Live Preview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center bg-canvas border border-hairline rounded-lg p-4 px-6 shadow-blue-sm">
                <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  ATS-Compliant Resume Preview
                </div>
                <button
                  onClick={handlePrint}
                  className="bg-primary text-white font-medium text-xs rounded-pill px-5 py-2.5 hover:bg-primary-deep active:bg-primary-press transition-colors shadow-blue-sm flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download PDF
                </button>
              </div>

              {/* Styled Resume Preview matching Part 1 and Part 2 JSON */}
              <div className="bg-canvas border border-hairline shadow-blue-md p-12 overflow-x-auto min-h-[11in] w-full resume-print-container select-text">
                <div className="max-w-[7.5in] mx-auto space-y-6 text-black font-sans leading-relaxed text-[10.5pt] select-text">
                  
                  {/* Contact header */}
                  <div className="text-center space-y-1.5 border-b border-black/10 pb-4">
                    <h2 className="text-2xl font-bold tracking-tight text-black">
                      {result.resume.contact.name}
                    </h2>
                    <div className="text-xs text-zinc-600 flex flex-wrap justify-center items-center gap-x-2 gap-y-1">
                      <span>{result.resume.contact.email}</span>
                      <span>|</span>
                      <span>{result.resume.contact.phone}</span>
                      <span>|</span>
                      <span>{result.resume.contact.location}</span>
                      {result.resume.contact.linkedin && (
                        <>
                          <span>|</span>
                          <span className="font-semibold">{result.resume.contact.linkedin}</span>
                        </>
                      )}
                      {result.resume.contact.portfolio && (
                        <>
                          <span>|</span>
                          <span className="font-semibold">{result.resume.contact.portfolio}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
                      Professional Summary
                    </h3>
                    <p className="text-zinc-800 text-[10pt] leading-normal">{result.resume.summary}</p>
                  </div>

                  {/* Experience */}
                  {result.resume.experience && result.resume.experience.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
                        Professional Experience
                      </h3>
                      <div className="space-y-3.5">
                        {result.resume.experience.map((exp, i) => (
                          <div key={i} className="space-y-1 select-text">
                            <div className="flex justify-between items-baseline font-semibold text-[10pt]">
                              <span>{exp.role} — {exp.company}</span>
                              <span className="text-xs font-normal text-zinc-600">{exp.duration}</span>
                            </div>
                            <ul className="list-disc pl-5 text-[9.5pt] text-zinc-800 space-y-1">
                              {exp.bullets.map((b, idx) => (
                                <li key={idx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {result.resume.projects && result.resume.projects.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
                        Projects
                      </h3>
                      <div className="space-y-3.5">
                        {result.resume.projects.map((proj, i) => (
                          <div key={i} className="space-y-1 select-text">
                            <div className="flex justify-between items-baseline font-semibold text-[10pt]">
                              <span>
                                {proj.name} <span className="font-normal text-xs text-zinc-500">({proj.stack})</span>
                              </span>
                              {proj.link && (
                                <span className="text-xs font-normal text-zinc-600">{proj.link}</span>
                              )}
                            </div>
                            <ul className="list-disc pl-5 text-[9.5pt] text-zinc-800 space-y-1">
                              {proj.bullets.map((b, idx) => (
                                <li key={idx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
                      Skills
                    </h3>
                    <div className="text-[9.5pt] text-zinc-800 space-y-1 select-text">
                      {result.resume.skills.design && result.resume.skills.design.length > 0 && (
                        <p>
                          <strong className="font-semibold text-black">Design & Strategy:</strong> {result.resume.skills.design.join(", ")}
                        </p>
                      )}
                      {result.resume.skills.tools && result.resume.skills.tools.length > 0 && (
                        <p>
                          <strong className="font-semibold text-black">Tools & Software:</strong> {result.resume.skills.tools.join(", ")}
                        </p>
                      )}
                      {result.resume.skills.frameworks && result.resume.skills.frameworks.length > 0 && (
                        <p>
                          <strong className="font-semibold text-black">Frameworks:</strong> {result.resume.skills.frameworks.join(", ")}
                        </p>
                      )}
                      {result.resume.skills.languages && result.resume.skills.languages.length > 0 && (
                        <p>
                          <strong className="font-semibold text-black">Languages:</strong> {result.resume.skills.languages.join(", ")}
                        </p>
                      )}
                      {result.resume.skills.other && result.resume.skills.other.length > 0 && (
                        <p>
                          <strong className="font-semibold text-black">Other:</strong> {result.resume.skills.other.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Education */}
                  {result.resume.education && result.resume.education.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
                        Education
                      </h3>
                      <div className="space-y-2">
                        {result.resume.education.map((edu, i) => (
                          <div key={i} className="flex justify-between items-baseline text-[9.5pt] text-zinc-800 select-text">
                            <div>
                              <strong className="font-semibold text-black">{edu.degree}</strong> — {edu.institution}
                              {edu.gpa && <span className="text-zinc-600"> (GPA: {edu.gpa})</span>}
                            </div>
                            <span className="text-xs text-zinc-600">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {result.resume.certifications && result.resume.certifications.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
                        Certifications
                      </h3>
                      <ul className="list-disc pl-5 text-[9.5pt] text-zinc-800 space-y-0.5">
                        {result.resume.certifications.map((cert, i) => (
                          <li key={i}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Achievements */}
                  {result.resume.achievements && result.resume.achievements.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
                        Achievements
                      </h3>
                      <ul className="list-disc pl-5 text-[9.5pt] text-zinc-800 space-y-0.5">
                        {result.resume.achievements.map((ach, i) => (
                          <li key={i}>{ach}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
