import { beforeEach, describe, expect, it, vi } from "vitest";

const docs = new Map<string, Record<string, unknown>>();

vi.mock("@/lib/firebase", () => ({ getFirebase: () => ({ db: {} }) }));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
  getDoc: async (path: string) => ({
    exists: () => docs.has(path),
    data: () => docs.get(path),
  }),
  setDoc: async (path: string, data: Record<string, unknown>) => {
    docs.set(path, data);
  },
}));

import { getPortfolioForUser, savePortfolioForUser } from "./portfolio-store";

beforeEach(() => {
  docs.clear();
});

const portfolio = { title: "My portfolio", lastSavedAt: "2026-10-20", status: "draft" } as const;

describe("saved portfolio data is tied to the Firebase uid", () => {
  it("stores the portfolio at notes/{uid} with a uid field that firestore.rules checks", async () => {
    await savePortfolioForUser("user-a", portfolio);

    expect(docs.get("notes/user-a")).toEqual({ ...portfolio, uid: "user-a" });
  });

  it("returns the same portfolio that was saved for that user", async () => {
    await savePortfolioForUser("user-a", portfolio);

    expect(await getPortfolioForUser("user-a")).toEqual(portfolio);
  });

  it("keeps the extracted CV draft after a reload, unchanged", async () => {
    const cv = { name: "Ada", headline: "Engineer", experience: ["A"], education: ["B"], skills: ["C"] };
    await savePortfolioForUser("user-a", { ...portfolio, cv });

    expect((await getPortfolioForUser("user-a"))?.cv).toEqual(cv);
  });

  it("returns no portfolio for a user who has never saved one", async () => {
    expect(await getPortfolioForUser("user-new")).toBeNull();
  });

  it("does not return user A's portfolio when looking up user B", async () => {
    await savePortfolioForUser("user-a", portfolio);

    expect(await getPortfolioForUser("user-b")).toBeNull();
  });
});
