"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { ToolButton } from "@/components/tools/ToolButton";
import { extractMarkers, type EditorSelectionContext } from "@/lib/teleprompter/script-parser";
import {
  applyCueAlignmentToElement,
  applyPreviewCueAlignmentToElement,
  applyScrollTransform,
  startScrollLoop,
} from "@/lib/teleprompter/scroll-engine";
import { getTheme, THEME_ORDER } from "@/lib/teleprompter/themes";
import { type ScriptMarker, type TeleprompterSettings } from "@/lib/teleprompter/types";
import { useTeleprompterSettings } from "@/lib/teleprompter/use-teleprompter-settings";
import { usePreviewScale } from "@/lib/teleprompter/use-preview-scale";
import { useVoiceTracker } from "@/lib/teleprompter/voice-tracker";
import {
  countWords,
  estimateWpmFromSpeed,
  speedFromTargetWpm,
} from "@/lib/teleprompter/wpm";
import { TOOL_SIDEBAR_CTA_CLASS } from "@/lib/ui/classes";
import { useToastStore } from "@/stores/toast-store";
import { FullscreenEditPanel } from "./components/FullscreenEditPanel";
import { MarkerJumpList } from "./components/MarkerJumpList";
import { PrompterControls } from "./components/PrompterControls";
import { PrompterPreview } from "./components/PrompterPreview";
import { PrompterViewport } from "./components/PrompterViewport";
import { ReadingStats } from "./components/ReadingStats";
import { ScriptEditor } from "./components/ScriptEditor";
import { TypographyControls } from "./components/TypographyControls";
import { VoiceReadingBar } from "./components/VoiceReadingBar";

