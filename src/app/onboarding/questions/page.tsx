"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile, UserProfile } from "@/lib/profile";

interface GapQuestion {
  id: string;
  type: "project_deepdive" | "bucket_fill" | "intent";
  bucket: string;
  project_name: string | null;
  question: string;
  placeholder: string;
  why_asking: string;
}

export default function OnboardingQuestions() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<GapQuestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completeness, setCompleteness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showIdentityStep, setShowIdentityStep] = useState(false);
  const [identityErrors, setIdentityErrors] = useState<Record<string, string>>({});

  // Load profile and fetch questions
  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    
    // If identity name or email is empty, we must collect it first in the wizard
    if (!loaded.identity.name || !loaded.identity.email) {
      setShowIdentityStep(true);
      setLoading(false);
      
      const dummyIdentityQuestion: GapQuestion = {
        id: "identity_onboarding",
        type: "bucket_fill",
        bucket: "identity",
        project_name: null,
        question: "Let's start with who you are",
        placeholder: "",
        why_asking: "Your contact details are needed to format your resume."
      };
      setQuestions([dummyIdentityQuestion]);
    } else {
      fetchQuestions(loaded);
    }
  }, []);

  const fetchQuestions = async (currentProfile: UserProfile) => {
    try {
      setLoading(true);
      const res = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentProfile),
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setCompleteness(data.profile_completeness);
        
        // Populate initial answers from profile
        const initialAnswers: Record<string, string> = {};
        data.questions.forEach((q: GapQuestion) => {
          if (q.type === "project_deepdive" && q.project_name) {
            const proj = currentProfile.projects.find(p => p.name === q.project_name);
            if (proj) {
              if (q.bucket === "problem_statement") initialAnswers[q.id] = proj.problem_solved || "";
              if (q.bucket === "hardest_challenge") initialAnswers[q.id] = proj.hardest_challenge || "";
              if (q.bucket === "project_outcome") initialAnswers[q.id] = proj.outcome || "";
            }
          } else if (q.type === "intent") {
            if (q.bucket === "intent_energizes") initialAnswers[q.id] = currentProfile.intent.energizes || "";
            if (q.bucket === "intent_culture") initialAnswers[q.id] = currentProfile.intent.culture || "";
            if (q.bucket === "intent_proudest") initialAnswers[q.id] = currentProfile.intent.proudest || "";
          }
        });
        setAnswers(initialAnswers);
      }
    } catch (e) {
      console.error("Failed to load questions", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-soft">
        <div className="text-ink-mute animate-pulse text-sm">Analyzing profile and compiling questions...</div>
      </div>
    );
  }

  const activeQuestion = questions[activeIdx];

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: e.target.value,
    }));
  };

  const handleIdentityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        identity: {
          ...prev.identity,
          [name]: value,
        },
      };
    });
    if (identityErrors[name]) {
      setIdentityErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSaveIdentity = () => {
    if (!profile) return;
    
    // Validate
    const newErrors: Record<string, string> = {};
    if (!profile.identity.name.trim()) newErrors.name = "Full name is required.";
    if (!profile.identity.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(profile.identity.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    
    // Validate clean LinkedIn URL
    if (profile.identity.linkedin && profile.identity.linkedin.includes("redirect")) {
      newErrors.linkedin = "Please enter a clean LinkedIn URL (e.g. linkedin.com/in/username).";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setIdentityErrors(newErrors);
      return;
    }

    saveProfile(profile);
    setShowIdentityStep(false);
    setLoading(true);
    fetchQuestions(profile);
  };

  const handleSaveAnswer = async () => {
    if (!profile || !activeQuestion) return;

    const currentAnswer = answers[activeQuestion.id] || "";
    
    // Update local profile copy
    const updatedProfile = { ...profile };

    if (activeQuestion.type === "project_deepdive" && activeQuestion.project_name) {
      updatedProfile.projects = updatedProfile.projects.map((proj) => {
        if (proj.name === activeQuestion.project_name) {
          const updatedProj = { ...proj };
          if (activeQuestion.bucket === "problem_statement") updatedProj.problem_solved = currentAnswer;
          if (activeQuestion.bucket === "hardest_challenge") updatedProj.hardest_challenge = currentAnswer;
          if (activeQuestion.bucket === "project_outcome") updatedProj.outcome = currentAnswer;
          return updatedProj;
        }
        return proj;
      });
    } else if (activeQuestion.type === "intent") {
      updatedProfile.intent = {
        ...updatedProfile.intent,
        energizes: activeQuestion.bucket === "intent_energizes" ? currentAnswer : updatedProfile.intent.energizes,
        culture: activeQuestion.bucket === "intent_culture" ? currentAnswer : updatedProfile.intent.culture,
        proudest: activeQuestion.bucket === "intent_proudest" ? currentAnswer : updatedProfile.intent.proudest,
      };
    }

    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    // Refresh completeness score
    try {
      const res = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });
      const data = await res.json();
      if (data.profile_completeness !== undefined) {
        setCompleteness(data.profile_completeness);
      }
    } catch (e) {
      console.error(e);
    }

    // Go to next question
    if (activeIdx < questions.length - 1) {
      setActiveIdx(activeIdx + 1);
    }
  };

  const handleNext = () => {
    if (activeIdx < questions.length - 1) {
      setActiveIdx(activeIdx + 1);
    }
  };

  const handlePrev = () => {
    if (showIdentityStep) {
      router.push("/onboarding/guide");
    } else if (activeIdx > 0) {
      setActiveIdx(activeIdx - 1);
    } else {
      // activeIdx === 0
      const path = localStorage.getItem("onboarding_path");
      if (path === "scratch") {
        setShowIdentityStep(true);
        const dummyIdentityQuestion: GapQuestion = {
          id: "identity_onboarding",
          type: "bucket_fill",
          bucket: "identity",
          project_name: null,
          question: "Let's start with who you are",
          placeholder: "",
          why_asking: "Your contact details are needed to format your resume."
        };
        setQuestions([dummyIdentityQuestion]);
        setActiveIdx(0);
      } else {
        router.push("/onboarding/upload");
      }
    }
  };

  const handleFinish = () => {
    if (profile) {
      saveProfile(profile);
    }
    localStorage.setItem("onboarding_complete", "true");
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Navigation */}
      <header className="border-b border-hairline bg-canvas py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl text-primary font-bold">⚡️</span>
          <span className="text-lg font-bold tracking-tight text-ink uppercase">Rolify</span>
        </div>
        <div className="text-sm text-ink-mute">
          Step <span className="font-medium text-ink">3</span> of 3
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row bg-canvas-soft">
        {/* Left Panel: Progress and Checklist */}
        <section className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-hairline bg-canvas p-6 flex flex-col justify-between shrink-0">
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">
                Profile Completeness
              </span>
              <div className="flex items-center justify-between mt-2 mb-1">
                <span className="text-3xl font-light tracking-tight text-primary body-tabular">
                  {completeness}%
                </span>
                <span className="text-xs text-ink-mute font-medium">Complete</span>
              </div>
              <div className="w-full h-1.5 bg-canvas-soft rounded-pill overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            <div className="border-t border-hairline pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-4">
                Questions Checklist
              </h3>
              <div className="space-y-2 max-h-[300px] lg:max-h-[450px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isCompleted = q.id === "identity_onboarding"
                    ? !showIdentityStep
                    : (answers[q.id]?.trim().length || 0) > 0;
                  const isActive = idx === activeIdx;

                  return (
                    <button
                      key={q.id}
                      onClick={() => !showIdentityStep && setActiveIdx(idx)}
                      disabled={showIdentityStep}
                      className={`w-full text-left p-3 rounded-md border text-xs transition-all flex items-center justify-between ${
                        isActive
                          ? "border-primary bg-primary-bg-subdued text-primary font-medium"
                          : isCompleted
                          ? "border-hairline bg-canvas text-ink-secondary"
                          : "border-hairline bg-canvas text-ink-mute opacity-80"
                      }`}
                    >
                      <div className="truncate mr-2">
                        {q.type === "project_deepdive" && (
                          <span className="font-semibold block mb-0.5">Project: {q.project_name}</span>
                        )}
                        {q.type === "intent" && <span className="font-semibold block mb-0.5">Career Intent</span>}
                        {q.question}
                      </div>
                      <span className="flex-shrink-0">
                        {isCompleted ? "✓" : isActive ? "→" : "○"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-hairline lg:block hidden">
            <button
              onClick={handleFinish}
              disabled={showIdentityStep}
              className={`w-full font-medium text-sm rounded-pill py-2.5 shadow-blue-sm transition-colors ${
                showIdentityStep
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-primary text-white hover:bg-primary-deep active:bg-primary-press"
              }`}
            >
              Go to Dashboard
            </button>
            <p className="text-[11px] text-ink-mute text-center mt-2.5">
              You can skip questions and fill them later.
            </p>
          </div>
        </section>

        {/* Right Panel: Question Form Workspace */}
        <section className="flex-1 p-6 md:p-12 flex flex-col justify-center items-center">
          {activeQuestion ? (
            <div className="w-full max-w-2xl bg-canvas border border-hairline rounded-lg shadow-blue-md p-8 md:p-10 flex flex-col min-h-[480px] justify-between">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary-bg-subdued px-2.5 py-1 rounded-pill">
                    {showIdentityStep
                      ? "Identity Setup"
                      : activeQuestion.type === "project_deepdive"
                      ? `Project deep-dive: ${activeQuestion.project_name}`
                      : activeQuestion.type === "intent"
                      ? "Career Intent"
                      : "General Detail"}
                  </span>
                  <span className="text-xs text-ink-mute font-medium">
                    Question {activeIdx + 1} of {questions.length}
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-light text-ink tracking-tight leading-tight">
                  {activeQuestion.question}
                </h2>

                <div className="mt-3 p-3 bg-canvas-soft border border-hairline rounded-sm text-xs text-ink-secondary">
                  <span className="font-semibold text-primary block mb-0.5 uppercase tracking-wider text-[10px]">
                    Why we ask this:
                  </span>
                  {activeQuestion.why_asking}
                </div>

                {showIdentityStep ? (
                  <div className="space-y-4 mt-6">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profile?.identity.name || ""}
                        onChange={handleIdentityChange}
                        placeholder="e.g. Parash Rautela"
                        className={`w-full px-3 py-2 bg-canvas text-ink text-sm border ${
                          identityErrors.name ? "border-red-500" : "border-hairline-input hover:border-primary"
                        } rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      />
                      {identityErrors.name && <p className="mt-1 text-xs text-red-500">{identityErrors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={profile?.identity.email || ""}
                          onChange={handleIdentityChange}
                          placeholder="e.g. parash@design.co"
                          className={`w-full px-3 py-2 bg-canvas text-ink text-sm border ${
                            identityErrors.email ? "border-red-500" : "border-hairline-input hover:border-primary"
                          } rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                        />
                        {identityErrors.email && <p className="mt-1 text-xs text-red-500">{identityErrors.email}</p>}
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={profile?.identity.phone || ""}
                          onChange={handleIdentityChange}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-3 py-2 bg-canvas text-ink text-sm border border-hairline-input hover:border-primary rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="location" className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
                          Location (City only)
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={profile?.identity.location || ""}
                          onChange={handleIdentityChange}
                          placeholder="e.g. New Delhi"
                          className="w-full px-3 py-2 bg-canvas text-ink text-sm border border-hairline-input hover:border-primary rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label htmlFor="portfolio" className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
                          Portfolio URL
                        </label>
                        <input
                          type="text"
                          id="portfolio"
                          name="portfolio"
                          value={profile?.identity.portfolio || ""}
                          onChange={handleIdentityChange}
                          placeholder="e.g. parash.design"
                          className="w-full px-3 py-2 bg-canvas text-ink text-sm border border-hairline-input hover:border-primary rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="linkedin" className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
                        LinkedIn URL
                      </label>
                      <input
                        type="text"
                        id="linkedin"
                        name="linkedin"
                        value={profile?.identity.linkedin || ""}
                        onChange={handleIdentityChange}
                        placeholder="e.g. linkedin.com/in/parashrautela"
                        className={`w-full px-3 py-2 bg-canvas text-ink text-sm border ${
                          identityErrors.linkedin ? "border-red-500" : "border-hairline-input hover:border-primary"
                        } rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      />
                      {identityErrors.linkedin && <p className="mt-1 text-xs text-red-500">{identityErrors.linkedin}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <label htmlFor="active-answer" className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
                      Your Response
                    </label>
                    <textarea
                      id="active-answer"
                      value={answers[activeQuestion.id] || ""}
                      onChange={handleAnswerChange}
                      rows={5}
                      placeholder={activeQuestion.placeholder}
                      className="w-full px-3 py-2 bg-canvas text-ink text-sm border border-hairline-input hover:border-primary rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-hairline flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    className="font-medium text-xs rounded-pill px-4 py-2 border border-hairline text-ink-secondary hover:bg-canvas-soft transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={showIdentityStep || activeIdx === questions.length - 1}
                    className={`font-medium text-xs rounded-pill px-4 py-2 border transition-colors ${
                      showIdentityStep || activeIdx === questions.length - 1
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-hairline text-ink-secondary hover:bg-canvas-soft"
                    }`}
                  >
                    Skip
                  </button>
                </div>
                <button
                  onClick={showIdentityStep ? handleSaveIdentity : handleSaveAnswer}
                  className="w-full sm:w-auto bg-primary text-white font-medium text-sm rounded-pill px-6 py-2.5 hover:bg-primary-deep active:bg-primary-press transition-colors shadow-blue-sm"
                >
                  Save and Continue →
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-xl bg-canvas border border-hairline rounded-lg shadow-blue-md p-10 text-center">
              <span className="text-3xl">✨</span>
              <h2 className="mt-4 text-2xl font-light text-ink tracking-tight">Your profile is fully ready!</h2>
              <p className="mt-2 text-sm text-ink-secondary">
                You have addressed all gaps. Let&apos;s go to the tailoring dashboard to optimize your resume for specific job applications.
              </p>
              <button
                onClick={handleFinish}
                className="mt-8 bg-primary text-white font-medium text-sm rounded-pill px-8 py-3 hover:bg-primary-deep transition-colors shadow-blue-sm"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          <div className="mt-6 lg:hidden block w-full max-w-2xl px-4">
            <button
              onClick={handleFinish}
              disabled={showIdentityStep}
              className={`w-full font-medium text-sm rounded-pill py-2.5 shadow-blue-sm transition-colors ${
                showIdentityStep
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-primary text-white hover:bg-primary-deep"
              }`}
            >
              Go to Dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
