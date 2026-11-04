import { describe, expect, it } from "vitest";
import { ACCENT_COLORS, initialsFor, validatePhotoFile } from "./personalize";

describe("a photo over 5 MB or of the wrong type is rejected", () => {
  it("accepts a JPG photo up to 5 MB", () => {
    expect(validatePhotoFile({ name: "photo.jpg", size: 5 * 1024 * 1024, type: "image/jpeg" })).toBeNull();
  });

  it("accepts a PNG photo up to 5 MB", () => {
    expect(validatePhotoFile({ name: "photo.png", size: 1024, type: "image/png" })).toBeNull();
  });

  it("rejects a JPG photo larger than 5 MB", () => {
    expect(validatePhotoFile({ name: "photo.jpg", size: 5 * 1024 * 1024 + 1, type: "image/jpeg" })).toBe(
      "That photo is larger than 5 MB. Please choose a smaller JPG or PNG photo.",
    );
  });

  it("rejects a file that isn't a JPG or PNG", () => {
    expect(validatePhotoFile({ name: "photo.gif", size: 10, type: "image/gif" })).toBe(
      "That file type isn't supported. Please choose a JPG or PNG photo.",
    );
  });
});

describe("the curated accent colour set", () => {
  it("offers between 6 and 8 colours", () => {
    expect(ACCENT_COLORS.length).toBeGreaterThanOrEqual(6);
    expect(ACCENT_COLORS.length).toBeLessThanOrEqual(8);
  });
});

describe("the hero falls back to a monogram built from the user's initials", () => {
  it("builds initials from a first and last name", () => {
    expect(initialsFor("Ada Lovelace")).toBe("AL");
  });

  it("builds a single initial from a one-word name", () => {
    expect(initialsFor("Ada")).toBe("A");
  });

  it("falls back to a placeholder when there is no name", () => {
    expect(initialsFor("")).toBe("?");
  });
});
