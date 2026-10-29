import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAuthUser = vi.fn();
vi.mock("@/lib/use-auth-user", () => ({ useAuthUser: () => useAuthUser() }));
vi.mock("@/lib/firebase", () => ({ getFirebase: () => ({ auth: {} }) }));

import { clearStoreForTests, savePortfolioForUser } from "@/lib/portfolio-store";
import DashboardPage from "./page";

beforeEach(() => {
  useAuthUser.mockReset();
  clearStoreForTests();
});

describe("signed-out visitors to the dashboard are asked to sign in", () => {
  it("shows the sign-in form and no saved data when signed out", () => {
    useAuthUser.mockReturnValue(null);
    savePortfolioForUser("u1", { title: "Secret CV", lastSavedAt: "2026-10-20", status: "draft" });
    const html = renderToStaticMarkup(<DashboardPage />);

    expect(html).toContain("Continue with Google");
    expect(html).not.toContain("Secret CV");
    expect(html).not.toContain("Nothing saved yet");
  });
});

describe("signed-in visitors reach the dashboard", () => {
  it("shows the signed-in user's own portfolio, found by uid, and no sign-in form", () => {
    useAuthUser.mockReturnValue({ uid: "u1" });
    savePortfolioForUser("u1", { title: "My CV", lastSavedAt: "2026-10-20", status: "draft" });
    const html = renderToStaticMarkup(<DashboardPage />);

    expect(html).toContain("My CV");
    expect(html).not.toContain("Continue with Google");
  });

  it("does not show another user's portfolio", () => {
    useAuthUser.mockReturnValue({ uid: "u2" });
    savePortfolioForUser("u1", { title: "Secret CV", lastSavedAt: "2026-10-20", status: "draft" });
    const html = renderToStaticMarkup(<DashboardPage />);

    expect(html).not.toContain("Secret CV");
    expect(html).toContain("Nothing saved yet");
  });
});
