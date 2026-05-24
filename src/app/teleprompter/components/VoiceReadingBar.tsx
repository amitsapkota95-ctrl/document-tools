"use client";

import type { TeleprompterTheme } from "@/lib/teleprompter/types";
import type { VoiceTrackerState } from "@/lib/teleprompter/voice-tracker";

interface VoiceReadingBarProps {
  theme: TeleprompterTheme;
  voice: VoiceTrackerState;
  enabled: boolean;
  usingManualFallback: boolean;
}

export function VoiceReadingBar({
  theme,
  voice,
  enabled,
  usingManualFallback,
}: VoiceReadingBarProps) {
  if (!enabled) return null;

  const displayText =
    voice.interimText ||
    voice.currentPhrase ||
    (voice.hearingAudio ? "Listening…" : "Waiting for speech…");

  let statusLabel = "Voice track (Beta)";
  if (usingManualFallback) {
    statusLabel = "Voice (Beta) — using manual scroll";
  } else if (voice.status === "listening" && voice.hearingAudio) {
    statusLabel = "Voice (Beta) — hearing you";
  } else if (voice.status === "paused") {
    statusLabel = "Voice (Beta) — paused, manual scroll active";
  } else if (voice.status === "unavailable") {
    statusLabel = "Voice (Beta) — unavailable, using manual scroll";
  } else if (voice.status === "error") {
    statusLabel = "Voice (Beta) — error, using manual scroll";
  }

  return (
    <div
      className="shrink-0 border-t px-4 py-2"
      style={{
        backgroundColor: theme.controlsBg,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{statusLabel}</p>
        <p className="min-w-0 text-sm leading-snug">
          <span className="opacity-60">Reading: </span>
          <span className={voice.interimText ? "italic opacity-90" : "font-medium"}>
            {displayText || "—"}
          </span>
        </p>
      </div>
    </div>
  );
}
