"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CircleArrowUp } from "lucide-react";
import { ToolPickerModal } from "@/components/landing/ToolPickerModal";
import { fileToDataUrl } from "@/lib/hero-import";

export function HeroDropzone() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    fileName: string;
    dataUrl: string;
    mimeType: string;
  } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setPendingFile({
      fileName: file.name,
      dataUrl,
      mimeType: file.type || "application/pdf",
    });
    setPickerOpen(true);
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    noClick: true,
  });

  return (
    <>
      <div
        {...getRootProps()}
        className={`group relative flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cream-400 bg-cream-200 p-8 text-center shadow-paper-lg transition-all duration-300 hover:border-forest-500 ${
          isDragActive ? "border-forest-500 bg-white" : ""
        }`}
      >
        <input {...getInputProps()} />

        <div className="pointer-events-none absolute h-48 w-48 rounded-full bg-forest-500/5 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-cream-300 bg-white text-forest-700 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-cream-400 group-hover:text-forest-500">
          <CircleArrowUp className="h-8 w-8" strokeWidth={2} aria-hidden />
        </div>

        <h3 className="relative mb-2 font-serif text-xl font-bold text-ink">Drop your PDF files here</h3>
        <p className="relative max-w-xs text-xs font-semibold leading-relaxed text-ink/50">
          Drag-and-drop your sheets to start immediately, or browse your local files.
        </p>

        <div className="relative mt-6 w-full max-w-xs">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              open();
            }}
            className="w-full rounded-xl bg-forest-700 px-4 py-2.5 text-xs font-bold text-cream-100 shadow-sm transition-all hover:bg-forest-600"
          >
            Choose Local File
          </button>
        </div>
      </div>

      {pendingFile ? (
        <ToolPickerModal
          open={pickerOpen}
          fileName={pendingFile.fileName}
          dataUrl={pendingFile.dataUrl}
          mimeType={pendingFile.mimeType}
          onClose={() => {
            setPickerOpen(false);
            setPendingFile(null);
          }}
        />
      ) : null}
    </>
  );
}
