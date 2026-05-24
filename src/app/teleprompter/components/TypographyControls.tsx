"use client";

import { FONT_OPTIONS } from "@/lib/teleprompter/fonts";
import type { CueStyle, TeleprompterSettings } from "@/lib/teleprompter/types";

interface TypographyControlsProps {
  settings: TeleprompterSettings;
  onChange: (patch: Partial<TeleprompterSettings>) => void;
}

const CUE_STYLES: { id: CueStyle; label: string }[] = [
  { id: "line", label: "Line" },
  { id: "chevron", label: "Chevron" },
  { id: "band", label: "Band" },
];

const labelClass = "flex min-w-0 flex-col gap-1 text-xs font-semibold text-forest-700 sm:flex-row sm:items-center sm:gap-2";

export function TypographyControls({ settings, onChange }: TypographyControlsProps) {
  return (
    <div className="sticky top-0 z-10 mb-3 rounded-xl border border-cream-300 bg-cream/95 p-3 shadow-paper backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/60">Eye-line & typography</p>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <label className={labelClass}>
          Width: {settings.textWidth}%
          <input
            type="range"
            min={40}
            max={100}
            value={settings.textWidth}
            onChange={(e) => onChange({ textWidth: Number(e.target.value) })}
            className="w-full min-w-[5rem] accent-forest-600 sm:w-20"
          />
        </label>

        <label className={labelClass}>
          Size: {settings.fontSize}px
          <input
            type="range"
            min={18}
            max={120}
            value={settings.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="w-full min-w-[5rem] accent-forest-600 sm:w-20"
          />
        </label>

        <label className={labelClass}>
          Cue: {settings.cuePosition}%
          <input
            type="range"
            min={20}
            max={45}
            value={settings.cuePosition}
            onChange={(e) => onChange({ cuePosition: Number(e.target.value) })}
            className="w-full min-w-[5rem] accent-forest-600 sm:w-16"
          />
        </label>

        <label className={labelClass}>
          Line H: {settings.lineHeight.toFixed(2)}
          <input
            type="range"
            min={1.2}
            max={2}
            step={0.05}
            value={settings.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            className="w-full min-w-[5rem] accent-forest-600 sm:w-16"
          />
        </label>

        <label className={labelClass}>
          Pad: {settings.horizontalPadding}px
          <input
            type="range"
            min={8}
            max={128}
            value={settings.horizontalPadding}
            onChange={(e) => onChange({ horizontalPadding: Number(e.target.value) })}
            className="w-full min-w-[5rem] accent-forest-600 sm:w-16"
          />
        </label>

        <label className={labelClass}>
          Font
          <select
            value={settings.fontFamily}
            onChange={(e) =>
              onChange({ fontFamily: e.target.value as TeleprompterSettings["fontFamily"] })
            }
            className="w-full min-w-[7rem] rounded-lg border border-cream-300 bg-cream px-2 py-1 text-xs sm:w-auto"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Cue style
          <select
            value={settings.cueStyle}
            onChange={(e) => onChange({ cueStyle: e.target.value as CueStyle })}
            className="w-full min-w-[7rem] rounded-lg border border-cream-300 bg-cream px-2 py-1 text-xs sm:w-auto"
          >
            {CUE_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
