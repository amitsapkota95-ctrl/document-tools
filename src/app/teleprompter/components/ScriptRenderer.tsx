"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { WordRange } from "@/lib/teleprompter/script-parser";
import { sanitizeHtml } from "@/lib/teleprompter/script-parser";
import { getSelectionHighlightStyle } from "@/lib/teleprompter/themes";

interface ScriptRendererProps {
  script: string;
  activeWordIndex?: number;
  textColor?: string;
  highlightWordRange?: WordRange | null;
  themeBackground?: string;
}

function renderNode(
  node: Node,
  keyPrefix: string,
  activeWordIndex: number,
  highlightWordRange: WordRange | null | undefined,
  selectionHighlightStyle: CSSProperties | undefined,
  wordCounter: { value: number },
): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (!part) return null;
      if (/^\s+$/.test(part)) {
        return <span key={`${keyPrefix}-sp-${i}`}>{part}</span>;
      }
      const idx = wordCounter.value++;
      const isActiveWord = idx === activeWordIndex - 1;
      const inHighlight =
        highlightWordRange != null &&
        idx >= highlightWordRange.start &&
        idx <= highlightWordRange.end;

      const wordStyle: CSSProperties | undefined = inHighlight
        ? selectionHighlightStyle
        : undefined;

      return (
        <span
          key={`${keyPrefix}-w-${i}`}
          data-word-index={idx}
          className={isActiveWord ? "underline decoration-2 underline-offset-4 opacity-100" : undefined}
          style={wordStyle}
        >
          {part}
        </span>
      );
    });
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (el.hasAttribute("data-marker")) {
      return (
        <span
          key={keyPrefix}
          data-marker={el.getAttribute("data-marker") ?? ""}
          className="teleprompter-marker inline-block rounded px-2 py-0.5 font-bold opacity-90"
          dangerouslySetInnerHTML={{ __html: el.innerHTML }}
        />
      );
    }

    const children = Array.from(el.childNodes).map((child, ci) =>
      renderNode(
        child,
        `${keyPrefix}-${ci}`,
        activeWordIndex,
        highlightWordRange,
        selectionHighlightStyle,
        wordCounter,
      ),
    );

    if (tag === "b" || tag === "strong") {
      return <strong key={keyPrefix}>{children}</strong>;
    }
    if (tag === "u") {
      return <u key={keyPrefix}>{children}</u>;
    }
    if (tag === "span") {
      const color = el.style.color;
      return (
        <span key={keyPrefix} style={color ? { color } : undefined}>
          {children}
        </span>
      );
    }
    if (tag === "br") {
      return <br key={keyPrefix} />;
    }
    return <span key={keyPrefix}>{children}</span>;
  }

  return null;
}

export function ScriptRenderer({
  script,
  activeWordIndex = 0,
  textColor,
  highlightWordRange = null,
  themeBackground = "#000000",
}: ScriptRendererProps) {
  const selectionHighlightStyle = useMemo(
    () => getSelectionHighlightStyle(themeBackground),
    [themeBackground],
  );
  const blocks = useMemo(() => {
    const clean = sanitizeHtml(script || "<p><br></p>");
    if (typeof document === "undefined") {
      return [{ isMarker: false, lineIndex: 0, nodes: [] as Node[] }];
    }

    const doc = new DOMParser().parseFromString(clean, "text/html");
    const result: { isMarker: boolean; lineIndex: number; nodes: Node[] }[] = [];
    let lineIndex = 0;

    doc.body.childNodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;
      const isMarker = el.hasAttribute("data-marker");
      result.push({
        isMarker,
        lineIndex: lineIndex++,
        nodes: Array.from(el.childNodes),
      });
    });

    if (result.length === 0) {
      result.push({ isMarker: false, lineIndex: 0, nodes: [] });
    }

    return result;
  }, [script]);

  const wordCounter = { value: 0 };

  return (
    <>
      {blocks.map((block) => {
        const counter = block.isMarker ? { value: 0 } : wordCounter;
        const content = block.nodes.map((node, ni) =>
          renderNode(
            node,
            `l${block.lineIndex}-n${ni}`,
            activeWordIndex,
            highlightWordRange,
            selectionHighlightStyle,
            counter,
          ),
        );

        const lineStyle: React.CSSProperties = textColor ? { color: textColor } : {};

        if (block.isMarker) {
          return (
            <p
              key={`marker-${block.lineIndex}`}
              data-line-index={block.lineIndex}
              data-marker-block
              className="mb-10 font-bold opacity-80"
              style={lineStyle}
            >
              {content}
            </p>
          );
        }

        return (
          <p
            key={`line-${block.lineIndex}`}
            data-line-index={block.lineIndex}
            className="mb-10 font-semibold"
            style={lineStyle}
          >
            {content.length > 0 ? content : "\u00A0"}
          </p>
        );
      })}
    </>
  );
}
