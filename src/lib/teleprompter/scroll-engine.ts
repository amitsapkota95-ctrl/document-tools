import type { MirrorMode } from "./types";

export interface ScrollEngineRefs {
  contentRef: React.RefObject<HTMLDivElement | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  scrollOffsetRef: React.MutableRefObject<number>;
  targetScrollRef: React.MutableRefObject<number>;
  isRunningRef: React.MutableRefObject<boolean>;
  speedRef: React.MutableRefObject<number>;
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  voiceTargetWordRef?: React.MutableRefObject<number>;
  voiceScrollActiveRef?: React.MutableRefObject<boolean>;
  cuePositionRef?: React.MutableRefObject<number>;
  mirrorModeRef: React.MutableRefObject<MirrorMode>;
  editPausedRef?: React.MutableRefObject<boolean>;
  rafRef: React.MutableRefObject<number>;
}

export function buildMirrorTransform(mode: MirrorMode): string {
  switch (mode) {
    case "horizontal":
      return "scaleX(-1) ";
    case "vertical":
      return "scaleY(-1) ";
    case "both":
      return "scale(-1, -1) ";
    default:
      return "";
  }
}

export function applyScrollTransform(
  contentEl: HTMLDivElement | null,
  offset: number,
  mirrorMode: MirrorMode,
): void {
  if (!contentEl) return;
  const mirror = buildMirrorTransform(mirrorMode);
  contentEl.style.transform = `${mirror}translate3d(0, -${offset}px, 0)`;
}

export function getMaxScroll(
  contentEl: HTMLDivElement | null,
  viewportEl: HTMLDivElement | null,
): number {
  if (!contentEl || !viewportEl) return 0;
  return Math.max(0, contentEl.offsetHeight - viewportEl.clientHeight);
}

export function clampScroll(offset: number, maxScroll: number): number {
  return Math.max(0, Math.min(offset, maxScroll));
}

const LERP_FACTOR = 0.15;
const VOICE_LERP_FACTOR = 0.045;

export function lerpScroll(current: number, target: number, factor = LERP_FACTOR): number {
  if (Math.abs(target - current) < 0.25) return target;
  return current + (target - current) * factor;
}

/** Scroll offset that places a word's vertical center on the cue line. */
export function computeScrollTargetForWordAtCue(
  viewport: HTMLDivElement,
  wordEl: HTMLElement,
  cuePositionPercent: number,
  currentScroll: number,
): number {
  const viewportRect = viewport.getBoundingClientRect();
  const wordRect = wordEl.getBoundingClientRect();
  const cueY = viewportRect.top + (viewportRect.height * cuePositionPercent) / 100;
  const wordCenterY = wordRect.top + wordRect.height / 2;
  return currentScroll + (wordCenterY - cueY);
}

/** Scroll offset that places an element's top edge on the cue line. */
export function computeScrollTargetForElementTopAtCue(
  viewport: HTMLDivElement,
  el: HTMLElement,
  cuePositionPercent: number,
  currentScroll: number,
): number {
  const viewportRect = viewport.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const cueY = viewportRect.top + (viewportRect.height * cuePositionPercent) / 100;
  return currentScroll + (elRect.top - cueY);
}

/** Preview scroll target for a word, with top-clamp fallback when center alignment is unreachable. */
export function getPreviewScrollTargetForWord(
  viewport: HTMLDivElement,
  wordEl: HTMLElement,
  cuePositionPercent: number,
  currentScroll: number,
): number {
  const centerTarget = computeScrollTargetForWordAtCue(
    viewport,
    wordEl,
    cuePositionPercent,
    currentScroll,
  );
  const maxScroll = getMaxNativeScroll(viewport);

  if (centerTarget >= 0) {
    return clampScroll(centerTarget, maxScroll);
  }

  const topTarget = computeScrollTargetForElementTopAtCue(
    viewport,
    wordEl,
    cuePositionPercent,
    currentScroll,
  );
  return clampScroll(topTarget, maxScroll);
}

