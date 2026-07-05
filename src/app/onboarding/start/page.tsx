"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Local SVGs matching Lucide icons for self-contained, lightweight, error-free rendering
const FileTextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-[var(--color-accent)]"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const PenLineIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-[var(--color-ink)]"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const EMPTY_PROFILE = {
  identity: {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
  },
  education: [],
  experience: [],
  projects: [],
  skills: {
    languages: [],
    frameworks: [],
    tools: [],
    design: [],
    other: [],
  },
  certifications: [],
  achievements: [],
  intent: {
    energizes: "",
    culture: "",
    proudest: "",
    goal: "",
  },
};

export default function OnboardingStart() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isComplete = localStorage.getItem("onboarding_complete") === "true";
    if (isComplete) {
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [router]);

  const handleUpload = () => {
    localStorage.setItem("onboarding_path", "upload");
    router.push("/onboarding/upload");
  };

  const handleScratch = () => {
    localStorage.setItem("onboarding_path", "scratch");
    localStorage.setItem("rolify_user_profile", JSON.stringify(EMPTY_PROFILE));
    router.push("/onboarding/guide");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-soft">
        <div className="text-ink-mute animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  // Theme-scoped custom properties
  const localVariables = {
    "--color-surface": "#ffffff",
    "--color-accent": "var(--color-primary)",
    "--color-border": "var(--color-hairline)",
    "--color-border-strong": "var(--color-hairline-input)",
    "--color-muted": "var(--color-ink-mute)",
  } as React.CSSProperties;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-soft p-6">
      <div
        style={localVariables}
        className="w-full max-w-[560px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-blue-md p-8 md:p-10 flex flex-col items-center text-center"
      >
        <div className="mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Let&apos;s get started
          </span>
        </div>

        <h1 className="text-3xl font-light text-ink tracking-tight leading-tight">
          Do you have a resume?
        </h1>

        <p className="mt-2 text-sm text-ink-secondary max-w-sm">
          Choose how you want to build your profile. You can always update it later.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8">
          {/* Card A — Has a resume */}
          <div
            onClick={handleUpload}
            className="group p-5 flex flex-col items-start text-left bg-[var(--color-surface)] border-[1.5px] border-[var(--color-border)] rounded-md transition-all duration-200 hover:border-[var(--color-accent)] hover:shadow-blue-md cursor-pointer"
          >
            <div className="p-1 rounded-sm">
              <FileTextIcon />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-ink group-hover:text-[var(--color-accent)] transition-colors">
              I have a resume
            </h2>
            <p className="mt-1.5 text-xs text-[var(--color-muted)] leading-relaxed">
              Upload it and we&apos;ll build your profile in under a minute.
            </p>
          </div>

          {/* Card B — No resume */}
          <div
            onClick={handleScratch}
            className="group p-5 flex flex-col items-start text-left bg-[var(--color-surface)] border-[1.5px] border-[var(--color-border)] rounded-md transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-blue-md cursor-pointer"
          >
            <div className="p-1 rounded-sm">
              <PenLineIcon />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-ink group-hover:text-ink-secondary transition-colors">
              I don&apos;t have one yet
            </h2>
            <p className="mt-1.5 text-xs text-[var(--color-muted)] leading-relaxed">
              No worries, we&apos;ll build one together with a few quick questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
