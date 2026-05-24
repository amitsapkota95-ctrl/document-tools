const HTML_TAG = /<[^>]*>/g;

export function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(HTML_TAG, "");
  const doc = typeof document !== "undefined" ? document.createElement("div") : null;
  if (doc) {
    doc.innerHTML = tmp;
    return doc.textContent ?? "";
  }
  return tmp.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

export function countWords(text: string): number {
  const plain = stripHtml(text);
  return plain.split(/\s+/).filter(Boolean).length;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function readingTimeRangeSec(wordCount: number, wpmLow = 130, wpmHigh = 150): {
  lowSec: number;
  highSec: number;
  label: string;
} {
  if (wordCount === 0) {
    return { lowSec: 0, highSec: 0, label: "0:00" };
  }
  const highSec = (wordCount / wpmHigh) * 60;
  const lowSec = (wordCount / wpmLow) * 60;
  return {
    lowSec,
    highSec,
    label: `${formatDuration(highSec)} – ${formatDuration(lowSec)}`,
  };
}

export function readingTimeAtWpm(wordCount: number, wpm: number): number {
  if (wordCount === 0 || wpm <= 0) return 0;
  return (wordCount / wpm) * 60;
}

/** Approximate WPM from scroll speed given content metrics */
export function estimateWpmFromSpeed(
  speedPxPerFrame: number,
  contentHeightPx: number,
  wordCount: number,
  fps = 60,
): number {
  if (contentHeightPx <= 0 || wordCount <= 0) return 0;
  const pxPerSec = speedPxPerFrame * fps;
  const secToComplete = contentHeightPx / pxPerSec;
  if (secToComplete <= 0) return 0;
  return Math.round((wordCount / secToComplete) * 60);
}

/** Back-calculate speed from target WPM */
export function speedFromTargetWpm(
  targetWpm: number,
  contentHeightPx: number,
  wordCount: number,
  fps = 60,
): number {
  if (contentHeightPx <= 0 || wordCount <= 0 || targetWpm <= 0) return 50;
  const secToComplete = (wordCount / targetWpm) * 60;
  const pxPerSec = contentHeightPx / secToComplete;
  return Math.round(Math.min(200, Math.max(10, pxPerSec / fps)));
}