/** Clamped cue-aligned scroll offset for a target element. */
export function getCueAlignmentOffset(
  viewport: HTMLDivElement,
  content: HTMLDivElement,
  cuePositionPercent: number,
  targetEl: HTMLElement,
  currentScroll = 0,
): number {
  const offset = computeScrollTargetForWordAtCue(
    viewport,
    targetEl,
    cuePositionPercent,
    currentScroll,
  );
  return clampScroll(offset, getMaxScroll(content, viewport));
}

/** Scroll offset that aligns the first word to the cue line (preview start state). */
export function getInitialCueAlignmentOffset(
  viewport: HTMLDivElement,
  content: HTMLDivElement,
  cuePositionPercent: number,
): number {
  const wordEl = content.querySelector('[data-word-index="0"]') as HTMLElement | null;
  if (!wordEl) return 0;
  return getCueAlignmentOffset(viewport, content, cuePositionPercent, wordEl, 0);
}

export function applyCueAlignmentToElement(
  viewport: HTMLDivElement,
  content: HTMLDivElement,
  targetEl: HTMLElement,
  cuePositionPercent: number,
  currentScroll: number,
  mirrorMode: MirrorMode = "none",
): number {
  const offset = getCueAlignmentOffset(
    viewport,
    content,
    cuePositionPercent,
    targetEl,
    currentScroll,
  );
  applyScrollTransform(content, offset, mirrorMode);
  return offset;
}

/** Max scroll for a natively scrollable preview viewport. */
export function getMaxNativeScroll(viewport: HTMLDivElement): number {
  return Math.max(0, viewport.scrollHeight - viewport.clientHeight);
}

/** Clamped cue-aligned scroll offset for native preview scrolling. */
export function getPreviewCueAlignmentOffset(
  viewport: HTMLDivElement,
  targetEl: HTMLElement,
  cuePositionPercent: number,
  currentScroll: number,
): number {
  const offset = computeScrollTargetForWordAtCue(
    viewport,
    targetEl,
    cuePositionPercent,
    currentScroll,
  );
  return clampScroll(offset, getMaxNativeScroll(viewport));
}

/** Scroll offset that aligns the first word to the cue line in preview mode. */
export function getInitialPreviewCueAlignmentOffset(
  viewport: HTMLDivElement,
  content: HTMLDivElement,
  cuePositionPercent: number,
): number {
  const wordEl = content.querySelector('[data-word-index="0"]') as HTMLElement | null;
  if (!wordEl) return 0;
  return getPreviewCueAlignmentOffset(viewport, wordEl, cuePositionPercent, 0);
}

export function applyPreviewScroll(viewport: HTMLDivElement, offset: number): number {
  const clamped = clampScroll(offset, getMaxNativeScroll(viewport));
  viewport.scrollTop = clamped;
  return clamped;
}

export function applyPreviewCueAlignmentToElement(
  viewport: HTMLDivElement,
  content: HTMLDivElement,
  targetEl: HTMLElement,
  cuePositionPercent: number,
  currentScroll: number,
): number {
  const offset = getPreviewCueAlignmentOffset(
    viewport,
    targetEl,
    cuePositionPercent,
    currentScroll,
  );
  return applyPreviewScroll(viewport, offset);
}

export function applyPreviewWordCueAlignment(
  viewport: HTMLDivElement,
  wordEl: HTMLElement,
  cuePositionPercent: number,
  currentScroll: number,
): number {
  const offset = getPreviewScrollTargetForWord(
    viewport,
    wordEl,
    cuePositionPercent,
    currentScroll,
  );
  return applyPreviewScroll(viewport, offset);
}

