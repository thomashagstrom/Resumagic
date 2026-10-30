"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SignIn from "@/components/SignIn";
import { useAuthUser } from "@/lib/use-auth-user";

export default function SignInPage() {
  const user = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Save your CV and portfolio
        </p>
        <SignIn />
      </div>
    </div>
  );
}
