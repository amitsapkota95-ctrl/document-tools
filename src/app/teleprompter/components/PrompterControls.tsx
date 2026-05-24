"use client";

import {
  FONT_OPTIONS,
} from "@/lib/teleprompter/fonts";
import { MIRROR_MODE_LABELS, cycleMirrorMode } from "@/lib/teleprompter/scroll-engine";
import { getTheme, THEME_ORDER } from "@/lib/teleprompter/themes";
import type { CueStyle, TeleprompterSettings, ThemeId, VoiceStatus } from "@/lib/teleprompter/types";

interface PrompterControlsProps {
  settings: TeleprompterSettings;
  onSettingsChange: (patch: Partial<TeleprompterSettings>) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onExit: () => void;
  onToggleEdit: () => void;
  editOpen: boolean;
  onToggleMarkerMenu: () => void;
  markerMenuOpen: boolean;
  approximateWpm: number;
  voiceStatus: VoiceStatus;
  onToggleVoice: () => void;
}

const CUE_STYLES: { id: CueStyle; label: string }[] = [
  { id: "line", label: "Line" },
  { id: "chevron", label: "Chevron" },
  { id: "band", label: "Band" },
];

function voiceStatusLabel(status: VoiceStatus): string {
  switch (status) {
    case "listening":
      return "Listening…";
    case "paused":
      return "Paused (no speech)";
    case "unavailable":
      return "Mic unavailable";
    case "error":
      return "Voice error";
    default:
      return "";
  }
}

export function PrompterControls({
  settings,
  onSettingsChange,
  isRunning,
  onToggleRunning,
  onExit,
  onToggleEdit,
  editOpen,
  onToggleMarkerMenu,
  markerMenuOpen,
  approximateWpm,
  voiceStatus,
  onToggleVoice,
}: PrompterControlsProps) {
  const theme = getTheme(settings.theme);
  const isDarkControls = settings.theme !== "high-contrast-white";

  const btnClass = (active = false) =>
    `border-2 px-3 py-1.5 text-sm transition-colors ${
      active
        ? isDarkControls
          ? "border-yellow-400 bg-yellow-400 text-black"
          : "border-forest bg-forest text-white"
        : isDarkControls
          ? "border-current hover:bg-white/10"
          : "border-forest hover:bg-forest/10"
    }`;

  const labelClass = "flex items-center gap-2 text-sm whitespace-nowrap";

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3 border-t p-3"
      style={{
        backgroundColor: theme.controlsBg,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <button type="button" onClick={onToggleRunning} className={`${btnClass()} px-6 py-2 font-semibold`}>
        {isRunning ? "Pause" : "Play"}
      </button>

      <label className={labelClass}>
        Speed
        <input
          type="range"
          min={10}
          max={200}
          value={settings.speed}
          onChange={(e) => onSettingsChange({ speed: Number(e.target.value) })}
          className="w-24 accent-yellow-400"
        />
        {approximateWpm > 0 && <span className="text-xs opacity-70">≈{approximateWpm} WPM</span>}
      </label>

      <label className={labelClass}>
        Size
        <input
          type="range"
          min={18}
          max={120}
          value={settings.fontSize}
          onChange={(e) => onSettingsChange({ fontSize: Number(e.target.value) })}
          className="w-20"
        />
      </label>

      <label className={labelClass}>
        Width
        <input
          type="range"
          min={40}
          max={100}
          value={settings.textWidth}
          onChange={(e) => onSettingsChange({ textWidth: Number(e.target.value) })}
          className="w-20"
        />
      </label>

      <label className={labelClass}>
        Line H
        <input
          type="range"
          min={1.2}
          max={2}
          step={0.05}
          value={settings.lineHeight}
          onChange={(e) => onSettingsChange({ lineHeight: Number(e.target.value) })}
          className="w-16"
        />
      </label>

      <label className={labelClass}>
        Pad
        <input
          type="range"
          min={8}
          max={128}
          value={settings.horizontalPadding}
          onChange={(e) => onSettingsChange({ horizontalPadding: Number(e.target.value) })}
          className="w-16"
        />
      </label>

      <label className={labelClass}>
        Cue
        <input
          type="range"
          min={20}
          max={45}
          value={settings.cuePosition}
          onChange={(e) => onSettingsChange({ cuePosition: Number(e.target.value) })}
          className="w-16"
        />
      </label>

      <select
        value={settings.cueStyle}
        onChange={(e) => onSettingsChange({ cueStyle: e.target.value as CueStyle })}
        className="rounded border px-2 py-1 text-sm"
        style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
      >
        {CUE_STYLES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={settings.fontFamily}
        onChange={(e) =>
          onSettingsChange({ fontFamily: e.target.value as TeleprompterSettings["fontFamily"] })
        }
        className="rounded border px-2 py-1 text-sm"
        style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        value={settings.theme}
        onChange={(e) => onSettingsChange({ theme: e.target.value as ThemeId })}
        className="rounded border px-2 py-1 text-sm"
        style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
      >
        {THEME_ORDER.map((id) => (
          <option key={id} value={id}>
            {getTheme(id).label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onSettingsChange({ mirrorMode: cycleMirrorMode(settings.mirrorMode) })}
        className={btnClass(settings.mirrorMode !== "none")}
      >
        {MIRROR_MODE_LABELS[settings.mirrorMode]}
      </button>

      <button
        type="button"
        onClick={onToggleVoice}
        className={btnClass(settings.voiceTracking)}
      >
        Voice (Beta)
      </button>

      {settings.voiceTracking && voiceStatusLabel(voiceStatus) && (
        <span className="rounded-full border px-2 py-0.5 text-xs opacity-80" style={{ borderColor: theme.border }}>
          {voiceStatusLabel(voiceStatus)}
        </span>
      )}

      <div className="relative">
        <button type="button" onClick={onToggleMarkerMenu} className={btnClass(markerMenuOpen)}>
          Markers (M)
        </button>
      </div>

      <button type="button" onClick={onToggleEdit} className={btnClass(editOpen)}>
        {editOpen ? "Close Edit" : "Edit (E)"}
      </button>

      <button type="button" onClick={onExit} className={btnClass()}>
        Exit
      </button>
    </div>
  );
}
