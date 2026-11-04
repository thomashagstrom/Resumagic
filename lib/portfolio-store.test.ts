import { beforeEach, describe, expect, it, vi } from "vitest";

const docs = new Map<string, Record<string, unknown>>();

vi.mock("@/lib/firebase", () => ({ getFirebase: () => ({ db: {} }) }));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
  getDoc: async (path: string) => ({
    exists: () => docs.has(path),
    data: () => docs.get(path),
  }),
  deleteDoc: async (path: string) => {
    docs.delete(path);
  },
  setDoc: async (path: string, data: Record<string, unknown>) => {
    docs.set(path, data);
  },
}));

import {
  getPortfolioForUser,
  getPublishedPortfolio,
  publishPortfolio,
  savePortfolioForUser,
  unpublishPortfolio,
} from "./portfolio-store";

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

  it("keeps the photo and accent colour after a reload, unchanged", async () => {
    await savePortfolioForUser("user-a", {
      ...portfolio,
      photoDataUrl: "data:image/png;base64,abc",
      accentColor: "#1D4ED8",
    });

    const reloaded = await getPortfolioForUser("user-a");

    expect(reloaded?.photoDataUrl).toBe("data:image/png;base64,abc");
    expect(reloaded?.accentColor).toBe("#1D4ED8");
  });

  it("returns no portfolio for a user who has never saved one", async () => {
    expect(await getPortfolioForUser("user-new")).toBeNull();
  });

  it("does not return user A's portfolio when looking up user B", async () => {
    await savePortfolioForUser("user-a", portfolio);

    expect(await getPortfolioForUser("user-b")).toBeNull();
  });
});

describe("publishing a portfolio to a shareable link", () => {
  const cv = { name: "Jane Doe", headline: "Engineer", experience: ["A"], education: [], skills: [] };
  const withCv = { ...portfolio, cv };

  it("publishes 'Jane Doe' at 'jane-doe' and marks the portfolio published", async () => {
    const saved = await publishPortfolio("user-a", withCv);

    expect(saved.slug).toBe("jane-doe");
    expect(saved.status).toBe("published");
    expect(docs.get("published/jane-doe")).toMatchObject({ uid: "user-a", cv });
    expect(await getPublishedPortfolio("jane-doe")).toMatchObject({ cv });
  });

  it("gives a second 'Jane Doe' a unique suffix instead of overwriting the first", async () => {
    await publishPortfolio("user-a", withCv);
    const second = await publishPortfolio("user-b", withCv);

    expect(second.slug).toBe("jane-doe-2");
    expect(docs.get("published/jane-doe")).toMatchObject({ uid: "user-a" });
  });

  it("keeps the same link when republishing and shows the latest edits", async () => {
    const first = await publishPortfolio("user-a", withCv);
    await publishPortfolio("user-a", { ...first, cv: { ...cv, headline: "Lead" } });

    expect(docs.get("published/jane-doe")).toMatchObject({ cv: { headline: "Lead" } });
    expect(docs.has("published/jane-doe-2")).toBe(false);
  });

  it("does not show edits made after publishing until the person republishes", async () => {
    const first = await publishPortfolio("user-a", withCv);
    await savePortfolioForUser("user-a", { ...first, cv: { ...cv, headline: "Lead" } });

    expect((await getPublishedPortfolio("jane-doe"))?.cv.headline).toBe("Engineer");
  });

  it("unpublishing removes the public page and returns the portfolio to draft", async () => {
    const first = await publishPortfolio("user-a", withCv);
    const draft = await unpublishPortfolio("user-a", first);

    expect(await getPublishedPortfolio("jane-doe")).toBeNull();
    expect(draft.status).toBe("draft");
    expect(draft.slug).toBeUndefined();
  });

  it("never gives a link that would shadow the dashboard page", async () => {
    const saved = await publishPortfolio("user-a", { ...withCv, cv: { ...cv, name: "Dashboard" } });

    expect(saved.slug).toBe("dashboard-2");
  });

  it("does not expose the owner's uid on the public page", async () => {
    await publishPortfolio("user-a", withCv);

    expect(await getPublishedPortfolio("jane-doe")).not.toHaveProperty("uid");
  });
});
