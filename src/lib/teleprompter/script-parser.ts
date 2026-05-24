import type { ScriptMarker } from "./types";
import { stripHtml } from "./wpm";

const ALLOWED_TAGS = new Set(["B", "STRONG", "U", "SPAN", "P", "DIV", "BR", "FONT"]);

const MARKER_PATTERN = /^===\s*(.+?)\s*===$/;

function normalizeHeadingElements(root: ParentNode): void {
  root.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((heading) => {
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    while (heading.firstChild) {
      strong.appendChild(heading.firstChild);
    }
    if (!strong.textContent?.trim()) {
      strong.textContent = heading.textContent ?? "";
    }
    p.appendChild(strong);
    heading.replaceWith(p);
  });
}

function normalizeFontElements(root: ParentNode): void {
  root.querySelectorAll("font").forEach((node) => {
    const font = node as HTMLElement;
    const span = document.createElement("span");
    const color = font.getAttribute("color");
    if (color) span.style.color = color;
    while (font.firstChild) span.appendChild(font.firstChild);
    font.replaceWith(span);
  });
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof document === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  normalizeHeadingElements(doc.body);
  normalizeFontElements(doc.body);

  const walk = (node: Node): void => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (el.hasAttribute("data-marker")) {
          el.setAttribute("contenteditable", "false");
          el.classList.add("teleprompter-marker");
          continue;
        }
        if (el.tagName === "FONT") {
          normalizeFontElements(el.parentNode ?? doc.body);
          continue;
        }
        if (!ALLOWED_TAGS.has(el.tagName)) {
          const fragment = document.createDocumentFragment();
          while (el.firstChild) fragment.appendChild(el.firstChild);
          el.replaceWith(fragment);
          continue;
        }
        const allowedStyle = el.tagName === "SPAN" ? el.style.color : "";
        Array.from(el.attributes).forEach((attr) => el.removeAttribute(attr.name));
        if (allowedStyle) el.style.color = allowedStyle;
        walk(el);
      }
    }
  };
  walk(doc.body);
  normalizeFontElements(doc.body);
  return doc.body.innerHTML;
}

export function plainTextToHtml(text: string): string {
  return text
    .split(/\n/)
    .map((line) => {
      const markerMatch = line.match(MARKER_PATTERN);
      if (markerMatch) {
        const label = markerMatch[1];
        return `<p><span data-marker="${escapeAttr(label)}" contenteditable="false" class="teleprompter-marker">▶ ${escapeHtml(label)}</span></p>`;
      }
      if (!line.trim()) return "<p><br></p>";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, "&quot;");
}

export function convertMarkerLines(html: string): string {
  if (!html || typeof document === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("p, div").forEach((block) => {
    const text = (block.textContent ?? "").trim();
    const match = text.match(MARKER_PATTERN);
    if (match && block.childNodes.length <= 1) {
      const label = match[1];
      block.innerHTML = `<span data-marker="${escapeAttr(label)}" contenteditable="false" class="teleprompter-marker">▶ ${escapeHtml(label)}</span>`;
    }
  });
  return doc.body.innerHTML;
}

export function extractMarkers(html: string): ScriptMarker[] {
  if (typeof document === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const markers: ScriptMarker[] = [];
  let wordIndex = 0;

  const walkAll = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      wordIndex += (node.textContent ?? "").split(/\s+/).filter(Boolean).length;
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.hasAttribute("data-marker")) {
        markers.push({
          id: `marker-${markers.length}`,
          label: el.getAttribute("data-marker") ?? el.textContent ?? "Marker",
          wordIndex,
        });
        return;
      }
      el.childNodes.forEach(walkAll);
    }
  };

  doc.body.childNodes.forEach(walkAll);
  return markers;
}

export function extractWords(html: string): string[] {
  const plain = stripHtml(html).toLowerCase();
  return plain.split(/\s+/).filter(Boolean);
}