export function startScrollLoop(refs: ScrollEngineRefs): () => void {
  const tick = () => {
    const { contentRef, viewportRef, scrollOffsetRef, targetScrollRef, isRunningRef, speedRef, voiceModeActiveRef, mirrorModeRef } = refs;

    const maxScroll = getMaxScroll(contentRef.current, viewportRef.current);

    const editPaused = refs.editPausedRef?.current ?? false;

    const voiceWordIdx = refs.voiceTargetWordRef?.current ?? 0;
    const voiceEngaged =
      voiceModeActiveRef.current &&
      !editPaused &&
      (refs.voiceScrollActiveRef?.current ?? false) &&
      voiceWordIdx > 0;

    if (voiceEngaged && refs.voiceTargetWordRef) {
      const content = contentRef.current;
      const viewport = viewportRef.current;
      const wordIdx = voiceWordIdx;
      const cuePos = refs.cuePositionRef?.current ?? 33;

      if (content && viewport) {
        const wordEl = content.querySelector(
          `[data-word-index="${wordIdx - 1}"]`,
        ) as HTMLElement | null;
        if (wordEl) {
          const ideal = computeScrollTargetForWordAtCue(
            viewport,
            wordEl,
            cuePos,
            scrollOffsetRef.current,
          );
          targetScrollRef.current = clampScroll(ideal, maxScroll);
        }
      }

      scrollOffsetRef.current = lerpScroll(
        scrollOffsetRef.current,
        clampScroll(targetScrollRef.current, maxScroll),
        VOICE_LERP_FACTOR,
      );
      applyScrollTransform(contentRef.current, scrollOffsetRef.current, mirrorModeRef.current);
    } else if (isRunningRef.current && !editPaused) {
      scrollOffsetRef.current = clampScroll(
        scrollOffsetRef.current + speedRef.current / 60,
        maxScroll,
      );
      applyScrollTransform(contentRef.current, scrollOffsetRef.current, mirrorModeRef.current);
    }

    refs.rafRef.current = requestAnimationFrame(tick);
  };

  refs.rafRef.current = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(refs.rafRef.current);
}

export function scrollToOffset(
  refs: Pick<ScrollEngineRefs, "contentRef" | "viewportRef" | "scrollOffsetRef" | "targetScrollRef" | "mirrorModeRef">,
  offset: number,
  smooth = false,
): void {
  const maxScroll = getMaxScroll(refs.contentRef.current, refs.viewportRef.current);
  const clamped = clampScroll(offset, maxScroll);
  if (smooth) {
    refs.targetScrollRef.current = clamped;
  } else {
    refs.scrollOffsetRef.current = clamped;
    refs.targetScrollRef.current = clamped;
    applyScrollTransform(
      refs.contentRef.current,
      clamped,
      refs.mirrorModeRef.current,
    );
  }
}

export function scrollToWordElement(
  refs: Pick<ScrollEngineRefs, "contentRef" | "viewportRef" | "scrollOffsetRef" | "targetScrollRef" | "mirrorModeRef">,
  wordEl: HTMLElement,
  cuePositionPercent: number,
  smooth = true,
): void {
  const viewport = refs.viewportRef.current;
  const content = refs.contentRef.current;
  if (!viewport || !content) return;

  const viewportRect = viewport.getBoundingClientRect();
  const wordRect = wordEl.getBoundingClientRect();
  const cueY = viewportRect.top + (viewportRect.height * cuePositionPercent) / 100;
  const wordCenterY = wordRect.top + wordRect.height / 2;
  const delta = wordCenterY - cueY;
  const newOffset = refs.scrollOffsetRef.current + delta;
  scrollToOffset(refs, newOffset, smooth);
}

export function getActiveLineIndex(
  contentEl: HTMLDivElement | null,
  viewportEl: HTMLDivElement | null,
  cuePositionPercent: number,
): number | null {
  if (!contentEl || !viewportEl) return null;

  const viewportRect = viewportEl.getBoundingClientRect();
  const cueY = viewportRect.top + (viewportRect.height * cuePositionPercent) / 100;
  const paragraphs = contentEl.querySelectorAll("[data-line-index]");

  for (const p of paragraphs) {
    const rect = p.getBoundingClientRect();
    if (rect.top <= cueY && rect.bottom >= cueY) {
      return Number((p as HTMLElement).dataset.lineIndex);
    }
  }
  return null;
}

export const MIRROR_MODE_LABELS: Record<MirrorMode, string> = {
  none: "Normal",
  horizontal: "Mirror H",
  vertical: "Mirror V",
  both: "Mirror Both",
};

export function cycleMirrorMode(current: MirrorMode): MirrorMode {
  const order: MirrorMode[] = ["none", "horizontal", "vertical", "both"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}
