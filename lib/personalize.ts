// Accent colours shown as swatches. Each is dark enough for white text/icons
// on top of it to clear WCAG AA (>=4.5:1) in both light and dark mode.
export const ACCENT_COLORS = [
  "#B91C1C", // red
  "#C2410C", // orange
  "#92400E", // amber
  "#15803D", // green
  "#0E7490", // cyan
  "#1D4ED8", // blue
  "#6D28D9", // violet
  "#BE185D", // pink
] as const;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type FileInfo = { name: string; size: number; type: string };

function isPhotoType(file: FileInfo): boolean {
  const name = file.name.toLowerCase();
  if (file.type === "image/jpeg" || file.type === "image/png") return true;
  return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
}

// Returns a message for the user, or null when the photo may be uploaded.
export function validatePhotoFile(file: FileInfo): string | null {
  if (!isPhotoType(file)) return "That file type isn't supported. Please choose a JPG or PNG photo.";
  if (file.size > MAX_PHOTO_BYTES) return "That photo is larger than 5 MB. Please choose a smaller JPG or PNG photo.";
  return null;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
