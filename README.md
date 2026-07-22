# Rolify

Rolify is an AI-powered resume tailoring and job application dashboard built with Next.js, React, and Supabase. It helps users automatically tailor their resumes to specific job descriptions, perform gap analysis, and generate cover letter insights.

## Features

- **Resume Extraction**: Upload your existing resume (supports PDF and DOCX formats via `pdf-parse` and `mammoth`).
- **AI-Powered Tailoring**: Match your profile and experience against target Job Descriptions (JDs) to get a tailored resume.
- **Gap Analysis**: Identifies missing keywords and highlights used keywords to improve ATS (Applicant Tracking System) scores.
- **Cover Letter Generation**: Automatically generates customized answers to common application questions (e.g., "Why this role?", "Why this company?", "Biggest strength?", "Culture fit?").
- **Authentication**: Secure user authentication and session management powered by Supabase.
- **Dashboard**: A clean, responsive dashboard to view your tailoring scores, edit your profile, and manage your applications.

## Tech Stack

- **Frontend Framework**: [Next.js](https://nextjs.org) (App Router, v16.2)
- **UI Library**: [React](https://react.dev) (v19.2)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) (v4)
- **Backend & Auth**: [Supabase](https://supabase.com) (`@supabase/supabase-js`, `@supabase/ssr`)
- **Document Parsing**: `pdf-parse` (for PDFs), `mammoth` (for DOCX)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v20+)
- npm, yarn, pnpm, or bun
- A Supabase account and project

### Environment Variables

Create a `.env.local` file in the root of the project and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Clone the repository and navigate into the project directory.
2. Install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Running the Development Server

Start the local development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `src/app/`: Contains the Next.js App Router pages and layouts.
  - `auth/`: Authentication pages (login, signup, callback).
  - `dashboard/`: The main application dashboard where users tailor resumes.
  - `onboarding/`: User onboarding flows.
  - `api/`: Next.js Route Handlers.
    - `extract-resume/`: Endpoint for parsing uploaded resumes.
    - `gap-analysis/`: Endpoint for comparing user profile against JDs.
    - `generate-resume/`: Endpoint for generating the tailored resume data.
- `src/lib/`: Utility functions, Supabase client configurations, and shared types.
- `src/proxy.ts`: Middleware for managing Supabase authentication sessions and route protection.

## Deployment

The easiest way to deploy this Next.js application is to use the [Vercel Platform](https://vercel.com/new). Ensure you add your Supabase environment variables in the Vercel dashboard before deploying.

---

*This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Geist, a new font family for Vercel.*
