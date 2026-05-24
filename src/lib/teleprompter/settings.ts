import { DEFAULT_SETTINGS, type TeleprompterSettings } from "./types";

const STORAGE_KEY = "paperless-teleprompter-settings";
const LEGACY_WIDTH_KEY = "paperless-teleprompter-width";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeSettings(raw: Partial<TeleprompterSettings>): TeleprompterSettings {
  return {
    textWidth: clamp(Number(raw.textWidth) || DEFAULT_SETTINGS.textWidth, 40, 100),
    fontSize: clamp(Number(raw.fontSize) || DEFAULT_SETTINGS.fontSize, 18, 120),
    fontFamily: raw.fontFamily ?? DEFAULT_SETTINGS.fontFamily,
    lineHeight: clamp(Number(raw.lineHeight) || DEFAULT_SETTINGS.lineHeight, 1.2, 2.0),
    horizontalPadding: clamp(
      Number(raw.horizontalPadding) || DEFAULT_SETTINGS.horizontalPadding,
      8,
      128,
    ),
    theme: raw.theme ?? DEFAULT_SETTINGS.theme,
    cuePosition: clamp(Number(raw.cuePosition) || DEFAULT_SETTINGS.cuePosition, 20, 45),
    cueStyle: raw.cueStyle ?? DEFAULT_SETTINGS.cueStyle,
    mirrorMode: raw.mirrorMode ?? DEFAULT_SETTINGS.mirrorMode,
    targetWpm: clamp(Number(raw.targetWpm) || DEFAULT_SETTINGS.targetWpm, 100, 180),
    speed: clamp(Number(raw.speed) || DEFAULT_SETTINGS.speed, 10, 200),
    voiceTracking: Boolean(raw.voiceTracking),
  };
}

export function loadSettings(): TeleprompterSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return sanitizeSettings(JSON.parse(stored) as Partial<TeleprompterSettings>);
    }
  } catch {
    // fall through to legacy / defaults
  }

  const legacyWidth = localStorage.getItem(LEGACY_WIDTH_KEY);
  if (legacyWidth) {
    return sanitizeSettings({ textWidth: Number(legacyWidth) });
  }

  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: TeleprompterSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function patchSettings(
  current: TeleprompterSettings,
  patch: Partial<TeleprompterSettings>,
): TeleprompterSettings {
  return sanitizeSettings({ ...current, ...patch });
}
