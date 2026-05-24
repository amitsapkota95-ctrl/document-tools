"use client";

import { countWords, readingTimeRangeSec } from "@/lib/teleprompter/wpm";

interface ReadingStatsProps {
  script: string;
  targetWpm: number;
  onTargetWpmChange?: (wpm: number) => void;
  approximateWpm?: number;
  compact?: boolean;
}

export function ReadingStats({
  script,
  targetWpm,
  onTargetWpmChange,
  approximateWpm,
  compact = false,
}: ReadingStatsProps) {
  const wordCount = countWords(script);
  const range = readingTimeRangeSec(wordCount);

  if (compact) {
    return (
      <p className="text-xs text-ink/50">
        {wordCount.toLocaleString()} words · {range.label} at 130–150 WPM
        {approximateWpm != null && approximateWpm > 0 ? ` · scroll ≈ ${approximateWpm} WPM` : ""}
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-cream-300 bg-cream/50 p-4 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold text-forest-700">{wordCount.toLocaleString()} words</span>
        <span className="text-ink/60">Est. {range.label}</span>
      </div>
      {approximateWpm != null && approximateWpm > 0 && (
        <p className="text-xs text-ink/50">Scroll speed ≈ {approximateWpm} WPM</p>
      )}
      {onTargetWpmChange && (
        <label className="block text-xs font-semibold text-forest-700">
          Target WPM: {targetWpm}
          <input
            type="range"
            min={100}
            max={180}
            value={targetWpm}
            onChange={(e) => onTargetWpmChange(Number(e.target.value))}
            className="mt-1 w-full accent-forest-600"
          />
        </label>
      )}
    </div>
  );
}
