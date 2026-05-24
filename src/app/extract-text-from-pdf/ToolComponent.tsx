"use client";

import { useEffect, useState } from "react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import { FileUploader } from "@/components/tools/FileUploader";
import { OcrOverlayViewer, type OcrWord } from "@/components/tools/OcrOverlayViewer";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { ToolButton } from "@/components/tools/ToolButton";
import { usePdfPasswordUnlock } from "@/hooks/usePdfPasswordUnlock";
import { useHeroFileImport } from "@/hooks/useHeroFileImport";
import { INPUT_CLASS, TOOL_SIDEBAR_CTA_CLASS } from "@/lib/ui/classes";
import { exportTextToDocx } from "@/lib/pdf/docx-export";
import { downloadBlob } from "@/lib/pdf/download";
import { extractTextFromPdf, mapScanError } from "@/lib/pdf/ocr-scan";
import { renderPdfPageThumbnail } from "@/lib/pdf/thumbnails";
import { useProcessingStore } from "@/stores/processing-store";

const LANGUAGES = [
  { code: "eng", label: "English" },
  { code: "spa", label: "Spanish" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
];

interface PageOverlay {
  imageUrl: string;
  words: OcrWord[];
  scale: number;
  pageWidth: number;
  pageHeight: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExtractTextTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>();
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null);
  const [pagePreviewLoading, setPagePreviewLoading] = useState(false);
  const [overlays, setOverlays] = useState<PageOverlay[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [language, setLanguage] = useState("eng");
  const [text, setText] = useState("");
  const [scanComplete, setScanComplete] = useState(false);
  const [extractionNote, setExtractionNote] = useState<string | null>(null);
  const { tryUnlock, modal } = usePdfPasswordUnlock();
  const { status, progress, message, error, setProcessing, setProgress, setDone, setError, reset } =
    useProcessingStore();

  const hasExtractedText = scanComplete;
  const sourcePreviewUrl =
    overlays.length > 0 ? overlays[activePage]?.imageUrl : pagePreviewUrl;

  useEffect(() => {
    if (!file) {
      setPagePreviewUrl(null);
      setPagePreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPagePreviewLoading(true);

    renderPdfPageThumbnail(file, 0, 0.4, pdfPassword)
      .then((url) => {
        if (!cancelled) setPagePreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPagePreviewUrl(null);
      })
      .finally(() => {
        if (!cancelled) setPagePreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file, pdfPassword]);

  const handleFile = async (files: File[]) => {
    const unlocked = await tryUnlock(files[0]);
    if (!unlocked) return;
    setFile(unlocked.file);
    setPdfPassword(unlocked.password);
    setText("");
    setScanComplete(false);
    setOverlays([]);
    setExtractionNote(null);
    setActivePage(0);
    reset();
  };

  useHeroFileImport("extract-text-from-pdf", handleFile);

  const scan = async () => {
    if (!file) return;
    reset();
    setProcessing("Preparing scanner…");

    try {
      const result = await extractTextFromPdf(file, language, pdfPassword, (value, msg) =>
        setProgress(value, msg),
      );

      if (!result.fullText.trim()) {
        throw new Error("No text found. Try a clearer scan or a different language.");
      }

      if (result.method === "ocr") {
        setOverlays(
          result.pages.map((page) => ({
            imageUrl: page.imageUrl,
            words: page.words,
            scale: 1,
            pageWidth: page.pageWidth,
            pageHeight: page.pageHeight,
          })),
        );
        setActivePage(0);
        setExtractionNote(null);
        setDone("Scan complete!");
      } else {
        setOverlays([]);
        setExtractionNote("Extracted existing text from the PDF (no OCR needed).");
        setDone("Text extracted!");
      }

      setText(result.fullText);
      setScanComplete(true);
    } catch (err) {
      setError(mapScanError(err));
    }
  };

  const exportDocx = async () => {
    if (!text.trim()) return;
    const blob = await exportTextToDocx(text);
    downloadBlob(blob, "extracted-document.docx");
  };

  const sidebarControls = file ? (
    <>
      <ToolSidebarFileControls
        mode="single"
        accept={{ "application/pdf": [".pdf"] }}
        onReplace={handleFile}
        disabled={status === "processing"}
        replaceLabel="Replace PDF"
      />

      <label className="block text-sm font-semibold">
        Document language
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className={`${INPUT_CLASS} mt-1`}
          disabled={status === "processing"}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </label>

      {status === "processing" ? <ProgressBar progress={progress} label={message} /> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className={hasExtractedText ? undefined : TOOL_SIDEBAR_CTA_CLASS}>
        <ToolButton
          onClick={scan}
          disabled={!file || status === "processing"}
          className="w-full"
          variant={hasExtractedText ? "secondary" : "primary"}
        >
          {hasExtractedText ? "Scan Again" : "Scan for Text"}
        </ToolButton>
      </div>
    </>
  ) : null;

  return (
    <>
      <ToolWorkflowLayout
        hasFiles={!!file}
        sidebarLabel={hasExtractedText ? "Source document" : "Scan options"}
        upload={
          <FileUploader
            onFiles={handleFile}
            accept={{ "application/pdf": [".pdf"] }}
            label="Drop PDF files here"
            hint="Works best on scanned documents"
          />
        }
        workspace={
          file ? (
            hasExtractedText ? (
              <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
                <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-forest-700">Extracted text</h2>
                    {extractionNote ? (
                      <p className="mt-1 text-sm text-ink/60">{extractionNote}</p>
                    ) : (
                      <p className="mt-1 text-sm text-ink/60">
                        Edit the text below, then copy or export your changes to Word.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ToolButton
                      variant="secondary"
                      onClick={() => navigator.clipboard.writeText(text)}
                      disabled={!text.trim()}
                    >
                      Copy to Clipboard
                    </ToolButton>
                    <ToolButton
                      variant="secondary"
                      onClick={exportDocx}
                      disabled={!text.trim()}
                    >
                      Export as Word (.docx)
                    </ToolButton>
                  </div>
                </div>

                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  spellCheck
                  className={`${INPUT_CLASS} min-h-[calc(100vh-14rem)] flex-1 resize-y font-mono text-sm leading-relaxed`}
                />
              </div>
            ) : (
              <div className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center gap-6 px-4 py-8">
                <div className="max-w-lg text-center">
                  <p className="text-lg font-bold text-forest-700">Your PDF is ready to scan</p>
                  <p className="mt-2 text-sm text-ink/60">
                    Choose the document language in the sidebar, then scan to extract the text.
                  </p>
                </div>

                {pagePreviewLoading ? (
                  <p className="text-sm text-ink/60">Loading preview…</p>
                ) : pagePreviewUrl ? (
                  <div className="w-full max-w-xs overflow-hidden rounded-xl border border-cream-300 bg-cream shadow-paper sm:max-w-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pagePreviewUrl}
                      alt={`Preview of ${file.name}`}
                      className="h-auto max-h-[45vh] w-full object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-ink/60">Preview unavailable for this PDF.</p>
                )}

                <div className="max-w-sm text-center">
                  <p className="truncate text-sm font-semibold text-forest-700">{file.name}</p>
                  <p className="mt-1 text-xs text-ink/50">{formatSize(file.size)}</p>
                </div>
              </div>
            )
          ) : null
        }
        sidebar={
          file ? (
            <>
              {hasExtractedText ? (
                <div className="space-y-3 border-b border-cream-300 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
                    Source document
                  </p>
                  <p className="truncate text-sm font-semibold text-forest-700">{file.name}</p>
                  <p className="text-xs text-ink/50">{formatSize(file.size)}</p>

                  {overlays.length > 1 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {overlays.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActivePage(index)}
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                            activePage === index
                              ? "border border-forest bg-forest text-cream"
                              : "border border-cream-300 bg-cream-200 text-forest-700"
                          }`}
                        >
                          Page {index + 1}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {sourcePreviewUrl ? (
                    overlays.length > 0 ? (
                      <OcrOverlayViewer
                        imageUrl={overlays[activePage].imageUrl}
                        words={overlays[activePage].words}
                        scale={overlays[activePage].scale}
                        className="max-h-52 border shadow-none"
                      />
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-cream-300 bg-cream">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sourcePreviewUrl}
                          alt={`Preview of ${file.name}`}
                          className="h-auto max-h-52 w-full object-contain"
                        />
                      </div>
                    )
                  ) : null}

                  <p className="text-[11px] leading-relaxed text-ink/50">
                    Reference only — highlight text here to double-check the scan.
                  </p>
                </div>
              ) : null}

              {sidebarControls}
            </>
          ) : null
        }
      />
      {modal}
    </>
  );
}
