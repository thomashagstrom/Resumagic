import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";

export type Portfolio = {
  title: string;
  lastSavedAt: string;
  status: "draft" | "published";
};

// One document per person at notes/{uid}, carrying a `uid` field so that
// firestore.rules lets only that person read and write it.
const COLLECTION = "notes";

export async function getPortfolioForUser(userId: string): Promise<Portfolio | null> {
  const snapshot = await getDoc(doc(getFirebase().db, COLLECTION, userId));
  if (!snapshot.exists()) return null;
  const { title, lastSavedAt, status } = snapshot.data() as Portfolio;
  return { title, lastSavedAt, status };
}

export async function savePortfolioForUser(userId: string, portfolio: Portfolio): Promise<void> {
  await setDoc(doc(getFirebase().db, COLLECTION, userId), { ...portfolio, uid: userId });
}
