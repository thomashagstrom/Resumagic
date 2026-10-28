import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoreForTests,
  getPortfolioForUser,
  savePortfolioForUser,
} from "./portfolio-store";

beforeEach(() => {
  clearStoreForTests();
});

describe("first sign-in lands on an empty dashboard", () => {
  it("returns no portfolio for a user who has never saved one", () => {
    expect(getPortfolioForUser("user-new")).toBeNull();
  });
});

describe("a returning user sees their existing portfolio", () => {
  it("returns the same portfolio that was saved for that user", () => {
    savePortfolioForUser("user-a", {
      title: "My portfolio",
      lastSavedAt: "2026-10-20",
      status: "draft",
    });

    expect(getPortfolioForUser("user-a")).toEqual({
      title: "My portfolio",
      lastSavedAt: "2026-10-20",
      status: "draft",
    });
  });
});

describe("no one else can see or edit another user's saved data", () => {
  it("does not return user A's portfolio when looking up user B", () => {
    savePortfolioForUser("user-a", {
      title: "User A's portfolio",
      lastSavedAt: "2026-10-20",
      status: "published",
    });

    expect(getPortfolioForUser("user-b")).toBeNull();
  });

  it("saving user B's portfolio does not change user A's", () => {
    savePortfolioForUser("user-a", {
      title: "User A's portfolio",
      lastSavedAt: "2026-10-20",
      status: "published",
    });
    savePortfolioForUser("user-b", {
      title: "User B's portfolio",
      lastSavedAt: "2026-10-21",
      status: "draft",
    });

    expect(getPortfolioForUser("user-a")?.title).toBe("User A's portfolio");
  });
});