export function fuzzyMatchWord(spoken: string, expected: string): boolean {
  if (!spoken || !expected) return false;
  const s = spoken.toLowerCase().replace(/[^a-z0-9']/g, "");
  const e = expected.toLowerCase().replace(/[^a-z0-9']/g, "");
  if (!s || !e) return false;
  if (s === e) return true;
  if (e.startsWith(s) || s.startsWith(e)) return true;
  const minLen = Math.min(s.length, e.length, 4);
  if (minLen >= 3 && s.slice(0, minLen) === e.slice(0, minLen)) return true;
  return levenshtein(s, e) <= Math.max(1, Math.floor(e.length * 0.3));
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
    }
  }
  return matrix[b.length][a.length];
}

export function createMarkerHtml(label: string): string {
  return `<span data-marker="${escapeAttr(label)}" contenteditable="false" class="teleprompter-marker">▶ ${escapeHtml(label)}</span>`;
}

export function isScriptEmpty(html: string): boolean {
  return stripHtml(html).trim().length === 0;
}

export function getScriptPlainPreview(html: string, maxLen = 80): string {
  const plain = stripHtml(html).trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen)}…`;
}

/** Index of the top-level block containing the caret inside a contentEditable editor. */
export function getCaretBlockIndex(editor: HTMLElement): number | null {
  if (typeof window === "undefined") return null;

  const sel = window.getSelection();
  if (!sel?.anchorNode) return null;

  let node: Node | null = sel.anchorNode;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editor) {
    if (node.parentElement === editor) {
      const blocks = Array.from(editor.children);
      const idx = blocks.indexOf(node as Element);
      return idx >= 0 ? idx : null;
    }
    node = node.parentElement;
  }

  return null;
}

export interface WordRange {
  start: number;
  end: number;
}

interface EditorWord {
  index: number;
  node: Text;
  startOffset: number;
  endOffset: number;
}

function collectEditorWords(editor: HTMLElement): EditorWord[] {
  const words: EditorWord[] = [];
  let index = 0;

  const walkNodes = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      let pos = 0;
      for (const part of text.split(/(\s+)/)) {
        if (!part || /^\s+$/.test(part)) {
          pos += part.length;
          continue;
        }
        words.push({
          index: index++,
          node: node as Text,
          startOffset: pos,
          endOffset: pos + part.length,
        });
        pos += part.length;
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.hasAttribute("data-marker")) return;
      el.childNodes.forEach(walkNodes);
    }
  };

  for (const block of Array.from(editor.children)) {
    if (block.nodeType !== Node.ELEMENT_NODE) continue;
    const el = block as HTMLElement;
    if (el.hasAttribute("data-marker")) continue;
    walkNodes(block);
  }

  return words;
}

function rangeIntersectsWord(range: Range, word: EditorWord): boolean {
  const wordRange = document.createRange();
  try {
    wordRange.setStart(word.node, word.startOffset);
    wordRange.setEnd(word.node, word.endOffset);
  } catch {
    return false;
  }
  return (
    range.compareBoundaryPoints(Range.END_TO_START, wordRange) > 0 &&
    range.compareBoundaryPoints(Range.START_TO_END, wordRange) < 0
  );
}

/** Word indices covered by the current editor selection (inclusive). */
export function getSelectionWordRange(editor: HTMLElement): WordRange | null {
  if (typeof window === "undefined") return null;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (range.collapsed || !editor.contains(range.commonAncestorContainer)) return null;

  const words = collectEditorWords(editor);
  if (words.length === 0) return null;

  let start: number | null = null;
  let end: number | null = null;

  for (const word of words) {
    if (!rangeIntersectsWord(range, word)) continue;
    if (start === null) start = word.index;
    end = word.index;
  }

  if (start !== null && end !== null) {
    return { start, end };
  }

  return null;
}

export interface EditorSelectionContext {
  lineIndex: number | null;
  wordRange: WordRange | null;
}
