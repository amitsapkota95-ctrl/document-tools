"use client";

import { useMemo, useRef, useState } from "react";
import * as Diff from "diff";
import { FilePenLine, FileText } from "lucide-react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { DiffMinimap } from "@/components/tools/DiffMinimap";
import { ToolButton } from "@/components/tools/ToolButton";
import {
  CARD_CLASS,
  TOOL_SIDEBAR_CTA_CLASS,
  TOOL_SIDEBAR_SECTION_LABEL,
} from "@/lib/ui/classes";

function countLines(text: string): number {
  if (!text) return 0;
  return text.split("\n").length;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function computeDiffStats(leftParts: Diff.Change[], rightParts: Diff.Change[]) {
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const part of leftParts) {
    const words = countWords(part.value);
    if (part.removed) removed += words;
    else if (!part.added) unchanged += words;
  }
  for (const part of rightParts) {
    if (part.added) added += countWords(part.value);
  }

  const total = added + removed + unchanged;
  const similarity = total > 0 ? Math.round((unchanged / total) * 100) : 100;

  return { added, removed, similarity };
}

const EDITOR_TEXTAREA_CLASS =
  "mt-0 block w-full min-h-[28rem] flex-1 resize-none border-0 bg-cream p-4 font-mono text-sm leading-relaxed text-forest-700 placeholder:text-ink/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-forest-500/40";

interface TextEditorPanelProps {
  title: string;
  accent: "original" | "updated";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}

function TextEditorPanel({
  title,
  accent,
  value,
  onChange,
  placeholder,
  icon,
}: TextEditorPanelProps) {
  const lines = countLines(value);
  const words = countWords(value);
  const accentClass = accent === "original" ? "border-t-red-300/70" : "border-t-sage";

  return (
    <div className={`${CARD_CLASS} flex flex-col overflow-hidden border-t-2 shadow-paper ${accentClass}`}>
      <div className="flex items-center justify-between gap-3 border-b border-cream-300 bg-cream-200/60 px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-forest-700">{title}</span>
        </div>
        <span className="shrink-0 text-xs text-ink/50">
          {lines} lines · {words} words
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={EDITOR_TEXTAREA_CLASS}
      />
    </div>
  );
}

interface DiffPanelProps {
  title: string;
  badge: string;
  accent: "original" | "updated";
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  children: React.ReactNode;
}

