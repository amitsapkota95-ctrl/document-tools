"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as Diff from "diff";

interface DiffMinimapProps {
  left: string;
  right: string;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onJumpToLine: (lineIndex: number) => void;
}

type LineKind = "added" | "removed" | "unchanged";

interface MinimapLine {
  kind: LineKind;
  lineIndex: number;
}

export function DiffMinimap({
  left,
  right,
  scrollContainerRef,
  onJumpToLine,
}: DiffMinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => {
    const diff = Diff.diffLines(left, right);
    const result: MinimapLine[] = [];
    let lineIndex = 0;

    for (const part of diff) {
      const partLines = part.value.split("\n");
      if (partLines[partLines.length - 1] === "") partLines.pop();

      for (const _line of partLines) {
        result.push({
          kind: part.added ? "added" : part.removed ? "removed" : "unchanged",
          lineIndex,
        });
        lineIndex++;
      }
    }

    return result;
  }, [left, right]);

  const updateViewport = useCallback(() => {
    const container = scrollContainerRef.current;
    const viewport = viewportRef.current;
    const minimap = minimapRef.current;
    if (!container || !viewport || !minimap || lines.length === 0) return;

    const scrollRatio = container.scrollTop / Math.max(1, container.scrollHeight - container.clientHeight);
    const viewportRatio = container.clientHeight / Math.max(1, container.scrollHeight);
    const top = scrollRatio * (1 - viewportRatio) * 100;
    const height = Math.max(viewportRatio * 100, 4);

    viewport.style.top = `${top}%`;
    viewport.style.height = `${height}%`;
  }, [lines.length, scrollContainerRef]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateViewport);
    updateViewport();
    return () => container.removeEventListener("scroll", updateViewport);
  }, [scrollContainerRef, updateViewport]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const lineIndex = Math.floor(ratio * lines.length);
    onJumpToLine(Math.min(lineIndex, lines.length - 1));
  };

  const colorFor = (kind: LineKind) => {
    if (kind === "added") return "bg-forest-500";
    if (kind === "removed") return "bg-red-400";
    return "bg-forest-200/40";
  };

  return (
    <div className="relative hidden h-full min-h-0 w-[72px] shrink-0 self-stretch md:flex md:flex-col">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink/60">
        Overview
      </p>
      <div
        ref={minimapRef}
        className="relative min-h-0 flex-1 cursor-pointer overflow-hidden rounded-lg border border-cream-300 bg-cream"
        onClick={handleClick}
        role="navigation"
        aria-label="Diff minimap"
      >
        <div className="flex h-full flex-col">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`min-h-[2px] flex-1 ${colorFor(line.kind)}`}
              onClick={(e) => {
                e.stopPropagation();
                onJumpToLine(line.lineIndex);
              }}
            />
          ))}
        </div>
        <div
          ref={viewportRef}
          className="pointer-events-none absolute right-0 left-0 rounded-sm border border-forest/60 bg-forest/15"
        />
      </div>
    </div>
  );
}
