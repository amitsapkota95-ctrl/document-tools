import type { FontFamilyId } from "./types";

export interface FontOption {
  id: FontFamilyId;
  label: string;
  cssVar: string;
  fallback: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "geist", label: "Geist Sans", cssVar: "var(--font-geist-sans)", fallback: "system-ui, sans-serif" },
  { id: "inter", label: "Inter", cssVar: "var(--font-inter)", fallback: "system-ui, sans-serif" },
  { id: "open-sans", label: "Open Sans", cssVar: "var(--font-open-sans)", fallback: "system-ui, sans-serif" },
  { id: "system", label: "System", cssVar: "system-ui", fallback: "system-ui, sans-serif" },
];

export function getFontFamily(id: FontFamilyId): string {
  const opt = FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
  return `${opt.cssVar}, ${opt.fallback}`;
}
