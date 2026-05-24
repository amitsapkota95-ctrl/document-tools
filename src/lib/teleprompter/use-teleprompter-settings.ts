"use client";

import { useCallback, useSyncExternalStore } from "react";
import { loadSettings, patchSettings, saveSettings } from "./settings";
import { DEFAULT_SETTINGS, type TeleprompterSettings } from "./types";

const SETTINGS_KEY = "paperless-teleprompter-settings";
const SETTINGS_EVENT = "teleprompter-settings-change";

/** Stable snapshot reference — required by useSyncExternalStore. */
let cachedSnapshot: TeleprompterSettings = DEFAULT_SETTINGS;
let cachedSnapshotKey = JSON.stringify(DEFAULT_SETTINGS);

function settingsEqual(a: TeleprompterSettings, b: TeleprompterSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function refreshCachedSnapshot(): TeleprompterSettings {
  const loaded = loadSettings();
  const key = JSON.stringify(loaded);
  if (key !== cachedSnapshotKey) {
    cachedSnapshotKey = key;
    cachedSnapshot = loaded;
  }
  return cachedSnapshot;
}

function commitSnapshot(next: TeleprompterSettings): void {
  cachedSnapshot = next;
  cachedSnapshotKey = JSON.stringify(next);
  saveSettings(next);
}

function subscribeSettings(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY) callback();
  };
  const onLocal = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(SETTINGS_EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SETTINGS_EVENT, onLocal);
  };
}

function getSettingsSnapshot(): TeleprompterSettings {
  return refreshCachedSnapshot();
}

function getSettingsServerSnapshot(): TeleprompterSettings {
  return DEFAULT_SETTINGS;
}

export function useTeleprompterSettings(): [
  TeleprompterSettings,
  (patch: Partial<TeleprompterSettings>) => void,
] {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot,
  );

  const updateSettings = useCallback((patch: Partial<TeleprompterSettings>) => {
    const next = patchSettings(cachedSnapshot, patch);
    if (settingsEqual(cachedSnapshot, next)) return;
    commitSnapshot(next);
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }, []);

  return [settings, updateSettings];
}
