"use client";

import { useEffect, useState } from "react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { ToolButton } from "@/components/tools/ToolButton";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { usePdfPasswordUnlock } from "@/hooks/usePdfPasswordUnlock";
import { useHeroFileImport } from "@/hooks/useHeroFileImport";
import { estimateCompressedSize } from "@/lib/pdf/compress-preview";
import { analyzePdfStructure, type PdfDiagnostics } from "@/lib/pdf/pdf-diagnostics";
import { downloadBytes, sanitizeFilename } from "@/lib/pdf/download";
import { renderPdfPageThumbnail } from "@/lib/pdf/thumbnails";
import { compressPdfInWorker } from "@/lib/workers/compress-client";
import { TOOL_SIDEBAR_CTA_CLASS } from "@/lib/ui/classes";
import { useProcessingStore } from "@/stores/processing-store";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSegmentBytes(totalBytes: number, pct: number): string {
  const bytes = Math.round((totalBytes * pct) / 100);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DiagnosticsChart({ diag }: { diag: PdfDiagnostics }) {
  const segments = [
    { label: "Images", pct: diag.imagesPct, color: "bg-forest-500" },
    { label: "Fonts", pct: diag.fontsPct, color: "bg-forest" },
    { label: "Metadata", pct: diag.metadataPct, color: "bg-amber-400" },
    { label: "Text", pct: diag.textPct, color: "bg-forest-200" },
  ];

  return (
    <div
      className="rounded-xl border border-cream-300 bg-cream-200/50 px-3 py-3"
      role="group"
      aria-label="PDF storage breakdown"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-forest-600">File breakdown</p>
      <div
        className="mt-2 flex h-2.5 overflow-hidden rounded-full border border-cream-300"
        role="img"
        aria-label={segments.map((segment) => `${segment.label} ${segment.pct}%`).join(", ")}
      >
        {segments.map((segment) =>
          segment.pct > 0 ? (
            <div
              key={segment.label}
              className={`${segment.color} transition-all`}
              style={{ width: `${segment.pct}%` }}
              title={`${segment.label}: ${segment.pct}%`}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className="flex min-w-0 items-center gap-1.5 text-[11px] text-ink/60"
          >
            <span className={`h-2 w-2 shrink-0 rounded-sm ${segment.color}`} aria-hidden />
            <span className="truncate">
              {segment.label} {formatSegmentBytes(diag.totalBytes, segment.pct)} ({segment.pct}%)
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-ink/50">
        {diag.imageCount} image{diag.imageCount !== 1 ? "s" : ""}, {diag.fontCount} font
        {diag.fontCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>();
  const [quality, setQuality] = useState(75);
  const [crushImages, setCrushImages] = useState(true);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [imageDpi, setImageDpi] = useState(72);
  const [diagnostics, setDiagnostics] = useState<PdfDiagnostics | null>(null);
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null);
  const [pagePreviewLoading, setPagePreviewLoading] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimateMayIncrease, setEstimateMayIncrease] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const { tryUnlock, modal } = usePdfPasswordUnlock();
  const { status, progress, message, setProcessing, setProgress, setDone, setError, reset } =
    useProcessingStore();

  const qualityNorm = quality / 100;

  useEffect(() => {
    if (!file) {
      setEstimate(null);
      setEstimateMayIncrease(false);
      return;
    }

    let cancelled = false;
    setEstimating(true);

    const timer = setTimeout(async () => {
      try {
        const result = await estimateCompressedSize(file, {
          quality: qualityNorm,
          crushImages,
          stripMetadata,
          imageDpi,
          password: pdfPassword,
          diagnostics,
        });
        if (!cancelled) {
          setEstimate(result.estimatedBytes);
          setEstimateMayIncrease(result.mayIncrease);
        }
      } catch {
        if (!cancelled) {
          setEstimate(null);
          setEstimateMayIncrease(false);
        }
      } finally {
        if (!cancelled) setEstimating(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [file, qualityNorm, crushImages, stripMetadata, imageDpi, pdfPassword, diagnostics]);

  useEffect(() => {
    if (!file) {
      setPagePreviewUrl(null);
      setPagePreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPagePreviewLoading(true);

    renderPdfPageThumbnail(file, 0, 0.55, pdfPassword)
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
    reset();

    const bytes = await unlocked.file.arrayBuffer();
    const diag = await analyzePdfStructure(bytes);
    setDiagnostics(diag);
  };

  useHeroFileImport("compress-pdf", handleFile);

  const compress = async () => {
    if (!file) return;
    reset();
    setProcessing("Preparing your file…");

    try {
      const bytes = await file.arrayBuffer();
      const result = await compressPdfInWorker(
        bytes,
        qualityNorm,
        { crushImages, stripMetadata, imageDpi },
        pdfPassword,
        (value, msg) => setProgress(value, msg),
      );
      const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ""));
      downloadBytes(new Uint8Array(result), `${baseName}-smaller.pdf`, "application/pdf");

      const saved = Math.max(0, file.size - result.byteLength);
      const pct = file.size > 0 ? Math.round((saved / file.size) * 100) : 0;
      setDone(`Original: ${formatSize(file.size)} → New: ${formatSize(result.byteLength)} (Saved ${pct}%)`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Something went wrong. Try a different PDF.";
      setError(detail);
    }
  };

  return (
    <>
      <ToolWorkflowLayout
        hasFiles={!!file}
        sidebarLabel="Settings"
        upload={
          <FileUploader
            onFiles={handleFile}
            accept={{ "application/pdf": [".pdf"] }}
            label="Drop PDF files here"
            hint="We'll reduce the file size on your device"
          />
        }
        workspace={
          file ? (
            <div className="flex w-full max-w-xl flex-col items-center gap-3 self-center">
              <p className="text-sm font-semibold text-forest-700">First page preview</p>
              {pagePreviewLoading ? (
                <p className="py-12 text-center text-sm text-ink/60">Loading preview…</p>
              ) : pagePreviewUrl ? (
                <div className="w-full overflow-hidden rounded-xl border border-cream-300 bg-cream shadow-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pagePreviewUrl}
                    alt={`Preview of ${file.name}`}
                    className="h-auto w-full"
                  />
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-ink/60">Preview unavailable for this PDF.</p>
              )}
            </div>
          ) : null
        }
        sidebar={
          file ? (
            <>
              <ToolSidebarFileControls
                mode="single"
                accept={{ "application/pdf": [".pdf"] }}
                onReplace={handleFile}
                disabled={status === "processing"}
                replaceLabel="Replace PDF"
              />

              <p className="text-sm text-ink/60">
                {file.name} — {formatSize(file.size)}
              </p>

              {diagnostics ? <DiagnosticsChart diag={diagnostics} /> : null}

            <ClientOnly
              fallback={
                <div className="block space-y-2">
                  <span className="text-sm font-semibold">Quality: {quality}%</span>
                  <div className="h-2 w-full rounded-full bg-cream-200" aria-hidden />
                </div>
              }
            >
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Quality: {quality}%</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-forest-600"
                  disabled={!file}
                />
                <span className="block text-xs font-normal text-ink/50">
                  Higher keeps better quality. Lower creates a smaller file.
                </span>
              </label>
            </ClientOnly>

            {estimate !== null || estimating ? (
              <p className="rounded-xl border border-cream-300 bg-cream-200/80 px-4 py-3 text-sm text-forest-700 shadow-paper">
                {estimating ? (
                  <>Calculating new file size…</>
                ) : (
                  <>
                    Estimated new size: <strong>~{formatSize(estimate!)}</strong>
                    {file && estimate !== null ? (
                      <span className="text-ink/50">
                        {" "}
                        (from {formatSize(file.size)}
                        {estimate < file.size
                          ? `, about ${Math.round((1 - estimate / file.size) * 100)}% smaller`
                          : null}
                        )
                      </span>
                    ) : null}
                    {estimateMayIncrease ? (
                      <span className="mt-1 block text-xs text-amber-700">
                        Text-only PDFs may not shrink much when photos inside pages are reduced.
                      </span>
                    ) : null}
                  </>
                )}
              </p>
            ) : null}

            <ClientOnly
              fallback={
                <div className="rounded-xl border-2 border-dashed border-cream-300 bg-cream-200/50 px-4 py-3 text-sm text-ink/60">
                  Loading options…
                </div>
              }
            >
              <AdvancedToolsToggle variant="sidebar" label="More options">
                <label className="flex items-start gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={crushImages}
                    onChange={(e) => setCrushImages(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-forest-600"
                  />
                  <span>
                    Reduce photos inside the PDF
                    <span className="mt-1 block text-xs font-normal text-ink/50">
                      Best for scanned documents and image-heavy files.
                    </span>
                  </span>
                </label>
                <label className="block text-sm font-semibold">
                  Photo detail: {imageDpi}
                  <input
                    type="range"
                    min={36}
                    max={150}
                    value={imageDpi}
                    onChange={(e) => setImageDpi(Number(e.target.value))}
                    className="mt-1 w-full accent-forest-600"
                    disabled={!crushImages}
                  />
                  <span className="mt-1 block text-xs font-normal text-ink/50">
                    Lower detail means a smaller download. The default works for most files.
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={stripMetadata}
                    onChange={(e) => setStripMetadata(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-forest-600"
                  />
                  <span>
                    Remove hidden file info
                    <span className="mt-1 block text-xs font-normal text-ink/50">
                      Clears author, dates, and other background details you cannot see on the page.
                    </span>
                  </span>
                </label>
              </AdvancedToolsToggle>
            </ClientOnly>

            {status === "processing" ? <ProgressBar progress={progress} label={message} /> : null}

            <div className={TOOL_SIDEBAR_CTA_CLASS}>
              <ToolButton
                onClick={compress}
                disabled={!file || status === "processing"}
                className="w-full"
              >
                Download File
              </ToolButton>
            </div>
          </>
          ) : null
        }
      />
      {modal}
    </>
  );
}
