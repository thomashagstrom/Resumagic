import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAuthUser = vi.fn();
vi.mock("@/lib/use-auth-user", () => ({ useAuthUser: () => useAuthUser() }));
vi.mock("@/lib/firebase", () => ({ getFirebase: () => ({ auth: {} }) }));
const savePortfolioForUser = vi.fn(async (userId: string, portfolio: unknown) => {
  void userId;
  void portfolio;
});
vi.mock("@/lib/portfolio-store", () => ({
  getPortfolioForUser: vi.fn(async () => null),
  savePortfolioForUser: (userId: string, portfolio: unknown) => savePortfolioForUser(userId, portfolio),
  publishPortfolio: vi.fn(),
  unpublishPortfolio: vi.fn(),
}));

import DashboardPage, { CvSections, DashboardContent } from "./page";
import type { CvDraft } from "@/lib/cv-extract";

type ElementNode = { type: unknown; props: Record<string, unknown> };

function findAll(
  node: unknown,
  predicate: (node: ElementNode) => boolean,
  found: ElementNode[] = [],
): ElementNode[] {
  if (!node || typeof node !== "object") return found;
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, predicate, found));
    return found;
  }
  const element = node as ElementNode;
  if (predicate(element)) found.push(element);
  findAll(element.props?.children, predicate, found);
  return found;
}

beforeEach(() => {
  useAuthUser.mockReset();
  savePortfolioForUser.mockClear();
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

describe("publishing from the dashboard", () => {
  const cv = { name: "Jane Doe", headline: "Engineer", experience: ["A"], education: [], skills: [] };
  const base = { title: "My CV", lastSavedAt: "2026-10-20", cv } as const;

  it("shows a Publish button and no link before the portfolio is published", () => {
    const html = renderToStaticMarkup(<DashboardContent userId="u1" portfolio={{ ...base, status: "draft" }} />);

    expect(html).toContain(">Publish<");
    expect(html).not.toContain("Copy link");
    expect(html).not.toContain("Unpublish");
  });

  it("shows the link with Copy link, Republish and Unpublish once published", () => {
    const html = renderToStaticMarkup(
      <DashboardContent userId="u1" portfolio={{ ...base, status: "published", slug: "jane-doe" }} />,
    );

    expect(html).toContain("Copy link");
    expect(html).toContain("Republish");
    expect(html).toContain("Unpublish");
    expect(html).not.toContain(">Publish<");
  });

  it("offers no Publish button when there is no CV yet", () => {
    const html = renderToStaticMarkup(<DashboardContent userId="u1" portfolio={null} />);

    expect(html).not.toContain("Share your portfolio");
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

const cv = {
  name: "Ada",
  headline: "Engineer",
  experience: ["Analytical Engines Ltd"],
  education: ["University of London"],
  skills: ["TypeScript"],
};

describe("each extracted section can be edited inline", () => {
  it("renders an editable input carrying each section's current value", () => {
    const html = renderToStaticMarkup(<CvSections cv={cv} onChange={() => {}} />);

    expect(html).toContain('value="Ada"');
    expect(html).toContain('value="Engineer"');
    expect(html).toContain('value="Analytical Engines Ltd"');
    expect(html).toContain('value="University of London"');
    expect(html).toContain('value="TypeScript"');
  });

  it("limits the headline input to 60 characters", () => {
    const html = renderToStaticMarkup(<CvSections cv={cv} onChange={() => {}} />);

    expect(html).toMatch(/value="Engineer"[^>]*maxLength="60"|maxLength="60"[^>]*value="Engineer"/);
  });

  it("never shows a manual save button next to the editable sections", () => {
    const html = renderToStaticMarkup(<CvSections cv={cv} onChange={() => {}} />);

    expect(html.toLowerCase()).not.toContain(">save<");
  });
});

describe("the user can add or delete an experience or education entry", () => {
  it("offers an add-entry control for experience and for education", () => {
    const html = renderToStaticMarkup(<CvSections cv={cv} onChange={() => {}} />);

    expect(html).toContain("Add experience entry");
    expect(html).toContain("Add education entry");
  });

  it("deletes an education entry and keeps the rest when its delete control is used", () => {
    const twoEducation = { ...cv, education: ["University of London", "Open University"] };
    const onChange = vi.fn();
    const tree = CvSections({ cv: twoEducation, onChange });
    const deleteButtons = findAll(
      tree,
      (node) => node.type === "button" && node.props?.["aria-label"] === "Delete education entry",
    );

    (deleteButtons[0].props.onClick as () => void)();

    expect(onChange).toHaveBeenCalledWith({ ...cv, education: ["Open University"] });
  });
});

describe("the hero shows a photo or, when there is none, a monogram from the user's initials", () => {
  it("shows a monogram built from the CV name's initials when no photo is uploaded", () => {
    const html = renderToStaticMarkup(
      <DashboardContent portfolio={{ title: "My CV", lastSavedAt: "2026-10-20", status: "draft", cv }} />,
    );

    expect(html).toContain("Monogram A");
    expect(html).not.toContain("<img");
  });

  it("shows the uploaded photo instead of a monogram once one is saved", () => {
    const html = renderToStaticMarkup(
      <DashboardContent
        portfolio={{
          title: "My CV",
          lastSavedAt: "2026-10-20",
          status: "draft",
          cv,
          photoDataUrl: "data:image/png;base64,abc",
        }}
      />,
    );

    expect(html).toContain('src="data:image/png;base64,abc"');
    expect(html).not.toContain("Monogram");
  });
});

describe("picking an accent colour updates the preview immediately", () => {
  it("renders the accent swatches as a radio group with the current colour checked", () => {
    const html = renderToStaticMarkup(
      <DashboardContent portfolio={{ title: "My CV", lastSavedAt: "2026-10-20", status: "draft", cv, accentColor: "#1D4ED8" }} />,
    );

    expect(html).toContain('aria-label="Accent colour #1D4ED8" class="flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style="background-color:#1D4ED8;box-shadow:0 0 0 2px white, 0 0 0 4px #1D4ED8"');
  });

  it("uses the chosen accent colour for the monogram background", () => {
    const html = renderToStaticMarkup(
      <DashboardContent portfolio={{ title: "My CV", lastSavedAt: "2026-10-20", status: "draft", cv, accentColor: "#1D4ED8" }} />,
    );

    expect(html).toContain('aria-label="Monogram A" class="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold text-white" style="background-color:#1D4ED8"');
  });
});

describe("edits are saved to the draft and appear in the preview without a manual save step", () => {
  it("updates the preview and saves the draft as soon as a field changes", () => {
    const onPortfolioChange = vi.fn();
    const portfolio = { title: "My CV", lastSavedAt: "2026-10-20", status: "draft" as const, cv };
    const tree = DashboardContent({ portfolio, userId: "u1", onChange: onPortfolioChange });
    const [cvSectionsElement] = findAll(tree, (node) => node.type === CvSections);

    (cvSectionsElement.props.onChange as (cv: CvDraft) => void)({ ...cv, name: "Grace" });

    expect(onPortfolioChange).toHaveBeenCalledWith(expect.objectContaining({ cv: { ...cv, name: "Grace" } }));
    expect(savePortfolioForUser).toHaveBeenCalledWith("u1", expect.objectContaining({ cv: { ...cv, name: "Grace" } }));
  });
});
