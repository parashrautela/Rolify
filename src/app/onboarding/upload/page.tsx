"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, UserProfile, syncProfileToSupabase } from "@/lib/profile";

// Local SVGs for self-contained premium design
const UploadCloudIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary animate-bounce-slow"
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m15 15-3-3-3 3" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-green-500"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-red-500"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const Spinner = () => (
  <svg
    className="animate-spin h-8 w-8 text-primary"
    xmlns="http://www.w3.org/2000/svg"
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
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

type UploadState = "idle" | "dragging" | "parsing" | "success" | "error";

export default function OnboardingUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [extractedProfile, setExtractedProfile] = useState<UserProfile | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Helper to load PDF.js from CDN dynamically
  const loadPdfJs = () => {
    return new Promise<any>((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        try {
          // Bypass browser CORS policy by loading the worker via a Blob URL
          const workerCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js');`;
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
          console.log("PDF.js worker loaded successfully via blob URL.");
        } catch (workerErr) {
          console.warn("Blob worker fallback triggered:", workerErr);
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        }
        resolve(pdfjsLib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF parsing engine from CDN."));
      document.body.appendChild(script);
    });
  };

  // Helper to extract text from PDF in the browser
  const extractPdfText = async (file: File): Promise<string> => {
    console.log("Starting client-side text extraction for:", file.name);
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    
    // Uint8Array wrapper is standard for binary data in PDF.js
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    console.log(`PDF loaded. Total pages: ${pdf.numPages}`);
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Extracting text from page ${i}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      console.log(`Page ${i} text length:`, pageText.trim().length);
      fullText += pageText + "\n";
    }
    console.log("Completed client-side text extraction. Total characters:", fullText.trim().length);
    return fullText;
  };

  const triggerFilePicker = () => {
    if (uploadState !== "parsing") {
      fileInputRef.current?.click();
    }
  };

  const processFile = async (file: File) => {
    // Validate File Type
    const allowedExtensions = [".pdf", ".docx"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setErrorMsg("Wrong file type. Only PDF and DOCX formats are accepted.");
      setUploadState("error");
      return;
    }

    // Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg("File is too large. Maximum allowed size is 5MB.");
      setUploadState("error");
      return;
    }

    // Clear previous errors
    setErrorMsg("");
    setFileName(file.name);
    setUploadState("parsing");

    try {
      const payload: any = {
        fileName: file.name,
        fileType: file.type,
      };

      if (file.type === "application/pdf" || fileExtension === ".pdf") {
        let pdfText = "";
        try {
          pdfText = await extractPdfText(file);
        } catch (extractErr) {
          console.warn("Client-side PDF text extraction failed. Falling back to native file parsing.", extractErr);
        }

        if (pdfText && pdfText.trim().length > 10) {
          payload.text = pdfText;
        } else {
          // Fall back to sending raw file data for server-side / Gemini multimodal OCR processing
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error("Failed to read PDF document."));
            reader.readAsDataURL(file);
          });
          payload.fileData = base64Data;
        }
      } else {
        // DOCX: Send base64 to server to parse
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error("Failed to read Word document."));
          reader.readAsDataURL(file);
        });
        payload.fileData = base64Data;
      }

      const response = await fetch("/api/extract-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse the resume file.");
      }

      setExtractedProfile(data);
      saveProfile(data);

      // Save parsed data to Supabase in the background
      await syncProfileToSupabase(data);

      setUploadState("success");
    } catch (err: any) {
      console.error("Resume extraction error:", err);
      setErrorMsg(err.message || "Parse failure. Please try again with a clean PDF/DOCX file.");
      setUploadState("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState !== "parsing") {
      setUploadState("dragging");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState !== "parsing") {
      setUploadState("idle");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState === "parsing") return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    } else {
      setUploadState("idle");
    }
  };

  const handleContinue = () => {
    if (uploadState === "success") {
      router.push("/onboarding/questions");
    }
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
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Navigation */}
      <header className="border-b border-hairline bg-canvas py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl text-primary font-bold">⚡️</span>
          <span className="text-lg font-bold tracking-tight text-ink uppercase">Rolify</span>
        </div>
        <div className="text-sm text-ink-mute">
          Step <span className="font-medium text-ink">2</span> of 3
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 bg-canvas-soft">
        <div
          style={localVariables}
          className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-blue-md p-8 md:p-10"
        >
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary-bg-subdued px-2.5 py-1 rounded-pill">
              Resume Upload
            </span>
            <h1 className="mt-4 text-3xl font-light text-ink tracking-tight">
              Upload your resume
            </h1>
            <p className="mt-2 text-sm text-ink-secondary">
              Upload your resume and we&apos;ll parse it to pre-fill your professional details automatically.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFilePicker}
            className={`w-full min-h-[220px] border-2 border-dashed rounded-md flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 ${
              uploadState === "dragging"
                ? "border-primary bg-primary-bg-subdued/50"
                : uploadState === "parsing"
                ? "border-[var(--color-border-strong)] bg-canvas-soft cursor-not-allowed"
                : uploadState === "success"
                ? "border-green-500 bg-green-50/30"
                : uploadState === "error"
                ? "border-red-300 bg-red-50/20"
                : "border-[var(--color-border)] hover:border-primary hover:bg-canvas-soft"
            }`}
          >
            {/* Native File Input Hidden */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx"
              className="hidden"
              disabled={uploadState === "parsing"}
            />

            {uploadState === "idle" && (
              <div className="flex flex-col items-center">
                <UploadCloudIcon />
                <p className="mt-4 text-sm font-medium text-ink">
                  Drag and drop your resume here, or <span className="text-primary hover:underline">click to browse</span>
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Accepted formats: PDF, DOCX (Max size: 5MB)
                </p>
              </div>
            )}

            {uploadState === "dragging" && (
              <div className="flex flex-col items-center pointer-events-none">
                <UploadCloudIcon />
                <p className="mt-4 text-sm font-semibold text-primary">
                  Drop your file here...
                </p>
                <p className="mt-2 text-xs text-primary/80">
                  Ready to upload PDF or DOCX
                </p>
              </div>
            )}

            {uploadState === "parsing" && (
              <div className="flex flex-col items-center">
                <Spinner />
                <p className="mt-4 text-sm font-medium text-ink">
                  Uploading and extracting {fileName}...
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)] animate-pulse">
                  This will take a few seconds
                </p>
              </div>
            )}

            {uploadState === "success" && (
              <div className="flex flex-col items-center">
                <CheckCircleIcon />
                <p className="mt-3 text-sm font-semibold text-green-700">
                  Upload & Extraction Successful!
                </p>
                <p className="mt-1 text-xs text-ink font-mono bg-canvas-soft border border-[var(--color-border)] px-2.5 py-1 rounded-sm">
                  {fileName}
                </p>
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  Click Continue below to fill missing details.
                </p>
              </div>
            )}

            {uploadState === "error" && (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <AlertTriangleIcon />
                </div>
                <p className="text-sm font-semibold text-red-600">
                  Upload Error
                </p>
                <p className="mt-1.5 text-xs text-red-700 max-w-xs leading-relaxed">
                  {errorMsg}
                </p>
                <p className="mt-4 text-xs text-primary font-medium hover:underline">
                  Click to try again
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex justify-between items-center">
            <button
              onClick={() => router.push("/onboarding/start")}
              className="text-ink-mute hover:text-ink font-medium text-sm px-4 py-2.5 transition-colors"
              disabled={uploadState === "parsing"}
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={uploadState !== "success"}
              className={`font-medium text-sm rounded-pill px-8 py-2.5 shadow-blue-sm transition-all duration-200 ${
                uploadState === "success"
                  ? "bg-primary text-white hover:bg-primary-deep active:bg-primary-press"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
