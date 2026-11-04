"use client";

import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { initialsFor, ACCENT_COLORS } from "@/lib/personalize";
import { getPublishedPortfolio, type PublishedPortfolio } from "@/lib/portfolio-store";

export default function PublicPortfolioPage() {
  return (
    <Suspense fallback={<p className="p-6 text-black dark:text-zinc-50">Loading…</p>}>
      <PublicPortfolio />
    </Suspense>
  );
}

function PublicPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PublishedPortfolio | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getPublishedPortfolio(slug)
      .then((found) => {
        if (!cancelled) setPage(found);
      })
      .catch(() => {
        if (!cancelled) setPage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (page === undefined) return <p className="p-6 text-black dark:text-zinc-50">Loading…</p>;
  if (page === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-black dark:text-zinc-50">
        <h1 className="text-2xl font-semibold">This portfolio isn&apos;t available</h1>
        <p className="text-zinc-600 dark:text-zinc-400">It may have been taken offline or the link may be wrong.</p>
      </div>
    );
  }
  return <PortfolioView page={page} />;
}

export function PortfolioView({ page }: { page: PublishedPortfolio }) {
  const { cv } = page;
  const accent = page.accentColor ?? ACCENT_COLORS[0];
  const initials = initialsFor(cv.name);
  const [first, ...rest] = cv.name.trim().split(/\s+/);
  const surname = rest.join(" ");
  const latestRole = cv.experience[0];

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-6 py-12 text-black dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          {page.photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.photoDataUrl}
              alt={`Photo of ${cv.name}`}
              className="h-40 w-40 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              aria-label={`Monogram ${initials}`}
              className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full text-5xl font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            {page.photoDataUrl && (
              <div
                aria-label={`Monogram ${initials}`}
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: accent }}
              >
                {initials}
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl">
              <span className="font-light">{first}</span>
              {surname && <span className="font-black"> {surname}</span>}
            </h1>
            <p className="mt-2 truncate text-lg text-zinc-600 dark:text-zinc-400">{cv.headline}</p>
          </div>
        </header>

        {latestRole && (
          <section
            aria-label="Latest role"
            className="rounded-2xl border-l-8 bg-white p-6 dark:bg-zinc-950"
            style={{ borderLeftColor: accent }}
          >
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Latest role
            </h2>
            <p className="mt-2 text-lg">{latestRole}</p>
          </section>
        )}

        {(["experience", "education"] as const).map((key) =>
          cv[key].length > 0 ? (
            <section key={key}>
              <h2 className="border-b-2 pb-2 text-xl font-semibold capitalize" style={{ borderBottomColor: accent }}>
                {key}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {cv[key].map((entry, index) => (
                  <li key={index}>{entry}</li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
        {cv.skills.length > 0 && (
          <section>
            <h2 className="border-b-2 pb-2 text-xl font-semibold" style={{ borderBottomColor: accent }}>
              Skills
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {cv.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full px-3 py-1 text-sm text-white"
                  style={{ backgroundColor: accent }}
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
