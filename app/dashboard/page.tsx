"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import {
  CV_SECTIONS,
  extractCvText,
  missingSections,
  parseCvText,
  validateCvFile,
  type CvDraft,
} from "@/lib/cv-extract";
import { getPortfolioForUser, savePortfolioForUser, type Portfolio } from "@/lib/portfolio-store";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          My CV &amp; portfolio
        </h1>
        <div className="mt-8 text-black dark:text-zinc-50">
          <AuthGate>{(user) => <SavedPortfolio userId={user.uid} />}</AuthGate>
        </div>
      </div>
    </div>
  );
}

function SavedPortfolio({ userId }: { userId: string }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getPortfolioForUser(userId)
      .then((found) => {
        if (!cancelled) setPortfolio(found);
      })
      .catch(() => {
        if (!cancelled) setPortfolio(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (portfolio === undefined) return <p>Loading…</p>;
  return <DashboardContent portfolio={portfolio} userId={userId} onChange={setPortfolio} />;
}

export function DashboardContent({
  portfolio,
  userId,
  onChange,
}: {
  portfolio: Portfolio | null;
  userId?: string;
  onChange?: (portfolio: Portfolio) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {portfolio ? (
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="font-medium text-black dark:text-zinc-50">{portfolio.title}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Last saved {portfolio.lastSavedAt} · {portfolio.status}
          </p>
        </div>
      ) : (
        <p className="text-lg font-medium text-black dark:text-zinc-50">Nothing saved yet</p>
      )}
      <CvUpload userId={userId} portfolio={portfolio} onChange={onChange} />
      {portfolio?.cv && <CvSections cv={portfolio.cv} />}
    </div>
  );
}

function CvUpload({
  userId,
  portfolio,
  onChange,
}: {
  userId?: string;
  portfolio: Portfolio | null;
  onChange?: (portfolio: Portfolio) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || !userId) return;
    const problem = validateCvFile(file);
    if (problem) {
      setMessage(problem);
      return;
    }
    setMessage(null);
    setBusy(true);
    let cv: CvDraft;
    let failed = false;
    try {
      cv = parseCvText(await extractCvText(file));
    } catch {
      failed = true;
      cv = parseCvText("");
    }
    const next: Portfolio = {
      title: portfolio?.title ?? "My CV",
      lastSavedAt: new Date().toISOString().slice(0, 10),
      status: portfolio?.status ?? "draft",
      cv,
    };
    try {
      await savePortfolioForUser(userId, next);
      onChange?.(next);
      if (failed) setMessage("We couldn't read that file, so please fill in the sections below.");
    } catch {
      setMessage("We couldn't save your CV draft. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/[.12] py-10 text-center dark:border-white/[.18]">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">PDF or DOCX, up to 5 MB</p>
      <label className="flex h-11 cursor-pointer items-center justify-center rounded-full bg-foreground px-6 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]">
        {busy ? "Reading your CV…" : "Upload your CV"}
        <input
          type="file"
          className="sr-only"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={busy}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      <p role="status" className="min-h-5 px-4 text-sm text-red-700 dark:text-red-400">
        {message}
      </p>
    </div>
  );
}

export function CvSections({ cv }: { cv: CvDraft }) {
  const missing = missingSections(cv);
  return (
    <div className="flex flex-col gap-4">
      {missing.length > 0 && (
        <p className="rounded-lg border border-amber-700 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-50">
          Please fill in: {missing.map((key) => CV_SECTIONS.find((s) => s.key === key)!.label).join(", ")}.
        </p>
      )}
      {CV_SECTIONS.map(({ key, label }) => {
        const value = cv[key];
        const items = Array.isArray(value) ? value : value ? [value] : [];
        return (
          <section
            key={key}
            className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
          >
            <h3 className="font-medium text-black dark:text-zinc-50">{label}</h3>
            {items.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Needs filling in</p>
            ) : (
              <ul className="mt-1 list-disc pl-5 text-sm text-zinc-800 dark:text-zinc-200">
                {items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
