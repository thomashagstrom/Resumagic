import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import type { CvDraft } from "@/lib/cv-extract";

export type Portfolio = {
  title: string;
  lastSavedAt: string;
  status: "draft" | "published";
  cv?: CvDraft;
  photoDataUrl?: string;
  accentColor?: string;
  slug?: string;
};

export type PublishedPortfolio = {
  slug: string;
  cv: CvDraft;
  photoDataUrl?: string;
  accentColor?: string;
};

// One document per person at notes/{uid}, carrying a `uid` field so that
// firestore.rules lets only that person read and write it.
const COLLECTION = "notes";
// Public copies at published/{slug}: anyone may read one by its slug, only the
// owner (the `uid` field) may write or remove it.
const PUBLISHED = "published";

// Top-level routes a public link must never shadow.
const RESERVED_SLUGS = ["dashboard", "signin", "api"];

export async function getPortfolioForUser(userId: string): Promise<Portfolio | null> {
  const snapshot = await getDoc(doc(getFirebase().db, COLLECTION, userId));
  if (!snapshot.exists()) return null;
  const { uid: _uid, ...portfolio } = snapshot.data() as Portfolio & { uid?: string };
  return portfolio as Portfolio;
}

export async function savePortfolioForUser(userId: string, portfolio: Portfolio): Promise<void> {
  await setDoc(doc(getFirebase().db, COLLECTION, userId), { ...portfolio, uid: userId });
}

export function slugFromName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "portfolio";
}

// Publishes (or republishes) the portfolio and returns the saved portfolio.
// The first publish picks a slug from the name, adding -2, -3, ... when taken;
// a republish keeps the slug the person already shared.
export async function publishPortfolio(userId: string, portfolio: Portfolio): Promise<Portfolio> {
  const { db } = getFirebase();
  const cv = portfolio.cv;
  if (!cv) throw new Error("Upload your CV before publishing.");

  let slug = portfolio.slug;
  if (!slug) {
    const base = slugFromName(cv.name);
    slug = RESERVED_SLUGS.includes(base) ? `${base}-2` : base;
    for (let n = 2; (await getDoc(doc(db, PUBLISHED, slug))).exists(); n++) {
      slug = `${base}-${n}`;
    }
  }

  const page: Record<string, unknown> = { uid: userId, slug, cv };
  if (portfolio.photoDataUrl) page.photoDataUrl = portfolio.photoDataUrl;
  if (portfolio.accentColor) page.accentColor = portfolio.accentColor;
  await setDoc(doc(db, PUBLISHED, slug), page);

  const next: Portfolio = { ...portfolio, status: "published", slug };
  await savePortfolioForUser(userId, next);
  return next;
}

// Takes the public page offline and returns the saved portfolio (a draft again).
export async function unpublishPortfolio(userId: string, portfolio: Portfolio): Promise<Portfolio> {
  if (portfolio.slug) await deleteDoc(doc(getFirebase().db, PUBLISHED, portfolio.slug));
  const { slug: _slug, ...rest } = portfolio;
  const next: Portfolio = { ...rest, status: "draft" };
  await savePortfolioForUser(userId, next);
  return next;
}

export async function getPublishedPortfolio(slug: string): Promise<PublishedPortfolio | null> {
  const snapshot = await getDoc(doc(getFirebase().db, PUBLISHED, slug));
  if (!snapshot.exists()) return null;
  const { uid: _uid, ...page } = snapshot.data() as PublishedPortfolio & { uid?: string };
  return page;
}
