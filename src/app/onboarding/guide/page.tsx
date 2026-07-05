"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Local SVGs matching Lucide icons for clean, lightweight rendering
const MessageSquareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export default function OnboardingGuide() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/onboarding/questions");
  };

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
        className="w-full max-w-[560px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-blue-md p-8 md:p-10 flex flex-col"
      >
        <div className="text-center mb-6">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Guided Onboarding
          </span>
          <h1 className="text-3xl font-light text-ink tracking-tight leading-tight mt-2">
            How it works
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Here is what to expect before we begin building your profile.
          </p>
        </div>

        {/* Stacked Cards */}
        <div className="space-y-4 my-4">
          <div className="flex gap-4 p-4 border border-[var(--color-border)] rounded-md hover:border-[var(--color-border-strong)] hover:shadow-blue-sm transition-all duration-200 bg-white">
            <div className="flex-shrink-0 mt-0.5">
              <MessageSquareIcon />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">1. Tell us about yourself</h3>
              <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                We&apos;ll ask you a few questions about your background, projects, and goals.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border border-[var(--color-border)] rounded-md hover:border-[var(--color-border-strong)] hover:shadow-blue-sm transition-all duration-200 bg-white">
            <div className="flex-shrink-0 mt-0.5">
              <ClockIcon />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">2. Short & focused</h3>
              <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                This takes about 3–5 minutes.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border border-[var(--color-border)] rounded-md hover:border-[var(--color-border-strong)] hover:shadow-blue-sm transition-all duration-200 bg-white">
            <div className="flex-shrink-0 mt-0.5">
              <SparklesIcon />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">3. Instant resume ready</h3>
              <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                At the end, you&apos;ll have a complete profile we can turn into a resume for any job.
              </p>
            </div>
          </div>
        </div>

        {/* CTA & Navigation */}
        <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex justify-between items-center">
          <button
            onClick={() => router.push("/onboarding/start")}
            className="text-ink-mute hover:text-ink font-medium text-sm px-4 py-2.5 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleStart}
            className="bg-primary text-white font-medium text-sm rounded-pill px-8 py-2.5 hover:bg-primary-deep active:bg-primary-press transition-colors shadow-blue-sm"
          >
            Let&apos;s start
          </button>
        </div>
      </div>
    </div>
  );
}
