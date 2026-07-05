"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const isComplete = localStorage.getItem("onboarding_complete") === "true";
    if (isComplete) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding/start");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-soft">
      <div className="text-ink-mute animate-pulse text-sm">Redirecting...</div>
    </div>
  );
}
