"use client";

import { X } from "lucide-react";
import { ScriptEditor } from "./ScriptEditor";

interface FullscreenEditPanelProps {
  script: string;
  onChange: (html: string) => void;
  onClose: () => void;
  theme: { controlsBg: string; border: string; text: string; accent: string };
}

export function FullscreenEditPanel({
  script,
  onChange,
  onClose,
  theme,
}: FullscreenEditPanelProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close editor and return to prompter"
        className="absolute inset-0 z-10 bg-black/40"
        onClick={onClose}
      />
      <div
        className="absolute inset-y-0 right-0 z-20 flex w-full max-w-xl flex-col border-l shadow-2xl sm:w-1/2"
        style={{
          backgroundColor: theme.controlsBg,
          borderColor: theme.border,
          color: theme.text,
        }}
        role="dialog"
        aria-label="Edit script"
      >
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3"
          style={{ borderColor: theme.border }}
        >
          <div>
            <p className="text-sm font-semibold">Edit script</p>
            <p className="text-xs opacity-70">Changes appear live on the prompter</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ borderColor: theme.border, color: theme.text }}
          >
            <X className="h-4 w-4" />
            Done
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-4 [&_.teleprompter-marker]:inline-block [&_.teleprompter-marker]:rounded [&_.teleprompter-marker]:bg-yellow-400/20 [&_.teleprompter-marker]:px-2 [&_.teleprompter-marker]:py-0.5">
          <ScriptEditor
            script={script}
            onChange={onChange}
            minHeight="100%"
            variant="dark"
            liveSync
          />
        </div>
      </div>
    </>
  );
}
