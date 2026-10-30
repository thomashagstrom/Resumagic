import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAuthUser = vi.fn();
vi.mock("@/lib/use-auth-user", () => ({ useAuthUser: () => useAuthUser() }));
vi.mock("@/lib/firebase", () => ({ getFirebase: () => ({ auth: {} }) }));
vi.mock("@/lib/portfolio-store", () => ({ getPortfolioForUser: vi.fn(async () => null),
  savePortfolioForUser: vi.fn(async () => {}),
}));

import DashboardPage, { DashboardContent } from "./page";

beforeEach(() => {
  useAuthUser.mockReset();
});

describe("signed-out visitors to the dashboard are asked to sign in", () => {
  it("shows the sign-in form and no saved data when signed out", () => {
    useAuthUser.mockReturnValue(null);
    const html = renderToStaticMarkup(<DashboardPage />);

    expect(html).toContain("Continue with Google");
    expect(html).not.toContain("Nothing saved yet");
    expect(html).not.toContain("Loading");
  });
});

describe("signed-in visitors reach the dashboard", () => {
  it("shows the dashboard and no sign-in form when signed in", () => {
    useAuthUser.mockReturnValue({ uid: "u1" });
    const html = renderToStaticMarkup(<DashboardPage />);

    expect(html).toContain("My CV");
    expect(html).not.toContain("Continue with Google");
  });

  it("shows the saved portfolio when there is one", () => {
    const html = renderToStaticMarkup(
      <DashboardContent portfolio={{ title: "My CV", lastSavedAt: "2026-10-20", status: "draft" }} />,
    );

    expect(html).toContain("Last saved 2026-10-20");
    expect(html).not.toContain("Nothing saved yet");
  });

  it("offers a PDF or DOCX upload of up to 5 MB", () => {
    const html = renderToStaticMarkup(<DashboardContent portfolio={null} />);

    expect(html).toContain('type="file"');
    expect(html).toContain("PDF or DOCX, up to 5 MB");
  });

  it("shows a saved CV draft as separate sections and no missing-section notice", () => {
    const cv = { name: "Ada", headline: "Engineer", experience: ["A"], education: ["B"], skills: ["C"] };
    const html = renderToStaticMarkup(
      <DashboardContent portfolio={{ title: "My CV", lastSavedAt: "2026-10-20", status: "draft", cv }} />,
    );

    for (const label of ["Name", "Headline", "Experience", "Education", "Skills"]) expect(html).toContain(`>${label}</h3>`);
    expect(html).not.toContain("Please fill in");
  });

  it("tells the user which sections need filling in", () => {
    const cv = { name: "Ada", headline: "", experience: [], education: ["B"], skills: ["C"] };
    const html = renderToStaticMarkup(
      <DashboardContent portfolio={{ title: "My CV", lastSavedAt: "2026-10-20", status: "draft", cv }} />,
    );

    expect(html).toContain("Please fill in: Headline, Experience.");
  });

  it("shows the empty state when nothing is saved", () => {
    expect(renderToStaticMarkup(<DashboardContent portfolio={null} />)).toContain("Nothing saved yet");
  });
});
