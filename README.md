This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Social sign-in

Job seekers sign in with Google or LinkedIn via [Auth.js](https://authjs.dev). Copy `.env.example` to `.env.local` and fill in:

- `AUTH_SECRET` — required in production, signs session tokens.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth app credentials.
- `AUTH_LINKEDIN_ID` / `AUTH_LINKEDIN_SECRET` — LinkedIn OAuth app credentials.

These are all read at request time (by the auth route handler and middleware), so updating them on a running deployment takes effect without a rebuild.

A signed-in user's CV/portfolio is currently kept in an in-memory, per-process store (`lib/portfolio-store.ts`), keyed by user id, so each user only ever sees their own data and it's gone after a restart. This is a placeholder until a real database is provisioned for the project.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Firebase

This app is wired to **Cloud Firestore** and **Firebase Authentication** and runs
against the local emulators until a real Firebase project is connected.

```bash
npm run emulators   # Auth on :9099, Firestore on :8081, dashboard on :4000
npm run dev         # in a second terminal
```

- `lib/firebase.ts` builds the Firebase clients. With no
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID` set it uses the emulators.
- `firestore.rules` is the security policy. It is closed by default: each signed-in
  person can read and write only their own `notes`. Open a new path on purpose, and
  review every change to this file.
- `apphosting.yaml` sets the limits for Firebase App Hosting, where this app is
  deployed once a Firebase project is connected.
