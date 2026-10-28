import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getPortfolioForUser } from "@/lib/portfolio-store";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          My CV &amp; portfolio
        </h1>
        <Suspense fallback={<DashboardFallback />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="mt-8 h-40 animate-pulse rounded-2xl bg-black/[.04] dark:bg-white/[.06]" />
  );
}

async function DashboardContent() {
  const session = await auth();
  const userId = session?.user?.id;
  const portfolio = userId ? getPortfolioForUser(userId) : null;

  if (!portfolio) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-black/[.12] py-16 text-center dark:border-white/[.18]">
        <p className="text-lg font-medium text-black dark:text-zinc-50">
          Nothing saved yet
        </p>
        <button
          type="button"
          className="flex h-11 items-center justify-center rounded-full bg-foreground px-6 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Upload your CV
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
      <h2 className="font-medium text-black dark:text-zinc-50">
        {portfolio.title}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Last saved {portfolio.lastSavedAt} · {portfolio.status}
      </p>
    </div>
  );
}
