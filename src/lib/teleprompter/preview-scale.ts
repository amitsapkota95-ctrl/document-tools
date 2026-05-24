/** Approximate height of VoiceReadingBar + PrompterControls in fullscreen. */
export const FULLSCREEN_PROMPTER_CHROME_PX = 140;

export function getFullscreenPrompterReferenceSize(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 1280, height: 720 };
  }
  return {
    width: window.innerWidth,
    height: Math.max(400, window.innerHeight - FULLSCREEN_PROMPTER_CHROME_PX),
  };
}

/** Scale preview rendering to match fullscreen proportions inside a smaller pane. */
export function getPreviewScale(viewport: HTMLDivElement): number {
  const ref = getFullscreenPrompterReferenceSize();
  const widthScale = viewport.clientWidth / ref.width;
  const heightScale = viewport.clientHeight / ref.height;
  return Math.min(widthScale, heightScale);
}