function DiffPanel({ title, badge, accent, scrollRef, onScroll, children }: DiffPanelProps) {
  const accentClass = accent === "original" ? "border-t-red-300/70" : "border-t-sage";

  return (
    <div
      className={`${CARD_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden border-t-2 shadow-paper ${accentClass}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-cream-300 bg-cream-200/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-forest-700">{title}</span>
          <span className="rounded-full border border-cream-300 bg-cream/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/60">
            {badge}
          </span>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap"
      >
        {children}
      </div>
    </div>
  );
}

export default function CompareTextTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const leftParts = showDiff ? Diff.diffWordsWithSpace(left, right) : [];
  const rightParts = showDiff ? Diff.diffWordsWithSpace(right, left) : [];

  const diffStats = useMemo(
    () => (showDiff ? computeDiffStats(leftParts, rightParts) : null),
    [showDiff, leftParts, rightParts],
  );

  const syncScroll = (source: "left" | "right") => {
    if (!leftRef.current || !rightRef.current) return;
    if (source === "left") {
      rightRef.current.scrollTop = leftRef.current.scrollTop;
    } else {
      leftRef.current.scrollTop = rightRef.current.scrollTop;
    }
  };

  const jumpToLine = (lineIndex: number) => {
    const container = leftRef.current;
    if (!container) return;
    const lineHeight = container.scrollHeight / Math.max(1, left.split("\n").length);
    const scrollTop = lineIndex * lineHeight;
    container.scrollTop = scrollTop;
    if (rightRef.current) rightRef.current.scrollTop = scrollTop;
  };

  const textEditors = (
    <div className="grid w-full gap-4 lg:grid-cols-2">
      <TextEditorPanel
        title="Original"
        accent="original"
        value={left}
        onChange={setLeft}
        placeholder="Paste original text here…"
        icon={<FileText className="h-4 w-4 text-red-400/80" aria-hidden />}
      />
      <TextEditorPanel
        title="Updated"
        accent="updated"
        value={right}
        onChange={setRight}
        placeholder="Paste new text here…"
        icon={<FilePenLine className="h-4 w-4 text-forest-500" aria-hidden />}
      />
    </div>
  );

  const sidebarControls = (
    <div className="flex flex-col gap-5">
      <p className={TOOL_SIDEBAR_SECTION_LABEL}>Compare options</p>

      {!showDiff ? (
        <>
          <p className="text-xs leading-relaxed text-ink/50">
            Paste your original and updated text, then compare to see additions and removals
            highlighted side by side.
          </p>
          <div className={TOOL_SIDEBAR_CTA_CLASS}>
            <ToolButton
              onClick={() => setShowDiff(true)}
              disabled={!left && !right}
              className="w-full"
            >
              Compare Texts
            </ToolButton>
          </div>
        </>
      ) : (
        <>
          {diffStats && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink/60">Added</span>
                <span className="font-semibold text-emerald-800">{diffStats.added} words</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/60">Removed</span>
                <span className="font-semibold text-red-800">{diffStats.removed} words</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/60">Similarity</span>
                <span className="font-semibold text-forest-700">{diffStats.similarity}%</span>
              </div>
            </div>
          )}

          <div className="space-y-2.5 rounded-lg border border-cream-300 bg-cream/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Legend</p>
            <div className="flex items-center gap-2 text-xs text-forest-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-red-100 ring-1 ring-inset ring-red-200/70" />
              Removed text
            </div>
            <div className="flex items-center gap-2 text-xs text-forest-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-emerald-50 ring-1 ring-inset ring-forest-500/40" />
              Added text
            </div>
          </div>

          <ToolButton
            variant="secondary"
            onClick={() => setShowDiff(false)}
            className="w-full"
          >
            Edit texts
          </ToolButton>
        </>
      )}
    </div>
  );

  if (!showDiff) {
    return (
      <ToolWorkflowLayout
        hasFiles={!!(left.trim() || right.trim())}
        sidebarLabel="Compare options"
        wideUpload
        upload={textEditors}
        workspace={textEditors}
        sidebar={sidebarControls}
        workspaceClassName={left.trim() || right.trim() ? "flex min-h-0 flex-col" : undefined}
      />
    );
  }

  return (
    <ToolWorkflowLayout
      hasFiles
      sidebarLabel="Compare options"
      upload={null}
      workspace={
        <div className="flex min-h-0 flex-1 flex-col gap-4 animate-fade-in">
          {diffStats && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-cream-300 bg-cream/60 px-4 py-3">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                {diffStats.added} added
              </span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-900">
                {diffStats.removed} removed
              </span>
              <span className="rounded-full border border-cream-300 bg-cream-200/80 px-3 py-1 text-xs font-semibold text-forest-700">
                {diffStats.similarity}% similar
              </span>
            </div>
          )}

          <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[1fr_1fr_72px] md:items-stretch">
            <DiffPanel
              title="Original"
              badge="Before"
              accent="original"
              scrollRef={leftRef}
              onScroll={() => syncScroll("left")}
            >
              {leftParts.map((part, index) => {
                if (part.removed) {
                  return (
                    <span key={index} className="diff-removed">
                      {part.value}
                    </span>
                  );
                }
                if (part.added) return null;
                return <span key={index}>{part.value}</span>;
              })}
            </DiffPanel>

            <DiffPanel
              title="Updated"
              badge="After"
              accent="updated"
              scrollRef={rightRef}
              onScroll={() => syncScroll("right")}
            >
              {rightParts.map((part, index) => {
                if (part.added) {
                  return (
                    <span key={index} className="diff-added">
                      {part.value}
                    </span>
                  );
                }
                if (part.removed) return null;
                return <span key={index}>{part.value}</span>;
              })}
            </DiffPanel>

            <DiffMinimap
              left={left}
              right={right}
              scrollContainerRef={leftRef}
              onJumpToLine={jumpToLine}
            />
          </div>
        </div>
      }
      workspaceClassName="flex min-h-0 flex-col"
      sidebar={sidebarControls}
    />
  );
}
