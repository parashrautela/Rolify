import { notFound, redirect } from "next/navigation";
import ResumeDocument from "@/components/ResumeDocument";
import type { TailoredResumeData } from "@/lib/resume";
import { createCookieClient } from "@/lib/supabase-server";
import PrintToolbar from "./PrintToolbar";

/**
 * Print-ready page for a resume generated from the Chrome extension. The
 * extension opens it in a normal tab, so access is by the website session;
 * proxy.ts sends signed-out visitors to /auth and back here afterwards.
 */
export default async function ResumePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createCookieClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/resume/${id}/print`)}`);
  }

  const { data } = await supabase
    .from("tailored_resumes")
    .select("job_title, company, result")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const result = data?.result as TailoredResumeData | undefined;
  if (!result?.resume) notFound();

  const fileTitle = [result.resume.contact.name, data?.job_title, "Resume"].filter(Boolean).join(" — ");

  return (
    <div className="min-h-screen bg-canvas-soft print:bg-white">
      <PrintToolbar
        fileTitle={fileTitle}
        jobTitle={data?.job_title ?? ""}
        company={data?.company ?? null}
      />
      <main className="max-w-5xl mx-auto p-6 md:p-12 print:p-0">
        <ResumeDocument resume={result.resume} />
      </main>
    </div>
  );
}
