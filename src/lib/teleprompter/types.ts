export type ThemeId =
  | "studio-black"
  | "broadcast-yellow"
  | "forest-classic"
  | "high-contrast-white";

export type FontFamilyId = "geist" | "inter" | "open-sans" | "system";

export type MirrorMode = "none" | "horizontal" | "vertical" | "both";

export type CueStyle = "line" | "chevron" | "band";

export interface TeleprompterSettings {
  textWidth: number;
  fontSize: number;
  fontFamily: FontFamilyId;
  lineHeight: number;
  horizontalPadding: number;
  theme: ThemeId;
  cuePosition: number;
  cueStyle: CueStyle;
  mirrorMode: MirrorMode;
  targetWpm: number;
  speed: number;
  voiceTracking: boolean;
}

export interface TeleprompterTheme {
  id: ThemeId;
  label: string;
  background: string;
  text: string;
  accent: string;
  border: string;
  controlsBg: string;
}

export interface ScriptMarker {
  id: string;
  label: string;
  wordIndex: number;
}

export type VoiceStatus =
  | "idle"
  | "listening"
  | "paused"
  | "unavailable"
  | "error";

export const DEFAULT_SETTINGS: TeleprompterSettings = {
  textWidth: 70,
  fontSize: 48,
  fontFamily: "geist",
  lineHeight: 1.625,
  horizontalPadding: 32,
  theme: "broadcast-yellow",
  cuePosition: 33,
  cueStyle: "line",
  mirrorMode: "none",
  targetWpm: 140,
  speed: 50,
  voiceTracking: false,
};
