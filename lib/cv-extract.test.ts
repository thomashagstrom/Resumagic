import { describe, expect, it } from "vitest";
import { MAX_CV_BYTES, missingSections, parseCvText, validateCvFile } from "./cv-extract";

const pdf = { name: "cv.pdf", type: "application/pdf", size: 1000 };

describe("the user can upload a PDF or DOCX CV of up to 5 MB", () => {
  it("accepts a PDF", () => {
    expect(validateCvFile(pdf)).toBeNull();
  });

  it("accepts a DOCX at exactly 5 MB", () => {
    const docx = {
      name: "cv.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: MAX_CV_BYTES,
    };
    expect(validateCvFile(docx)).toBeNull();
  });

  it("rejects other file types with a clear message", () => {
    expect(validateCvFile({ name: "cv.txt", type: "text/plain", size: 10 })).toContain("PDF or DOCX");
  });

  it("rejects files larger than 5 MB with a clear message", () => {
    expect(validateCvFile({ ...pdf, size: MAX_CV_BYTES + 1 })).toContain("5 MB");
  });
});

describe("extracted name, headline, experience, education and skills are separate sections", () => {
  const text = [
    "Ada Lovelace",
    "Software engineer",
    "Experience",
    "Analytical Engines Ltd, 2020-2024",
    "Education",
    "University of London",
    "Skills",
    "TypeScript, React",
  ].join("\n");

  it("splits the text into the five sections", () => {
    expect(parseCvText(text)).toEqual({
      name: "Ada Lovelace",
      headline: "Software engineer",
      experience: ["Analytical Engines Ltd, 2020-2024"],
      education: ["University of London"],
      skills: ["TypeScript", "React"],
    });
  });
});

describe("empty sections are reported instead of an error dead-end", () => {
  it("lists every section when nothing could be extracted", () => {
    expect(missingSections(parseCvText(""))).toEqual(["name", "headline", "experience", "education", "skills"]);
  });

  it("lists only the empty sections and not the filled ones", () => {
    const missing = missingSections(parseCvText("Ada\nEngineer\nSkills\nTS"));
    expect(missing).toEqual(["experience", "education"]);
  });
});
