function collectTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    if (current.textContent) nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

function unwrapColorSpans(root: Node): void {
  const elements = root.nodeType === Node.DOCUMENT_FRAGMENT_NODE
    ? Array.from(root.childNodes)
    : [root];

  for (const node of elements) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    if (el.tagName === "SPAN" && el.style.color) {
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      continue;
    }
    Array.from(el.childNodes).forEach(unwrapColorSpans);
  }
}

function wrapTextNodesWithColor(root: Node, color: string): void {
  for (const textNode of collectTextNodes(root)) {
    const parent = textNode.parentElement;
    if (parent?.tagName === "SPAN" && parent.style.color === color && parent.childNodes.length === 1) {
      continue;
    }
    if (parent?.tagName === "SPAN" && parent.style.color && parent.childNodes.length === 1) {
      parent.style.color = color;
      continue;
    }
    const span = document.createElement("span");
    span.style.color = color;
    textNode.parentNode?.insertBefore(span, textNode);
    span.appendChild(textNode);
  }
}

export function normalizeColorSpans(root: HTMLElement): void {
  root.querySelectorAll("span").forEach((span) => {
    if (!span.style.color) return;
    if (!span.textContent?.replace(/\s+/g, "")) {
      span.replaceWith(...Array.from(span.childNodes));
    }
  });

  root.querySelectorAll("span[style*='color']").forEach((span) => {
    const el = span as HTMLElement;
    const next = el.nextElementSibling as HTMLElement | null;
    if (next?.tagName === "SPAN" && next.style.color === el.style.color) {
      while (next.firstChild) el.appendChild(next.firstChild);
      next.remove();
    }
  });
}

/** Apply inline color to the current selection inside a contentEditable root. */
export function applyColorToSelection(color: string, root: HTMLElement): boolean {
  root.focus();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  if (range.collapsed || !root.contains(range.commonAncestorContainer)) return false;

  const fragment = range.extractContents();

  if (!color) {
    unwrapColorSpans(fragment);
  } else {
    unwrapColorSpans(fragment);
    wrapTextNodesWithColor(fragment, color);
  }

  range.insertNode(fragment);
  normalizeColorSpans(root);
  selection.removeAllRanges();
  return true;
}

export function applyBoldToSelection(root: HTMLElement): void {
  root.focus();
  document.execCommand("bold", false);
}

export function applyUnderlineToSelection(root: HTMLElement): void {
  root.focus();
  document.execCommand("underline", false);
}

export function insertHtmlAtSelection(html: string, root: HTMLElement): void {
  root.focus();
  document.execCommand("insertHTML", false, html);
}
