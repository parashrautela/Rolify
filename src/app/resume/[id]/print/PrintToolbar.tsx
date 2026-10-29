"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PrintToolbar({
  fileTitle,
  jobTitle,
  company,
}: {
  fileTitle: string;
  jobTitle: string;
  company: string | null;
}) {
  // The extension's "Download PDF" lands here, so open the print dialog straight away.
  // The document title becomes the default PDF file name.
  useEffect(() => {
    document.title = fileTitle;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [fileTitle]);

  return (
    <header className="no-print border-b border-hairline bg-canvas py-4 px-6 md:px-12 flex justify-between items-center gap-4">
      <div className="min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute block">
          Tailored resume
        </span>
        <span className="text-sm font-medium text-ink truncate block">
          {jobTitle}
          {company ? ` at ${company}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-ink-secondary hover:text-primary transition-colors"
        >
          Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-primary text-white font-medium text-xs rounded-pill px-5 py-2.5 hover:bg-primary-deep active:bg-primary-press transition-colors shadow-blue-sm"
        >
          Download PDF
        </button>
      </div>
    </header>
  );
}
