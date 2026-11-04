"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import {
  addListEntry,
  CV_SECTIONS,
  extractCvText,
  HEADLINE_MAX,
  missingSections,
  parseCvText,
  removeListEntry,
  updateCvText,
  updateListEntry,
  updateSkillsText,
  validateCvFile,
  type CvDraft,
} from "@/lib/cv-extract";
import {
  getPortfolioForUser,
  publishPortfolio,
  savePortfolioForUser,
  unpublishPortfolio,
  type Portfolio,
} from "@/lib/portfolio-store";
import { ACCENT_COLORS, initialsFor, validatePhotoFile } from "@/lib/personalize";

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
      {portfolio?.cv && <PublishPanel userId={userId} portfolio={portfolio} onChange={onChange} />}
      <PersonalizePanel userId={userId} portfolio={portfolio} onChange={onChange} />
      <CvUpload userId={userId} portfolio={portfolio} onChange={onChange} />
      {portfolio?.cv && (
        <CvSections
          cv={portfolio.cv}
          onChange={(nextCv) => {
            const next: Portfolio = {
              ...portfolio,
              cv: nextCv,
              lastSavedAt: new Date().toISOString().slice(0, 10),
            };
            onChange?.(next);
            if (userId) void savePortfolioForUser(userId, next);
          }}
        />
      )}
    </div>
  );
}

