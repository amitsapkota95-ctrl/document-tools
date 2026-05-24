export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadBytes(bytes: Uint8Array, filename: string, mimeType: string) {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy], { type: mimeType });
  downloadBlob(blob, filename);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s.-]/g, "").trim() || "download";
}
