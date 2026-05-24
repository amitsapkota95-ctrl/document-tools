"use client";

import { Bold, Bookmark, Palette, Underline, Upload } from "lucide-react";
import { useRef } from "react";
import {
  applyBoldToSelection,
  applyColorToSelection,
  applyUnderlineToSelection,
  insertHtmlAtSelection,
} from "@/lib/teleprompter/editor-format";
import { createMarkerHtml } from "@/lib/teleprompter/script-parser";

const COLOR_SWATCHES = [
  { label: "Default", value: "" },
  { label: "Yellow", value: "#FFFF00" },
  { label: "Red", value: "#FF4444" },
  { label: "Green", value: "#22C55E" },
  { label: "White", value: "#FFFFFF" },
  { label: "Black", value: "#000000" },
];

interface EditorToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onContentChange: () => void;
  onImportText: (text: string) => void;
}

export function EditorToolbar({ editorRef, onContentChange, onImportText }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const withEditor = (action: (el: HTMLDivElement) => void) => {
    const el = editorRef.current;
    if (!el) return;
    action(el);
    el.focus();
    onContentChange();
  };

  const applyColor = (color: string) => {
    withEditor((el) => {
      applyColorToSelection(color, el);
    });
  };

  const insertMarker = () => {
    const label = window.prompt("Section marker name:", "Scene 2");
    if (!label?.trim()) return;
    withEditor((el) => insertHtmlAtSelection(createMarkerHtml(label.trim()), el));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImportText(String(reader.result ?? ""));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-moss/60 bg-moss-light/30 p-2">
      <ToolbarButton title="Bold (Ctrl+B)" onClick={() => withEditor(applyBoldToSelection)}>
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Underline (Ctrl+U)" onClick={() => withEditor(applyUnderlineToSelection)}>
        <Underline className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-6 w-px bg-moss/60" />

      {COLOR_SWATCHES.map((swatch) => (
        <button
          key={swatch.label}
          type="button"
          title={swatch.label}
          onClick={() => applyColor(swatch.value)}
          className="h-6 w-6 rounded border border-moss/60 transition-transform hover:scale-110"
          style={{
            backgroundColor: swatch.value || "transparent",
            backgroundImage: swatch.value
              ? undefined
              : "linear-gradient(135deg, #ccc 45%, #999 50%, #ccc 55%)",
          }}
        />
      ))}
      <ToolbarButton title="Custom color" onClick={() => colorInputRef.current?.click()}>
        <Palette className="h-4 w-4" />
      </ToolbarButton>
      <input
        ref={colorInputRef}
        type="color"
        defaultValue="#ffff00"
        className="sr-only"
        onChange={(e) => applyColor(e.target.value)}
      />

      <div className="mx-1 h-6 w-px bg-moss/60" />

      <ToolbarButton title="Insert section marker" onClick={insertMarker}>
        <Bookmark className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton title="Import .txt file" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4" />
      </ToolbarButton>
      <input ref={fileInputRef} type="file" accept=".txt,text/plain" className="sr-only" onChange={handleImport} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-lg p-2 text-forest transition-colors hover:bg-moss/50 active:bg-moss/70"
    >
      {children}
    </button>
  );
}
