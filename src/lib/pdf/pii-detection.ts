import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { pdfTextBoundsToDomBox, type BoundingBox } from "@/lib/pdf/coordinate-map";

export type { BoundingBox };

export type PiiType = "email" | "phone" | "ssn" | "creditCard";

export const PII_PATTERNS: Record<PiiType, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
};

export const PII_LABELS: Record<PiiType, string> = {
  email: "Auto-Find Emails",
  phone: "Auto-Find Phone Numbers",
  ssn: "Auto-Find SSN",
  creditCard: "Auto-Find Credit Cards",
};

interface ViewportLike {
  height: number;
}

function textItemToBox(
  item: TextItem,
  viewport: ViewportLike,
  renderScale: number,
  matchIndex: number,
  matchLength: number,
): BoundingBox | null {
  if (!item.str?.trim() || matchLength <= 0) return null;

  const [, , , , tx, ty] = item.transform;
  const textLength = Math.max(item.str.length, 1);
  const charWidth = item.width > 0 ? item.width / textLength : item.height * 0.55;

  const matchTx = tx + charWidth * matchIndex;
  const matchWidth = charWidth * matchLength;

  return pdfTextBoundsToDomBox(
    matchTx,
    ty,
    matchWidth,
    item.height,
    viewport.height,
    renderScale,
  );
}

function mergeBoxes(boxes: BoundingBox[]): BoundingBox[] {
  if (boxes.length === 0) return [];
  const sorted = [...boxes].sort((a, b) => a.y - b.y || a.x - b.x);
  const merged: BoundingBox[] = [];

  for (const box of sorted) {
    const last = merged[merged.length - 1];
    const overlapsHorizontally =
      last &&
      box.x < last.x + last.width &&
      box.x + box.width > last.x;
    const sameLine = last && Math.abs(last.y - box.y) < 4;

    if (last && sameLine && overlapsHorizontally) {
      const right = Math.max(last.x + last.width, box.x + box.width);
      const left = Math.min(last.x, box.x);
      last.x = left;
      last.width = right - left;
      last.height = Math.max(last.height, box.height);
    } else {
      merged.push({ ...box });
    }
  }

  return merged;
}

export function detectPiiBoxes(
  items: TextItem[],
  enabledTypes: Set<PiiType>,
  viewport: ViewportLike,
  renderScale: number,
): BoundingBox[] {
  const boxes: BoundingBox[] = [];

  for (const item of items) {
    if (!("str" in item)) continue;
    const text = item.str;
    if (!text.trim()) continue;

    for (const type of enabledTypes) {
      const pattern = PII_PATTERNS[type];
      pattern.lastIndex = 0;
      let match = pattern.exec(text);

      while (match) {
        const box = textItemToBox(item, viewport, renderScale, match.index, match[0].length);
        if (box) boxes.push(box);
        match = pattern.exec(text);
      }
    }
  }

  return mergeBoxes(boxes);
}
