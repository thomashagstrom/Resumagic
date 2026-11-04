import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "jane-doe" }) }));
vi.mock("@/lib/portfolio-store", () => ({ getPublishedPortfolio: vi.fn(async () => null) }));

import { PortfolioView, prefersReducedMotion } from "./page";

const cv = {
  name: "Jane Doe",
  headline: "Product engineer",
  experience: ["Staff Engineer, Acme", "Engineer, Beta"],
  education: ["BSc Computing"],
  skills: ["TypeScript"],
};

describe("the public portfolio page", () => {
  it("shows the monogram, light first name, heavy surname and headline", () => {
    const html = renderToStaticMarkup(<PortfolioView page={{ slug: "jane-doe", cv, accentColor: "#1D4ED8" }} />);

    expect(html).toContain("Monogram JD");
    expect(html).toContain('<span class="font-light">Jane</span>');
    expect(html).toContain('font-black"> Doe');
    expect(html).toContain("Product engineer");
    expect(html).toContain("#1D4ED8");
  });

  it("takes the Latest role panel from the first experience entry and lists the full CV", () => {
    const html = renderToStaticMarkup(<PortfolioView page={{ slug: "jane-doe", cv }} />);

    expect(html).toMatch(/Latest role<\/h2><p[^>]*>Staff Engineer, Acme/);
    expect(html).toContain("Engineer, Beta");
    expect(html).toContain("BSc Computing");
    expect(html).toContain("TypeScript");
  });

  it("shows the hero photo when there is one and none otherwise", () => {
    const withPhoto = renderToStaticMarkup(
      <PortfolioView page={{ slug: "jane-doe", cv, photoDataUrl: "data:image/png;base64,abc" }} />,
    );
    const without = renderToStaticMarkup(<PortfolioView page={{ slug: "jane-doe", cv }} />);

    expect(withPhoto).toContain("data:image/png;base64,abc");
    expect(without).not.toContain("<img");
  });

  it("omits the Latest role panel when there is no experience", () => {
    const html = renderToStaticMarkup(<PortfolioView page={{ slug: "jane-doe", cv: { ...cv, experience: [] } }} />);

    expect(html).not.toContain("Latest role");
  });

  it("renders name, tagline, photo and every CV section visible, with hooks for the entrance and reveal", () => {
    const html = renderToStaticMarkup(
      <PortfolioView
        page={{ slug: "jane-doe", cv, accentColor: "#1D4ED8", photoDataUrl: "data:image/png;base64,abc" }}
      />,
    );

    expect(html).not.toMatch(/opacity\s*:\s*0/);
    expect(html).not.toContain("data-motion");
    expect(html.match(/data-enter/g)).toHaveLength(3);
    expect(html.match(/data-reveal/g)).toHaveLength(4);
    expect(html).toContain("data-photo");
    expect(html).toMatch(/--glow:#1D4ED8/i);
    expect(html).toContain("Product engineer");
    expect(html).toContain("Staff Engineer, Acme");
    expect(html).toContain("BSc Computing");
    expect(html).toContain("TypeScript");
  });

  it("detects the visitor's reduced-motion setting so no animation is applied", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    expect(prefersReducedMotion()).toBe(true);
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    expect(prefersReducedMotion()).toBe(false);
    vi.unstubAllGlobals();
  });
});
