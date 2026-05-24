import type { CSSProperties } from "react";
import type { TeleprompterTheme, ThemeId } from "./types";

export const TELEPROMPTER_THEMES: Record<ThemeId, TeleprompterTheme> = {
  "studio-black": {
    id: "studio-black",
    label: "Studio Black",
    background: "#000000",
    text: "#FFFFFF",
    accent: "#FFFFFF",
    border: "rgba(255,255,255,0.3)",
    controlsBg: "#000000",
  },
  "broadcast-yellow": {
    id: "broadcast-yellow",
    label: "Broadcast Yellow",
    background: "#000000",
    text: "#FFFF00",
    accent: "#FFFF00",
    border: "rgba(255,255,0,0.4)",
    controlsBg: "#000000",
  },
  "forest-classic": {
    id: "forest-classic",
    label: "Forest Classic",
    background: "#14532d",
    text: "#fefce8",
    accent: "#fef08a",
    border: "rgba(187,247,208,0.5)",
    controlsBg: "#14532d",
  },
  "high-contrast-white": {
    id: "high-contrast-white",
    label: "High Contrast White",
    background: "#FFFFFF",
    text: "#000000",
    accent: "#14532d",
    border: "rgba(20,83,45,0.3)",
    controlsBg: "#FFFFFF",
  },
};

export const THEME_ORDER: ThemeId[] = [
  "broadcast-yellow",
  "studio-black",
  "forest-classic",
  "high-contrast-white",
];

export function getTheme(id: ThemeId): TeleprompterTheme {
  return TELEPROMPTER_THEMES[id];
}

function isLightBackground(color: string): boolean {
  const hex = color.trim().replace("#", "");
  if (hex.length !== 3 && hex.length !== 6) return false;
  const normalized =
    hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

/** Faint but visible editor-selection wash that contrasts with the preview background. */
export function getSelectionHighlightStyle(background: string): CSSProperties {
  const light = isLightBackground(background);
  return {
    backgroundColor: light ? "rgba(20, 83, 45, 0.16)" : "rgba(255, 255, 255, 0.28)",
    boxShadow: light
      ? "inset 0 0 0 1px rgba(20, 83, 45, 0.45)"
      : "inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
    borderRadius: "0.15em",
    padding: "0 0.08em",
  };
}
