import type { ToolSlug } from "@/lib/tools/registry";

export const HERO_IMPORT_STORAGE_KEY = "paperless-hero-import";

export const HERO_PDF_TOOL_SLUGS: ToolSlug[] = [
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "fill-and-sign",
  "redact-pdf",
  "crop-pdf",
  "extract-text-from-pdf",
  "pdf-to-image",
];

export interface HeroImportPayload {
  fileName: string;
  mimeType: string;
  dataUrl: string;
  targetSlug: ToolSlug;
}

export function storeHeroImport(payload: Omit<HeroImportPayload, "targetSlug">, targetSlug: ToolSlug) {
  if (typeof window === "undefined") return;
  const data: HeroImportPayload = { ...payload, targetSlug };
  sessionStorage.setItem(HERO_IMPORT_STORAGE_KEY, JSON.stringify(data));
}

export function readHeroImport(expectedSlug: ToolSlug): HeroImportPayload | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(HERO_IMPORT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as HeroImportPayload;
    if (payload.targetSlug !== expectedSlug) return null;
    return payload;
  } catch {
    return null;
  }
}

export function clearHeroImport() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(HERO_IMPORT_STORAGE_KEY);
}

export async function heroImportPayloadToFile(payload: HeroImportPayload): Promise<File> {
  const response = await fetch(payload.dataUrl);
  const blob = await response.blob();
  return new File([blob], payload.fileName, { type: payload.mimeType || "application/pdf" });
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
