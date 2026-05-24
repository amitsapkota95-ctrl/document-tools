"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TeleprompterSettings } from "@/lib/teleprompter/types";
import type { WordRange } from "@/lib/teleprompter/script-parser";
import { getTheme } from "@/lib/teleprompter/themes";
import { getFontFamily } from "@/lib/teleprompter/fonts";
import { getPreviewScale } from "@/lib/teleprompter/preview-scale";
import {
  applyPreviewCueAlignmentToElement,
  applyPreviewScroll,
  applyPreviewWordCueAlignment,
  getInitialPreviewCueAlignmentOffset,
} from "@/lib/teleprompter/scroll-engine";
import { CueIndicator } from "./CueIndicator";
import { ScriptRenderer } from "./ScriptRenderer";

interface PrompterViewportProps {
  script: string;
  settings: TeleprompterSettings;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  activeWordIndex?: number;
  mode?: "live" | "preview";
  className?: string;
  previewScrollOffsetRef?: React.MutableRefObject<number>;
  followLineIndex?: number | null;
  highlightWordRange?: WordRange | null;
}

export function PrompterViewport({
  script,
  settings,
  viewportRef,
  contentRef,
  activeWordIndex = 0,
  mode = "live",
  className = "",
  previewScrollOffsetRef,
  followLineIndex = null,
  highlightWordRange = null,
}: PrompterViewportProps) {
  const theme = getTheme(settings.theme);
  const isPreview = mode === "preview";
  const [previewScale, setPreviewScale] = useState(1);
  const [previewViewportHeight, setPreviewViewportHeight] = useState(0);
  const prevFollowLineRef = useRef<number | null>(null);
  const prevHighlightKeyRef = useRef("");

  function highlightKey(range: WordRange | null | undefined): string {
    if (!range) return "n";
    return `${range.start}:${range.end}`;
  }

  function findPreviewScrollTarget(
    content: HTMLDivElement,
    lineIndex: number,
    wordRange: WordRange | null | undefined,
  ): HTMLElement | null {
    if (wordRange != null) {
      const selected = content.querySelector(
        `[data-word-index="${wordRange.start}"]`,
      ) as HTMLElement | null;
      if (selected) return selected;
    }

    const lineEl = content.querySelector(
      `[data-line-index="${lineIndex}"]`,
    ) as HTMLElement | null;
    if (!lineEl) return null;

    const firstWord = lineEl.querySelector("[data-word-index]") as HTMLElement | null;
    return firstWord ?? lineEl;
  }

  const scale = isPreview ? previewScale : 1;
  const scaledFontSize = settings.fontSize * scale;
  const scaledHorizontalPadding = settings.horizontalPadding * scale;
  const scaledVerticalPadding = isPreview ? previewViewportHeight * 0.4 : undefined;

  const textContainerStyle: React.CSSProperties = {
    fontSize: `${scaledFontSize}px`,
    maxWidth: `${settings.textWidth}%`,
    margin: "0 auto",
    lineHeight: settings.lineHeight,
    fontFamily: getFontFamily(settings.fontFamily),
    color: theme.text,
    willChange: isPreview ? undefined : "transform",
    ...(scaledVerticalPadding != null
      ? {
          paddingTop: scaledVerticalPadding,
          paddingBottom: scaledVerticalPadding,
        }
      : {}),
  };

  useEffect(() => {
    if (!isPreview) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const update = () => {
      setPreviewScale(getPreviewScale(viewport));
      setPreviewViewportHeight(viewport.clientHeight);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isPreview, viewportRef]);

  const scrollPreviewToContext = useCallback(
    (
      viewport: HTMLDivElement,
      content: HTMLDivElement,
      lineIndex: number,
      wordRange: WordRange | null | undefined,
    ) => {
      const targetEl = findPreviewScrollTarget(content, lineIndex, wordRange);
      if (!targetEl) return false;

      content.style.transform = "";
      const currentScroll = previewScrollOffsetRef?.current ?? viewport.scrollTop;
      const offset = targetEl.hasAttribute("data-word-index")
        ? applyPreviewWordCueAlignment(
            viewport,
            targetEl,
            settings.cuePosition,
            currentScroll,
          )
        : applyPreviewCueAlignmentToElement(
            viewport,
            content,
            targetEl,
            settings.cuePosition,
            currentScroll,
          );
      if (previewScrollOffsetRef) {
        previewScrollOffsetRef.current = offset;
      }
      return true;
    },
    [settings.cuePosition, previewScrollOffsetRef],
  );

  const alignPreviewToCue = useCallback(
    (viewport: HTMLDivElement, content: HTMLDivElement) => {
      content.style.transform = "";
      const offset = getInitialPreviewCueAlignmentOffset(
        viewport,
        content,
        settings.cuePosition,
      );
      const applied = applyPreviewScroll(viewport, offset);
      if (previewScrollOffsetRef) {
        previewScrollOffsetRef.current = applied;
      }
    },
    [settings.cuePosition, previewScrollOffsetRef],
  );

  const typographyKey = [
    settings.fontSize,
    settings.textWidth,
    settings.lineHeight,
    settings.horizontalPadding,
    settings.cuePosition,
    previewScale,
    previewViewportHeight,
  ].join("|");

  const prevScriptRef = useRef(script);
  const prevTypographyKeyRef = useRef(typographyKey);

  useLayoutEffect(() => {
    if (!isPreview) return;
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const scriptChanged = prevScriptRef.current !== script;
    prevScriptRef.current = script;

    const typographyChanged = prevTypographyKeyRef.current !== typographyKey;
    prevTypographyKeyRef.current = typographyKey;

    const lineChanged = followLineIndex !== prevFollowLineRef.current;
    const highlightChanged =
      highlightKey(highlightWordRange) !== prevHighlightKeyRef.current;
    prevHighlightKeyRef.current = highlightKey(highlightWordRange);

    if (followLineIndex == null) {
      prevFollowLineRef.current = null;
      if (viewport.scrollTop <= 1) {
        alignPreviewToCue(viewport, content);
      }
      return;
    }

    if (lineChanged) {
      scrollPreviewToContext(viewport, content, followLineIndex, highlightWordRange);
      prevFollowLineRef.current = followLineIndex;
      return;
    }

    if (highlightChanged) {
      scrollPreviewToContext(viewport, content, followLineIndex, highlightWordRange);
      return;
    }

    if (typographyChanged) {
      scrollPreviewToContext(viewport, content, followLineIndex, highlightWordRange);
      return;
    }

    if (scriptChanged && followLineIndex != null && followLineIndex >= 0) {
      scrollPreviewToContext(viewport, content, followLineIndex, highlightWordRange);
      return;
    }
  }, [
    isPreview,
    script,
    typographyKey,
    followLineIndex,
    highlightWordRange,
    alignPreviewToCue,
    scrollPreviewToContext,
    viewportRef,
    contentRef,
  ]);

  const handlePreviewScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !previewScrollOffsetRef) return;
    previewScrollOffsetRef.current = viewport.scrollTop;
  }, [viewportRef, previewScrollOffsetRef]);

  return (
    <div
      ref={viewportRef}
      onScroll={isPreview ? handlePreviewScroll : undefined}
      className={`relative min-h-0 flex-1 text-center ${
        isPreview ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"
      } ${className}`}
      style={{
        paddingLeft: scaledHorizontalPadding,
        paddingRight: scaledHorizontalPadding,
        ...(isPreview ? { backgroundColor: theme.background, color: theme.text } : {}),
      }}
    >
      <CueIndicator
        positionPercent={settings.cuePosition}
        style={settings.cueStyle}
        theme={theme}
      />
      <div
        ref={contentRef}
        style={textContainerStyle}
        className={`${isPreview ? "select-none" : "pb-[40vh] pt-[40vh]"}`}
      >
        <ScriptRenderer
          script={script}
          activeWordIndex={activeWordIndex}
          textColor={theme.text}
          highlightWordRange={isPreview ? highlightWordRange : null}
          themeBackground={theme.background}
        />
      </div>
    </div>
  );
}
