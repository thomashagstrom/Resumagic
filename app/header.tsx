import { Suspense } from "react";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { HeaderNav } from "./header-nav";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-black/[.08] px-6 dark:border-white/[.145]">
      <Link href="/" className="font-semibold text-black dark:text-zinc-50">
        Resumagic
      </Link>
      <div className="flex items-center gap-6">
        <HeaderNav />
        <Suspense fallback={null}>
          <AuthState />
        </Suspense>
      </div>
    </header>
  );
}

async function AuthState() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href="/signin"
        className="flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Sign in
      </Link>
    );
  }

  return (
    <details className="relative">
      <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-black/[.06] text-sm font-medium text-black dark:bg-white/[.08] dark:text-zinc-50">
        {(session.user.name ?? session.user.email ?? "?").charAt(0).toUpperCase()}
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-black/[.08] bg-white p-2 shadow-lg dark:border-white/[.145] dark:bg-zinc-950">
        <p className="truncate px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400">
          {session.user.name ?? session.user.email}
        </p>
        <Link
          href="/dashboard"
          className="block rounded-lg px-2 py-1.5 text-sm text-black hover:bg-black/[.04] dark:text-zinc-50 dark:hover:bg-white/[.06]"
        >
          My CV &amp; portfolio
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-black hover:bg-black/[.04] dark:text-zinc-50 dark:hover:bg-white/[.06]"
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