export function PublishPanel({
  userId,
  portfolio,
  onChange,
}: {
  userId?: string;
  portfolio: Portfolio;
  onChange?: (portfolio: Portfolio) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const published = portfolio.status === "published" && !!portfolio.slug;
  const link = published ? `${origin}/${portfolio.slug}` : "";

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function run(action: typeof publishPortfolio, failure: string) {
    if (!userId) return;
    setMessage(null);
    setBusy(true);
    try {
      onChange?.(await action(userId, portfolio));
    } catch {
      setMessage(failure);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Link copied.");
    } catch {
      setMessage("We couldn't copy the link. Please copy it from the box.");
    }
  }

  const buttonClassName =
    "flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]";

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
      <h3 className="font-medium text-black dark:text-zinc-50">Share your portfolio</h3>
      {published && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            aria-label="Portfolio link"
            value={link}
            className="w-full rounded-lg border border-black/[.12] bg-transparent p-2 text-sm text-black dark:border-white/[.18] dark:text-zinc-50"
          />
          <button type="button" className={buttonClassName} onClick={() => void copyLink()}>
            Copy link
          </button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className={buttonClassName}
          disabled={busy}
          onClick={() => void run(publishPortfolio, "We couldn't publish your portfolio. Please try again.")}
        >
          {published ? "Republish" : "Publish"}
        </button>
        {published && (
          <button
            type="button"
            className="text-sm font-medium text-black underline disabled:opacity-60 dark:text-zinc-50"
            disabled={busy}
            onClick={() => void run(unpublishPortfolio, "We couldn't unpublish your portfolio. Please try again.")}
          >
            Unpublish
          </button>
        )}
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-zinc-600 dark:text-zinc-400">
        {message}
      </p>
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
      ...(portfolio?.slug ? { slug: portfolio.slug } : {}),
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

export function PersonalizePanel({
  userId,
  portfolio,
  onChange,
}: {
  userId?: string;
  portfolio: Portfolio | null;
  onChange?: (portfolio: Portfolio) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const accentColor = portfolio?.accentColor ?? ACCENT_COLORS[0];
  const initials = initialsFor(portfolio?.cv?.name ?? "");

  function save(patch: Partial<Pick<Portfolio, "photoDataUrl" | "accentColor">>) {
    const next: Portfolio = {
      title: portfolio?.title ?? "My CV",
      lastSavedAt: new Date().toISOString().slice(0, 10),
      status: portfolio?.status ?? "draft",
      ...portfolio,
      ...patch,
    };
    onChange?.(next);
    if (userId) void savePortfolioForUser(userId, next);
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    const problem = validatePhotoFile(file);
    if (problem) {
      setMessage(problem);
      return;
    }
    setMessage(null);
    const dataUrl = await readFileAsDataUrl(file);
    save({ photoDataUrl: dataUrl });
  }

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
      <h3 className="font-medium text-black dark:text-zinc-50">Personalise your portfolio</h3>
      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <Avatar photoDataUrl={portfolio?.photoDataUrl} initials={initials} accentColor={accentColor} />
          <label className="cursor-pointer text-sm font-medium text-black underline dark:text-zinc-50">
            {portfolio?.photoDataUrl ? "Replace photo" : "Add photo"}
            <input
              type="file"
              className="sr-only"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={(event) => {
                void handlePhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {portfolio?.photoDataUrl && (
            <button
              type="button"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
              onClick={() => save({ photoDataUrl: undefined })}
            >
              Remove photo
            </button>
          )}
          <p role="status" className="min-h-5 px-4 text-center text-sm text-red-700 dark:text-red-400">
            {message}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Accent colour</p>
          <div role="radiogroup" aria-label="Accent colour" className="mt-2 flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={accentColor === color}
                aria-label={`Accent colour ${color}`}
                className="flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  backgroundColor: color,
                  boxShadow: accentColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined,
                }}
                onClick={() => save({ accentColor: color })}
              >
                {accentColor === color && (
                  <span aria-hidden className="text-xs font-bold text-white">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({
  photoDataUrl,
  initials,
  accentColor,
}: {
  photoDataUrl?: string;
  initials: string;
  accentColor: string;
}) {
  if (photoDataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoDataUrl} alt="Your profile photo" className="h-24 w-24 rounded-full object-cover" />;
  }
  return (
    <div
      aria-label={`Monogram ${initials}`}
      className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold text-white"
      style={{ backgroundColor: accentColor }}
    >
      {initials}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error as DOMException);
    reader.readAsDataURL(file);
  });
}

const fieldClassName =
  "mt-1 w-full rounded-lg border border-black/[.12] bg-transparent p-2 text-sm text-black dark:border-white/[.18] dark:text-zinc-50";

export function CvSections({ cv, onChange }: { cv: CvDraft; onChange: (cv: CvDraft) => void }) {
  const missing = missingSections(cv);
  return (
    <div className="flex flex-col gap-4">
      {missing.length > 0 && (
        <p className="rounded-lg border border-amber-700 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-50">
          Please fill in: {missing.map((key) => CV_SECTIONS.find((s) => s.key === key)!.label).join(", ")}.
        </p>
      )}
      <section className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h3 className="font-medium text-black dark:text-zinc-50">Name</h3>
        <input
          className={fieldClassName}
          value={cv.name}
          onChange={(event) => onChange(updateCvText(cv, "name", event.target.value))}
        />
      </section>
      <section className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h3 className="font-medium text-black dark:text-zinc-50">Headline</h3>
        <input
          className={fieldClassName}
          value={cv.headline}
          maxLength={HEADLINE_MAX}
          onChange={(event) => onChange(updateCvText(cv, "headline", event.target.value))}
        />
      </section>
      {(["experience", "education"] as const).map((key) => {
        const label = CV_SECTIONS.find((s) => s.key === key)!.label;
        return (
          <section
            key={key}
            className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
          >
            <h3 className="font-medium text-black dark:text-zinc-50">{label}</h3>
            <div className="mt-1 flex flex-col gap-2">
              {cv[key].map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className={fieldClassName}
                    value={entry}
                    onChange={(event) => onChange(updateListEntry(cv, key, index, event.target.value))}
                  />
                  <button
                    type="button"
                    aria-label={`Delete ${label.toLowerCase()} entry`}
                    className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
                    onClick={() => onChange(removeListEntry(cv, key, index))}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-black underline dark:text-zinc-50"
              onClick={() => onChange(addListEntry(cv, key))}
            >
              Add {label.toLowerCase()} entry
            </button>
          </section>
        );
      })}
      <section className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h3 className="font-medium text-black dark:text-zinc-50">Skills</h3>
        <input
          className={fieldClassName}
          value={cv.skills.join(", ")}
          onChange={(event) => onChange(updateSkillsText(cv, event.target.value))}
        />
      </section>
    </div>
  );
}
