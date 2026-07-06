"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const GoogleLogo = () => (
  <svg
    className="mr-2 h-5 w-5 shrink-0"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);



  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during Google sign-in.");
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(`Check your email — we sent a magic link to ${email}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F5] p-6">
      <div className="w-full max-w-[420px] bg-white border border-[#E2E2DE] rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-10 flex flex-col">
        {/* Logo / wordmark at top center */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold tracking-tight text-ink">
            Rolify
          </span>
        </div>

        {/* Headline & Subheadline */}
        <div className="text-center mb-6">
          <h2 className="text-[28px] font-semibold text-ink tracking-tight leading-tight">
            Sign in to Rolify
          </h2>
          <p className="mt-1.5 text-[15px] text-[#6B6B63] leading-relaxed">
            Tailor your resume to every job.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-100">
            {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4 border border-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink leading-relaxed">
              {successMsg}
            </p>
            <button
              onClick={() => setSuccessMsg(null)}
              className="mt-4 text-xs font-semibold text-[#1B4DFF] hover:underline"
            >
              Try another email
            </button>
          </div>
        ) : (
          <>
            {/* Continue with Google button */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="flex w-full items-center justify-center rounded-[8px] bg-white border-[1.5px] border-[#E2E2DE] py-[11px] text-sm font-medium text-ink transition-all duration-200 hover:border-[#0A0A0A] active:scale-[0.98] cursor-pointer"
            >
              <GoogleLogo />
              Continue with Google
            </button>

            {/* Divider with "or" label */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E2DE]"></div>
              </div>
              <span className="relative bg-white px-3 text-xs text-[#9E9E94] font-mono">
                or
              </span>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-[8px] border border-[#E2E2DE] bg-white px-3.5 py-[11px] text-sm text-ink placeholder:text-[#9E9E94] hover:border-[#0A0A0A] focus:border-[#1B4DFF] focus:outline-none focus:ring-1 focus:ring-[#1B4DFF] transition-all duration-150"
                />
              </div>

              {/* Continue with email button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[8px] bg-[#1B4DFF] py-[11px] text-sm font-semibold text-white transition-all duration-200 hover:bg-[#0f3dff] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                Continue with email
              </button>
            </form>
          </>
        )}

        {/* Fine print */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-[#9E9E94] leading-relaxed">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="hover:underline font-normal text-[#6B6B63]"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="hover:underline font-normal text-[#6B6B63]"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
