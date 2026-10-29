'use client';

import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';

import { useAuthUser } from '@/lib/use-auth-user';

import SignIn from './SignIn';

/** Shows the sign-in form until someone is signed in, then renders `children`. */
export default function AuthGate({ children }: { children: (user: User) => ReactNode }) {
  const user = useAuthUser();

  if (user === undefined) return <p>Loading…</p>;
  if (user === null) return <SignIn />;
  return <>{children(user)}</>;
}
