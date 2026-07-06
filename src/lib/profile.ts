export interface Identity {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  gpa: string | null;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  bullets: string[];
}

export interface Project {
  name: string;
  stack: string; // comma separated
  link: string | null;
  description: string;
  problem_solved: string;
  hardest_challenge: string;
  outcome: string;
}

export interface Skills {
  languages: string[];
  frameworks: string[];
  tools: string[];
  design: string[];
  other: string[];
}

export interface Intent {
  energizes: string;
  culture: string;
  proudest: string;
  goal: string;
}

export interface UserProfile {
  identity: Identity;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skills;
  certifications: string[];
  achievements: string[];
  intent: Intent;
}

export const DEFAULT_PROFILE: UserProfile = {
  identity: {
    name: "Parash Rautela",
    email: "parash@design.co",
    phone: "+91 98765 43210",
    location: "New Delhi",
    linkedin: "linkedin.com/in/parashrautela",
    portfolio: "parash.design",
  },
  education: [
    {
      degree: "B.Des in Communication Design",
      institution: "National Institute of Design (NID)",
      year: "2024",
      gpa: "8.5",
    },
  ],
  experience: [
    {
      company: "CRED",
      role: "Product Design Intern",
      duration: "Jan 2024 – Jun 2024",
      bullets: [
        "Designed the checkout interface for CRED Store, reducing checkout drop-off rate by 14%",
        "Collaborated with 5 frontend engineers to implement the brand's modular design system components in React Native",
        "Conducted usability testing sessions with 15 power users to identify friction in invoice payment flow",
      ],
    },
    {
      company: "Razorpay",
      role: "UX Design Intern",
      duration: "Jul 2023 – Dec 2023",
      bullets: [
        "Redesigned the payment links creation dashboard, boosting weekly payment link creation volume by 22%",
        "Conducted comprehensive audit of onboarding flows and identified 4 major user drop-off points",
      ],
    },
  ],
  projects: [
    {
      name: "Invoice Tracker",
      stack: "Figma, React, Tailwind CSS",
      link: "github.com/parash/invoice-tracker",
      description: "A tool for freelance designers to track invoices and send automated reminders.",
      problem_solved: "Freelancers had no simple way to track unpaid invoices — they were losing thousands of rupees a month to forgotten follow-ups.",
      hardest_challenge: "Getting the real-time payment status sync to work cleanly across multiple payment gateways without state desynchronization.",
      outcome: "Used by 150+ freelancers in India, recovering an average of 45,000 INR of overdue invoice value within the first 30 days.",
    },
    {
      name: "Space Flow",
      stack: "Figma, Framer, WebGL",
      link: "spaceflow.design",
      description: "Interactive website for booking coworking spaces with 3D floorplan previews.",
      problem_solved: "Users could not visualize workspace environments prior to physical booking, leading to high cancellation rates.",
      hardest_challenge: "Optimizing WebGL rendering of 3D floorplans to load in under 1.5 seconds on mid-range mobile devices.",
      outcome: "Framer-built marketing site generated 400+ signups, reducing cancellation rates by 40% based on user survey feedback.",
    },
  ],
  skills: {
    languages: [],
    frameworks: [],
    tools: ["Figma", "Framer", "Adobe Creative Suite", "Keynote"],
    design: ["Product Design", "Interaction Design", "User Research", "Prototyping", "Design Systems", "Visual Design"],
    other: [],
  },
  certifications: ["Google UX Design Professional Certificate, Google, 2023"],
  achievements: ["Winner of CRED Design Hackathon 2023 out of 200+ teams"],
  intent: {
    energizes: "I love the moment when a complex flow finally clicks into a simple, obvious interaction. Zero-to-one product design.",
    culture: "Small teams that move fast, where I can own things end to end and see my work ship within weeks, not months.",
    proudest: "Redesigned the onboarding for a fintech app and reduced drop-off from 68% to 31% in 6 weeks. That one taught me that clarity beats cleverness every time.",
    goal: "Build delightful and high-performing digital interfaces for millions of users worldwide.",
  },
};

const PROFILE_STORAGE_KEY = "rolify_user_profile";

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const data = localStorage.getItem(PROFILE_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_PROFILE;
  } catch (e) {
    console.error("Failed to load profile from localStorage:", e);
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile to localStorage:", e);
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear profile from localStorage:", e);
  }
}

export async function syncProfileToSupabase(profile: UserProfile): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("No authenticated user found, skipping Supabase sync.");
      return;
    }

    // 1. Get or create resume record
    let { data: resume } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let resumeId;
    if (resume) {
      resumeId = resume.id;
      await supabase
        .from('resumes')
        .update({ raw_text: JSON.stringify(profile) })
        .eq('id', resumeId);
    } else {
      const { data: newResume, error: insertError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          raw_text: JSON.stringify(profile)
        })
        .select('id')
        .single();

      if (insertError || !newResume) {
        console.error("Failed to insert resume record:", insertError);
        return;
      }
      resumeId = newResume.id;
    }

    // 2. Sync to resume_parsed table (1-to-1)
    await supabase.from('resume_parsed').delete().eq('resume_id', resumeId);
    await supabase.from('resume_parsed').insert({
      resume_id: resumeId,
      full_name: profile.identity.name || '',
      email: profile.identity.email || '',
      phone: profile.identity.phone || '',
      location: profile.identity.location || '',
      linkedin: profile.identity.linkedin || '',
      portfolio: profile.identity.portfolio || '',
      summary: '',
      certifications: profile.certifications || [],
      achievements: profile.achievements || [],
      intent_energizes: profile.intent.energizes || '',
      intent_culture: profile.intent.culture || '',
      intent_proudest: profile.intent.proudest || '',
      intent_goal: profile.intent.goal || ''
    });

    // 3. Sync to education table
    await supabase.from('education').delete().eq('resume_id', resumeId);
    if (profile.education && profile.education.length > 0) {
      await supabase.from('education').insert(
        profile.education.map((edu: any) => ({
          resume_id: resumeId,
          institution: edu.institution || '',
          degree: edu.degree || '',
          year: edu.year || '',
          gpa: edu.gpa || null
        }))
      );
    }

    // 4. Sync to experience table
    await supabase.from('experience').delete().eq('resume_id', resumeId);
    if (profile.experience && profile.experience.length > 0) {
      await supabase.from('experience').insert(
        profile.experience.map((exp: any) => ({
          resume_id: resumeId,
          company: exp.company || '',
          role: exp.role || '',
          duration: exp.duration || '',
          description: exp.description || '',
          bullets: exp.bullets || []
        }))
      );
    }

    // 5. Sync to projects table
    await supabase.from('projects').delete().eq('resume_id', resumeId);
    if (profile.projects && profile.projects.length > 0) {
      await supabase.from('projects').insert(
        profile.projects.map((proj: any) => ({
          resume_id: resumeId,
          name: proj.name || '',
          description: proj.description || '',
          stack: proj.stack || '',
          link: proj.link || null,
          problem_solved: proj.problem_solved || '',
          hardest_challenge: proj.hardest_challenge || '',
          outcome: proj.outcome || ''
        }))
      );
    }

    // 6. Sync to skills table
    await supabase.from('skills').delete().eq('resume_id', resumeId);
    await supabase.from('skills').insert({
      resume_id: resumeId,
      languages: profile.skills.languages || [],
      frameworks: profile.skills.frameworks || [],
      tools: profile.skills.tools || [],
      design: profile.skills.design || [],
      other: profile.skills.other || []
    });

    console.log("Successfully synced profile to Supabase tables!");
  } catch (err) {
    console.error("Error in syncProfileToSupabase:", err);
  }
}
