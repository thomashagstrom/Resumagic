import { describe, expect, it } from "vitest";
import {
  addListEntry,
  clampHeadline,
  HEADLINE_MAX,
  MAX_CV_BYTES,
  missingSections,
  parseCvText,
  removeListEntry,
  updateCvText,
  updateListEntry,
  updateSkillsText,
  validateCvFile,
  type CvDraft,
} from "./cv-extract";

const draft: CvDraft = {
  name: "Ada",
  headline: "Engineer",
  experience: ["Analytical Engines Ltd"],
  education: ["University of London"],
  skills: ["TypeScript", "React"],
};

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

describe("each extracted section can be edited inline", () => {
  it("updates the name without touching other sections", () => {
    expect(updateCvText(draft, "name", "Grace")).toEqual({ ...draft, name: "Grace" });
  });

  it("updates a single experience entry without touching the others", () => {
    const two = { ...draft, experience: ["A", "B"] };
    expect(updateListEntry(two, "experience", 1, "B updated")).toEqual({
      ...two,
      experience: ["A", "B updated"],
    });
  });

  it("updates skills from a comma-separated list", () => {
    expect(updateSkillsText(draft, "Go, Rust ,  SQL")).toEqual({
      ...draft,
      skills: ["Go", "Rust", "SQL"],
    });
  });
});

describe("the user can add or delete an experience or education entry", () => {
  it("adds a blank experience entry", () => {
    expect(addListEntry(draft, "experience").experience).toEqual(["Analytical Engines Ltd", ""]);
  });

  it("adds a blank education entry", () => {
    expect(addListEntry(draft, "education").education).toEqual(["University of London", ""]);
  });

  it("deletes the chosen experience entry and keeps the rest", () => {
    const two = { ...draft, experience: ["A", "B"] };
    expect(removeListEntry(two, "experience", 0).experience).toEqual(["B"]);
  });

  it("deletes the chosen education entry and keeps the rest", () => {
    const two = { ...draft, education: ["A", "B"] };
    expect(removeListEntry(two, "education", 1).education).toEqual(["A"]);
  });
});

describe("the headline is limited to about 60 characters", () => {
  it("keeps a short headline unchanged", () => {
    expect(clampHeadline("Software engineer")).toBe("Software engineer");
  });

  it("cuts a headline longer than 60 characters down to the limit", () => {
    const long = "A".repeat(80);
    expect(clampHeadline(long)).toHaveLength(HEADLINE_MAX);
  });

  it("clamps the headline when editing through updateCvText", () => {
    const long = "B".repeat(90);
    expect(updateCvText(draft, "headline", long).headline).toHaveLength(HEADLINE_MAX);
  });
});
