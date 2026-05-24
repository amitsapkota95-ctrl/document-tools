"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import {
  convertMarkerLines,
  getCaretBlockIndex,
  getSelectionWordRange,
  plainTextToHtml,
  sanitizeHtml,
  type EditorSelectionContext,
} from "@/lib/teleprompter/script-parser";
import { insertHtmlAtSelection, normalizeColorSpans } from "@/lib/teleprompter/editor-format";

const EditorToolbar = dynamic(
  () => import("./EditorToolbar").then((m) => m.EditorToolbar),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 rounded-t-xl border border-b-0 border-cream-300 bg-cream-200/50" aria-hidden />
    ),
  },
);

const EDITOR_SURFACE_CLASS =
  "mt-1 block w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-forest-500/40 min-h-0 flex-1 overflow-y-auto rounded-t-none text-base leading-relaxed empty:before:pointer-events-none empty:before:opacity-60 empty:before:content-[attr(data-placeholder)]";

interface ScriptEditorProps {
  script: string;
  onChange: (html: string) => void;
  className?: string;
  minHeight?: string;
  /** Dark theme for in-prompter edit panel */
  variant?: "light" | "dark";
  /** Skip syncing HTML from props while the field is focused (live prompter edits) */
  liveSync?: boolean;
  onSelectionContextChange?: (context: EditorSelectionContext) => void;
  onFocusChange?: (focused: boolean) => void;
}

export function ScriptEditor({
  script,
  onChange,
  className = "",
  minHeight = "28rem",
  variant = "light",
  liveSync = false,
  onSelectionContextChange,
  onFocusChange,
}: ScriptEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const lastContextRef = useRef<string>("");

  const surfaceClass =
    variant === "dark"
      ? `${EDITOR_SURFACE_CLASS} border-white/20 bg-black/40 text-white placeholder:text-white/50 focus:border-yellow-400/60 focus:ring-yellow-400/20`
      : `${EDITOR_SURFACE_CLASS} border-cream-300 bg-cream text-forest-700 placeholder:text-ink/50 focus:border-forest-500`;

  const syncFromProp = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    if (liveSync && (document.activeElement === el || el.contains(document.activeElement))) {
      return;
    }
    const html = script || "<p><br></p>";
    if (el.innerHTML !== html) {
      isInternalUpdate.current = true;
      el.innerHTML = html;
      isInternalUpdate.current = false;
    }
  }, [script, liveSync]);

  useEffect(() => {
    syncFromProp();
  }, [syncFromProp]);

  const reportSelectionContext = useCallback(() => {
    const el = editorRef.current;
    if (!el || !onSelectionContextChange) return;

    const context: EditorSelectionContext = {
      lineIndex: getCaretBlockIndex(el),
      wordRange: getSelectionWordRange(el),
    };
    const key = `${context.lineIndex ?? "n"}:${context.wordRange?.start ?? "n"}:${context.wordRange?.end ?? "n"}`;
    if (key === lastContextRef.current) return;
    lastContextRef.current = key;
    onSelectionContextChange(context);
  }, [onSelectionContextChange]);

  useEffect(() => {
    if (!onSelectionContextChange) return;

    const handleSelectionChange = () => {
      const el = editorRef.current;
      if (!el) return;
      if (document.activeElement !== el && !el.contains(document.activeElement)) return;
      reportSelectionContext();
    };

    const handleDocumentMouseUp = () => {
      const el = editorRef.current;
      if (!el) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !sel.anchorNode) return;
      if (!el.contains(sel.anchorNode)) return;
      reportSelectionContext();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleDocumentMouseUp);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [onSelectionContextChange, reportSelectionContext]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el || isInternalUpdate.current) return;
    let html = el.innerHTML;
    html = convertMarkerLines(html);
    html = sanitizeHtml(html);
    if (html !== el.innerHTML) {
      isInternalUpdate.current = true;
      el.innerHTML = html;
      isInternalUpdate.current = false;
    }
    normalizeColorSpans(el);
    onChange(el.innerHTML);
    reportSelectionContext();
  }, [onChange, reportSelectionContext]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const el = editorRef.current;
    if (!el) return;

    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html.trim()) {
      const sanitized = sanitizeHtml(html);
      if (sanitized.trim()) {
        insertHtmlAtSelection(sanitized, el);
        emitChange();
        return;
      }
    }

    document.execCommand("insertText", false, text);
    emitChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") {
        e.preventDefault();
        document.execCommand("bold");
        emitChange();
      }
      if (e.key === "u") {
        e.preventDefault();
        document.execCommand("underline");
        emitChange();
      }
    }
  };

  const handleImport = (text: string) => {
    const html = plainTextToHtml(text);
    onChange(html);
  };

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <EditorToolbar editorRef={editorRef} onContentChange={emitChange} onImportText={handleImport} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={() => {
          emitChange();
          lastContextRef.current = "";
          onFocusChange?.(false);
          onSelectionContextChange?.({ lineIndex: null, wordRange: null });
        }}
        onFocus={() => {
          onFocusChange?.(true);
          lastContextRef.current = "";
          reportSelectionContext();
        }}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onMouseUp={reportSelectionContext}
        onSelect={reportSelectionContext}
        data-placeholder="Paste or type your script here…"
        className={surfaceClass}
        style={{ minHeight }}
      />
    </div>
  );
}
