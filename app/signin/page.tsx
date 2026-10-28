import { Suspense } from "react";
import { signIn } from "@/lib/auth";

const providers = [
  { id: "google", label: "Continue with Google" },
  { id: "linkedin", label: "Continue with LinkedIn" },
] as const;

export default function SignInPage({ searchParams }: PageProps<"/signin">) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Save your CV and portfolio
        </p>

        <Suspense fallback={<ProviderButtonsFallback />}>
          <ProviderButtons searchParams={searchParams} />
        </Suspense>

        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
          No password needed.
        </p>
      </div>
    </div>
  );
}

function ProviderButtonsFallback() {
  return (
    <div className="mt-6 flex flex-col gap-3">
      {providers.map((provider) => (
        <div
          key={provider.id}
          className="h-11 w-full animate-pulse rounded-full bg-black/[.04] dark:bg-white/[.06]"
        />
      ))}
    </div>
  );
}

async function ProviderButtons({
  searchParams,
}: {
  searchParams: PageProps<"/signin">["searchParams"];
}) {
  const { callbackUrl } = await searchParams;
  const redirectTo = typeof callbackUrl === "string" ? callbackUrl : "/dashboard";

  return (
    <div className="mt-6 flex flex-col gap-3">
      {providers.map((provider) => (
        <form
          key={provider.id}
          action={async () => {
            "use server";
            await signIn(provider.id, { redirectTo });
          }}
        >
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center rounded-full border border-black/[.08] px-5 font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
          >
            {provider.label}
          </button>
        </form>
      ))}
    </div>
  );
}