export default function TeleprompterTool() {
  const [script, setScript] = useState("");
  const [settings, updateSettings] = useTeleprompterSettings();
  const [isRunning, setIsRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [markerMenuOpen, setMarkerMenuOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [editorFocused, setEditorFocused] = useState(false);
  const [editorSelection, setEditorSelection] = useState<EditorSelectionContext>({
    lineIndex: null,
    wordRange: null,
  });

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);
  const previewScrollOffsetRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const targetScrollRef = useRef(0);
  const rafRef = useRef(0);
  const isRunningRef = useRef(false);
  const speedRef = useRef(settings.speed);
  const voiceModeActiveRef = useRef(false);
  const voiceTargetWordRef = useRef(0);
  const voiceScrollActiveRef = useRef(false);
  const cuePositionRef = useRef(settings.cuePosition);
  const mirrorModeRef = useRef(settings.mirrorMode);
  const nativeFullscreenRef = useRef(false);
  const markerIndexRef = useRef(0);

  const pushToast = useToastStore((s) => s.pushToast);

  const handleVoiceError = useCallback(
    (msg: string) => pushToast("error", msg),
    [pushToast],
  );

  const scrollRefs = useMemo(
    () => ({
      contentRef,
      viewportRef,
      scrollOffsetRef,
      targetScrollRef,
      mirrorModeRef,
    }),
    [],
  );

  const markers = useMemo(() => extractMarkers(script), [script]);
  const wordCount = useMemo(() => countWords(script), [script]);
  const hasScript = script.replace(/<[^>]*>/g, "").trim().length > 0;
  const previewScale = usePreviewScale(previewViewportRef, hasScript && !fullscreen);
  const effectiveContentHeight = useMemo(() => {
    if (fullscreen || previewScale <= 0) return contentHeight;
    return contentHeight / previewScale;
  }, [fullscreen, contentHeight, previewScale]);
  const approximateWpm = useMemo(
    () => estimateWpmFromSpeed(settings.speed, effectiveContentHeight, wordCount),
    [settings.speed, effectiveContentHeight, wordCount],
  );

  const updateSettingsPatch = useCallback(
    (patch: Partial<TeleprompterSettings>) => updateSettings(patch),
    [updateSettings],
  );

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    speedRef.current = settings.speed;
  }, [settings.speed]);

  useEffect(() => {
    mirrorModeRef.current = settings.mirrorMode;
    applyScrollTransform(contentRef.current, scrollOffsetRef.current, settings.mirrorMode);
  }, [settings.mirrorMode]);

  useEffect(() => {
    cuePositionRef.current = settings.cuePosition;
  }, [settings.cuePosition]);

  useEffect(() => {
    const stop = startScrollLoop({
      contentRef,
      viewportRef,
      scrollOffsetRef,
      targetScrollRef,
      isRunningRef,
      speedRef,
      voiceModeActiveRef,
      voiceTargetWordRef,
      voiceScrollActiveRef,
      cuePositionRef,
      mirrorModeRef,
      rafRef,
    });
    return stop;
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      if (!document.fullscreenElement && nativeFullscreenRef.current) {
        nativeFullscreenRef.current = false;
        setFullscreen(false);
        setIsRunning(false);
        setEditOpen(false);
        setMarkerMenuOpen(false);
      }
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    scrollOffsetRef.current = 0;
    targetScrollRef.current = 0;
    applyScrollTransform(contentRef.current, 0, settings.mirrorMode);
  }, [fullscreen, settings.mirrorMode]);

  useEffect(() => {
    const measureEl = fullscreen ? contentRef.current : previewContentRef.current;
    if (!measureEl) return;
    const observer = new ResizeObserver(() => {
      setContentHeight(measureEl.offsetHeight ?? 0);
    });
    observer.observe(measureEl);
    setContentHeight(measureEl.offsetHeight ?? 0);
    return () => observer.disconnect();
  }, [fullscreen, script, settings.fontSize, settings.lineHeight, settings.textWidth]);

  const voiceListening = settings.voiceTracking && fullscreen;
  const voiceScrolling = voiceListening && isRunning;

  const voiceState = useVoiceTracker({
    listening: voiceListening,
    scrolling: voiceScrolling,
    script,
    contentRef,
    voiceModeActiveRef,
    voiceTargetWordRef,
    voiceScrollActiveRef,
    onError: handleVoiceError,
  });

  const { status: voiceStatus, activeWordIndex } = voiceState;

  const voiceManualFallback =
    settings.voiceTracking &&
    (activeWordIndex === 0 ||
      voiceStatus === "unavailable" ||
      voiceStatus === "error" ||
      !voiceState.speechAvailable);

  const jumpToMarker = useCallback(
    (marker: ScriptMarker) => {
      const content = fullscreen ? contentRef.current : previewContentRef.current;
      const viewport = fullscreen ? viewportRef.current : previewViewportRef.current;
      if (!content || !viewport) return;

      const markerEl = content.querySelector(
        `[data-marker="${CSS.escape(marker.label)}"]`,
      ) as HTMLElement | null;
      const targetEl =
        markerEl ??
        (content.querySelector(`[data-word-index="${marker.wordIndex}"]`) as HTMLElement | null);
      if (!targetEl) return;

      if (fullscreen) {
        const offset = applyCueAlignmentToElement(
          viewport,
          content,
          targetEl,
          settings.cuePosition,
          scrollOffsetRef.current,
          settings.mirrorMode,
        );
        scrollOffsetRef.current = offset;
        targetScrollRef.current = offset;
      } else {
        previewScrollOffsetRef.current = applyPreviewCueAlignmentToElement(
          viewport,
          content,
          targetEl,
          settings.cuePosition,
          previewScrollOffsetRef.current,
        );
      }
      setMarkerMenuOpen(false);
    },
    [fullscreen, settings.cuePosition, settings.mirrorMode, scrollRefs],
  );

  const jumpMarkerRelative = useCallback(
    (direction: -1 | 1) => {
      if (markers.length === 0) return;
      markerIndexRef.current = Math.max(
        0,
        Math.min(markers.length - 1, markerIndexRef.current + direction),
      );
      jumpToMarker(markers[markerIndexRef.current]);
    },
    [markers, jumpToMarker],
  );

  const toggleRunning = useCallback(() => {
    setIsRunning((running) => {
      const next = !running;
      isRunningRef.current = next;
      return next;
    });
  }, []);

  const enterFullscreen = async () => {
    scrollOffsetRef.current = 0;
    targetScrollRef.current = 0;
    setIsRunning(false);
    setEditOpen(false);
    setMarkerMenuOpen(false);
    setFullscreen(true);
    try {
      await document.documentElement.requestFullscreen();
      nativeFullscreenRef.current = true;
    } catch {
      nativeFullscreenRef.current = false;
    }
  };

  const exitFullscreen = async () => {
    setFullscreen(false);
    setIsRunning(false);
    setEditOpen(false);
    setMarkerMenuOpen(false);
    nativeFullscreenRef.current = false;
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
    }
  };

  const applyTargetWpmSpeed = useCallback(() => {
    const speed = speedFromTargetWpm(settings.targetWpm, effectiveContentHeight, wordCount);
    updateSettingsPatch({ speed });
    pushToast("info", `Speed set for ~${settings.targetWpm} WPM`);
  }, [settings.targetWpm, effectiveContentHeight, wordCount, updateSettingsPatch, pushToast]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!fullscreen) return;

      if (e.code === "Space" && !editOpen) {
        e.preventDefault();
        toggleRunning();
      }
      if (e.code === "ArrowUp" && !e.shiftKey) {
        updateSettingsPatch({ speed: Math.min(200, settings.speed + 5) });
      }
      if (e.code === "ArrowDown" && !e.shiftKey) {
        updateSettingsPatch({ speed: Math.max(10, settings.speed - 5) });
      }
      if (e.code === "ArrowLeft" && !isRunning) {
        e.preventDefault();
        jumpMarkerRelative(-1);
      }
      if (e.code === "ArrowRight" && !isRunning) {
        e.preventDefault();
        jumpMarkerRelative(1);
      }
      if (e.key === "Escape" && editOpen) {
        e.preventDefault();
        setEditOpen(false);
        return;
      }
      if (e.key === "e" || e.key === "E") {
        if (!e.ctrlKey && !e.metaKey) setEditOpen((v) => !v);
      }
      if (e.key === "m" || e.key === "M") {
        if (!e.ctrlKey && !e.metaKey) setMarkerMenuOpen((v) => !v);
      }
      if (e.key >= "1" && e.key <= "4" && !e.ctrlKey && !e.metaKey) {
        const idx = Number(e.key) - 1;
        if (THEME_ORDER[idx]) updateSettingsPatch({ theme: THEME_ORDER[idx] });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    fullscreen,
    editOpen,
    isRunning,
    settings.speed,
    toggleRunning,
    updateSettingsPatch,
    jumpMarkerRelative,
  ]);

  const theme = getTheme(settings.theme);

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-hidden"
        style={{ backgroundColor: theme.background, color: theme.text }}
      >
        <div className="relative flex min-h-0 flex-1">
          <PrompterViewport
            script={script}
            settings={settings}
            viewportRef={viewportRef}
            contentRef={contentRef}
            activeWordIndex={activeWordIndex}
          />

          {editOpen && (
            <FullscreenEditPanel
              script={script}
              onChange={setScript}
              onClose={() => setEditOpen(false)}
              theme={theme}
            />
          )}

          {markerMenuOpen && (
            <div
              className="absolute bottom-20 left-4 z-30 max-h-64 w-64 overflow-y-auto rounded-lg border p-2 shadow-xl"
              style={{
                backgroundColor: theme.controlsBg,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              <MarkerJumpList
                markers={markers}
                onJump={jumpToMarker}
                variant="dropdown"
                open
              />
            </div>
          )}
        </div>

        <VoiceReadingBar
          theme={theme}
          voice={voiceState}
          enabled={settings.voiceTracking}
          usingManualFallback={voiceManualFallback}
        />

        <PrompterControls
          settings={settings}
          onSettingsChange={updateSettingsPatch}
          isRunning={isRunning}
          onToggleRunning={toggleRunning}
          onExit={exitFullscreen}
          onToggleEdit={() => setEditOpen((v) => !v)}
          editOpen={editOpen}
          onToggleMarkerMenu={() => setMarkerMenuOpen((v) => !v)}
          markerMenuOpen={markerMenuOpen}
          approximateWpm={approximateWpm}
          voiceStatus={voiceStatus}
          onToggleVoice={() => updateSettingsPatch({ voiceTracking: !settings.voiceTracking })}
        />
      </div>
    );
  }

  return (
    <ToolWorkflowLayout
      hasFiles={hasScript}
      wideUpload
      sidebarLabel="Teleprompter options"
      upload={
        <div className="flex w-full flex-col gap-3">
          <p className="text-sm font-semibold text-forest-700">Your script</p>
          <ScriptEditor script={script} onChange={setScript} minHeight="32rem" />
          <ReadingStats script={script} targetWpm={settings.targetWpm} />
        </div>
      }
      workspace={
        <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col gap-3">
          <ReadingStats
            script={script}
            targetWpm={settings.targetWpm}
            onTargetWpmChange={(targetWpm) => updateSettings({ targetWpm })}
            approximateWpm={approximateWpm}
          />
          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            <div className="flex min-h-[24rem] min-w-0 flex-1 flex-col lg:min-h-0">
              <TypographyControls settings={settings} onChange={updateSettings} />
              <p className="mb-1 text-sm font-semibold text-forest-700">Your script</p>
              <ScriptEditor
                script={script}
                onChange={setScript}
                className="flex-1"
                onSelectionContextChange={setEditorSelection}
                onFocusChange={setEditorFocused}
              />
            </div>
            <div className="flex min-h-[20rem] min-w-0 flex-1 flex-col lg:min-h-0">
              <PrompterPreview
                script={script}
                settings={settings}
                viewportRef={previewViewportRef}
                contentRef={previewContentRef}
                previewScrollOffsetRef={previewScrollOffsetRef}
                followLineIndex={editorFocused ? editorSelection.lineIndex : null}
                highlightWordRange={editorFocused ? editorSelection.wordRange : null}
                onThemeChange={(theme) => updateSettings({ theme })}
              />
            </div>
          </div>
        </div>
      }
      sidebar={
        <>
          <ReadingStats script={script} targetWpm={settings.targetWpm} compact />

          <label className="block text-sm font-semibold">
            Scroll speed: {settings.speed}
            <input
              type="range"
              min={10}
              max={200}
              value={settings.speed}
              onChange={(e) => updateSettings({ speed: Number(e.target.value) })}
              className="mt-2 w-full accent-forest-600"
            />
          </label>

          <label className="block text-sm font-semibold">
            Target WPM: {settings.targetWpm}
            <input
              type="range"
              min={100}
              max={180}
              value={settings.targetWpm}
              onChange={(e) => updateSettings({ targetWpm: Number(e.target.value) })}
              className="mt-2 w-full accent-forest-600"
            />
          </label>

          <ToolButton onClick={applyTargetWpmSpeed} variant="secondary" className="w-full text-sm">
            Apply target WPM to speed
          </ToolButton>

          <MarkerJumpList markers={markers} onJump={jumpToMarker} />

          <AdvancedToolsToggle variant="sidebar" label="Advanced Tools">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={settings.voiceTracking}
                onChange={(e) => updateSettings({ voiceTracking: e.target.checked })}
                className="h-4 w-4 accent-forest-600"
              />
              Voice-tracking auto-scroll (Beta)
            </label>
            <p className="text-xs text-ink/50">
              Experimental — uses Chrome/Edge speech recognition. If it doesn&apos;t detect your
              voice, manual scroll speed still works. Turn off to use the standard teleprompter.
            </p>
          </AdvancedToolsToggle>

          <p className="text-sm text-ink/60">
            Fullscreen: Space = pause, ↑↓ = speed, E = edit, Esc = close editor, M = markers, 1–4 =
            themes.
          </p>

          <div className={TOOL_SIDEBAR_CTA_CLASS}>
            <ToolButton onClick={enterFullscreen} disabled={!hasScript} className="w-full">
              Open Teleprompter
            </ToolButton>
          </div>
        </>
      }
    />
  );
}
