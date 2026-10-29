import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeaderNav, navLinks } from "./header-nav";

describe("desktop-sized screen still shows the header's navigation links", () => {
  it("renders every nav link with a class that shows it from the sm breakpoint up", () => {
    const html = renderToStaticMarkup(<HeaderNav />);

    expect(html).toContain("sm:flex");
    for (const link of navLinks) {
      expect(html).toContain(link.href);
    }
  });
});

describe("phone-sized screen has no menu icon in the header", () => {
  it("never renders a menu or hamburger control alongside the nav links", () => {
    const html = renderToStaticMarkup(<HeaderNav />);

    expect(html.toLowerCase()).not.toMatch(/menu|hamburger/);
  });

  it("hides the nav links by default so nothing clutters the small screen until sm breakpoint", () => {
    const html = renderToStaticMarkup(<HeaderNav />);

    expect(html).toMatch(/class="[^"]*\bhidden\b[^"]*\bsm:flex\b/);
  });
});
