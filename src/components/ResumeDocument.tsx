import type { TailoredResumeData } from "@/lib/resume";

/** ATS-friendly resume layout shared by the dashboard preview and /resume/[id]/print. */
export default function ResumeDocument({ resume }: { resume: TailoredResumeData["resume"] }) {
  return (
    <div className="bg-canvas border border-hairline shadow-blue-md p-12 overflow-x-auto min-h-[11in] w-full resume-print-container select-text">
      <div className="max-w-[7.5in] mx-auto space-y-6 text-black font-sans leading-relaxed text-[10.5pt] select-text">

        {/* Contact header */}
        <div className="text-center space-y-1.5 border-b border-black/10 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-black">
            {resume.contact.name}
          </h2>
          <div className="text-xs text-zinc-600 flex flex-wrap justify-center items-center gap-x-2 gap-y-1">
            <span>{resume.contact.email}</span>
            <span>|</span>
            <span>{resume.contact.phone}</span>
            <span>|</span>
            <span>{resume.contact.location}</span>
            {resume.contact.linkedin && (
              <>
                <span>|</span>
                <span className="font-semibold">{resume.contact.linkedin}</span>
              </>
            )}
            {resume.contact.portfolio && (
              <>
                <span>|</span>
                <span className="font-semibold">{resume.contact.portfolio}</span>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
            Professional Summary
          </h3>
          <p className="text-zinc-800 text-[10pt] leading-normal">{resume.summary}</p>
        </div>

        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
              Professional Experience
            </h3>
            <div className="space-y-3.5">
              {resume.experience.map((exp, i) => (
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
        {resume.projects && resume.projects.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
              Projects
            </h3>
            <div className="space-y-3.5">
              {resume.projects.map((proj, i) => (
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
            {resume.skills.design && resume.skills.design.length > 0 && (
              <p>
                <strong className="font-semibold text-black">Design & Strategy:</strong> {resume.skills.design.join(", ")}
              </p>
            )}
            {resume.skills.tools && resume.skills.tools.length > 0 && (
              <p>
                <strong className="font-semibold text-black">Tools & Software:</strong> {resume.skills.tools.join(", ")}
              </p>
            )}
            {resume.skills.frameworks && resume.skills.frameworks.length > 0 && (
              <p>
                <strong className="font-semibold text-black">Frameworks:</strong> {resume.skills.frameworks.join(", ")}
              </p>
            )}
            {resume.skills.languages && resume.skills.languages.length > 0 && (
              <p>
                <strong className="font-semibold text-black">Languages:</strong> {resume.skills.languages.join(", ")}
              </p>
            )}
            {resume.skills.other && resume.skills.other.length > 0 && (
              <p>
                <strong className="font-semibold text-black">Other:</strong> {resume.skills.other.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
              Education
            </h3>
            <div className="space-y-2">
              {resume.education.map((edu, i) => (
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
        {resume.certifications && resume.certifications.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
              Certifications
            </h3>
            <ul className="list-disc pl-5 text-[9.5pt] text-zinc-800 space-y-0.5">
              {resume.certifications.map((cert, i) => (
                <li key={i}>{cert}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Achievements */}
        {resume.achievements && resume.achievements.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black text-black">
              Achievements
            </h3>
            <ul className="list-disc pl-5 text-[9.5pt] text-zinc-800 space-y-0.5">
              {resume.achievements.map((ach, i) => (
                <li key={i}>{ach}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
