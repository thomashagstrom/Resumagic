export type CvDraft = {
  name: string;
  headline: string;
  experience: string[];
  education: string[];
  skills: string[];
};

export type CvSection = keyof CvDraft;

export const CV_SECTIONS: { key: CvSection; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "headline", label: "Headline" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
];

export const MAX_CV_BYTES = 5 * 1024 * 1024;

const PDF_TYPE = "application/pdf";
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type FileInfo = { name: string; size: number; type: string };

function kindOf(file: FileInfo): "pdf" | "docx" | null {
  const name = file.name.toLowerCase();
  if (file.type === PDF_TYPE || name.endsWith(".pdf")) return "pdf";
  if (file.type === DOCX_TYPE || name.endsWith(".docx")) return "docx";
  return null;
}

// Returns a message for the user, or null when the file may be uploaded.
export function validateCvFile(file: FileInfo): string | null {
  if (!kindOf(file)) return "That file type isn't supported. Please choose a PDF or DOCX file.";
  if (file.size > MAX_CV_BYTES) return "That file is larger than 5 MB. Please choose a smaller PDF or DOCX file.";
  return null;
}

const HEADINGS: Record<string, "experience" | "education" | "skills"> = {
  experience: "experience",
  "work experience": "experience",
  "professional experience": "experience",
  employment: "experience",
  education: "education",
  skills: "skills",
  "key skills": "skills",
  "technical skills": "skills",
};

export function parseCvText(text: string): CvDraft {
  const draft: CvDraft = { name: "", headline: "", experience: [], education: [], skills: [] };
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let current: "experience" | "education" | "skills" | null = null;
  const intro: string[] = [];
  for (const line of lines) {
    const heading = HEADINGS[line.toLowerCase().replace(/[:\s]+$/, "")];
    if (heading) {
      current = heading;
    } else if (current) {
      draft[current].push(line);
    } else {
      intro.push(line);
    }
  }

  draft.name = intro[0] ?? "";
  draft.headline = intro[1] ?? "";
  draft.skills = draft.skills.flatMap((line) => line.split(/[,;•|]/)).map((s) => s.trim()).filter(Boolean);
  return draft;
}

export function missingSections(draft: CvDraft): CvSection[] {
  return CV_SECTIONS.filter(({ key }) => {
    const value = draft[key];
    return Array.isArray(value) ? value.length === 0 : value.trim() === "";
  }).map(({ key }) => key);
}

export async function extractCvText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  if (kindOf(file) === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
  return value;
}
