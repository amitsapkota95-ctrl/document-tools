"use client";

import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { CloudUpload } from "lucide-react";

interface FileUploaderProps {
  onFiles: (files: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  label?: string;
  hint?: string;
  variant?: "default" | "compact";
  disabled?: boolean;
}

export function FileUploader({
  onFiles,
  accept,
  multiple = false,
  label = "Drop files here",
  hint = "or click to choose files from your device",
  variant = "default",
  disabled = false,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    multiple,
    disabled,
    noClick: variant === "default",
  });

  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed text-center transition-all duration-200 p-4 ${
          disabled
            ? "cursor-not-allowed border-cream-300 bg-cream-200/50 opacity-60"
            : `cursor-pointer ${
                isDragActive
                  ? "border-forest-500 bg-forest-50 text-forest-700 shadow-paper"
                  : "border-cream-300 bg-white text-forest-700 hover:border-forest-500 hover:bg-forest-50/50 hover:shadow-paper"
              }`
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-cream-200">
          <CloudUpload
            className={`h-4 w-4 ${isDragActive ? "text-forest-600" : "text-forest-500"}`}
            strokeWidth={2}
            aria-hidden
          />
        </div>
        <p className="text-sm font-bold text-forest-700">{label}</p>
        {hint ? (
          <p className={`mt-1 text-xs ${isDragActive ? "text-forest-600" : "text-ink/50"}`}>
            {hint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
        disabled
          ? "cursor-not-allowed border-cream-300 bg-white/50 opacity-60"
          : isDragActive
            ? "border-forest-500 bg-white shadow-paper-lg"
            : "border-cream-300 bg-white/50 hover:border-forest-500 hover:bg-white hover:shadow-paper"
      }`}
    >
      <input {...getInputProps()} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-500/5 to-transparent" />

      <div className="absolute h-64 w-64 rounded-full bg-forest-500/5 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cream-300 bg-cream-200 text-forest-700 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-cream-400 group-hover:text-forest-500">
        <CloudUpload className="h-8 w-8 animate-pulse" strokeWidth={2} aria-hidden />
      </div>

      <h3 className="relative font-serif text-2xl font-bold text-ink/90 transition-colors group-hover:text-ink">
        {label}
      </h3>
      <p className="relative mt-2 max-w-sm text-xs font-medium leading-relaxed text-ink/50">
        {hint}
      </p>

      <div className="relative mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
          className="rounded-xl border border-cream-300 bg-cream-200 px-5 py-2.5 text-xs font-bold text-forest-700 transition-all hover:bg-cream-300"
        >
          Choose File
        </button>
      </div>
    </div>
  );
}
