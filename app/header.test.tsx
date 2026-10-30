import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAuthUser = vi.fn();
vi.mock("@/lib/use-auth-user", () => ({ useAuthUser: () => useAuthUser() }));
vi.mock("@/lib/firebase", () => ({ getFirebase: () => ({ auth: {} }) }));

import { AuthState } from "./header";

beforeEach(() => useAuthUser.mockReset());

describe("the header shows sign in or sign out according to the Firebase user", () => {
  it("shows a Sign in link and no Sign out when signed out", () => {
    useAuthUser.mockReturnValue(null);
    const html = renderToStaticMarkup(<AuthState />);

    expect(html).toContain("Sign in");
    expect(html).toContain('href="/signin"');
    expect(html).not.toContain("Sign out");
  });

  it("shows Sign out and the user's name and no Sign in link when signed in", () => {
    useAuthUser.mockReturnValue({ uid: "u1", displayName: "Ada Lovelace", email: "ada@example.com" });
    const html = renderToStaticMarkup(<AuthState />);

    expect(html).toContain("Sign out");
    expect(html).toContain("Ada Lovelace");
    expect(html).not.toContain('href="/signin"');
  });

  it("shows neither Sign in nor Sign out while the session is still being restored", () => {
    useAuthUser.mockReturnValue(undefined);
    const html = renderToStaticMarkup(<AuthState />);

    expect(html).not.toContain("Sign in");
    expect(html).not.toContain("Sign out");
  });
});
