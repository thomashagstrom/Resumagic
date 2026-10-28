import { describe, expect, it } from "vitest";
import { shouldRedirectToSignIn } from "./route-guard";

describe("signing out blocks access to saved dashboard data", () => {
  it("redirects an unauthenticated visitor away from the dashboard", () => {
    expect(shouldRedirectToSignIn("/dashboard", false)).toBe(true);
  });

  it("does not redirect a signed-in user away from the dashboard", () => {
    expect(shouldRedirectToSignIn("/dashboard", true)).toBe(false);
  });

  it("leaves public routes untouched for signed-out visitors", () => {
    expect(shouldRedirectToSignIn("/", false)).toBe(false);
    expect(shouldRedirectToSignIn("/signin", false)).toBe(false);
  });
});
