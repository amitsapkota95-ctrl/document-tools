"use client";

import type { CueStyle, TeleprompterTheme } from "@/lib/teleprompter/types";

interface CueIndicatorProps {
  positionPercent: number;
  style: CueStyle;
  theme: TeleprompterTheme;
}

export function CueIndicator({ positionPercent, style, theme }: CueIndicatorProps) {
  const top = `${positionPercent}%`;

  if (style === "chevron") {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 z-20 flex -translate-y-1/2 items-center justify-center"
        style={{ top }}
        aria-hidden
      >
        <div className="flex items-center gap-2 opacity-40" style={{ color: theme.accent }}>
          <span className="text-xl">◀</span>
          <span className="h-px flex-1 max-w-[30%] opacity-70" style={{ backgroundColor: theme.accent }} />
          <span className="text-xl">▶</span>
        </div>
      </div>
    );
  }

  if (style === "band") {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 z-20 -translate-y-1/2"
        style={{ top }}
        aria-hidden
      >
        <div
          className="mx-auto h-6 max-w-2xl opacity-10"
          style={{
            background: `linear-gradient(to bottom, transparent, ${theme.accent}, transparent)`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 -translate-y-1/2"
      style={{ top }}
      aria-hidden
    >
      <div
        className="mx-auto h-px w-full max-w-3xl opacity-35"
        style={{ backgroundColor: theme.accent }}
      />
    </div>
  );
}
