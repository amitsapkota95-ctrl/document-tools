"use client";

import { useState } from "react";
import { Copy, FileDown } from "lucide-react";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { ImageUploader } from "@/components/tools/ImageUploader";
import { ToolButton } from "@/components/tools/ToolButton";
import { INPUT_CLASS, TOOL_SIDEBAR_CTA_CLASS } from "@/lib/ui/classes";
import type { QrExportSize, QrPdfCardSize, QrStyleOptions } from "@/lib/qr/types";
import type { QrGeneratorState } from "../useQrGeneratorState";

interface QrExportPanelProps {
  encoded: QrGeneratorState["encoded"];
  style: QrStyleOptions;
  exporting: boolean;
  updateStyle: QrGeneratorState["updateStyle"];
  copyPayload: QrGeneratorState["copyPayload"];
  runExport: QrGeneratorState["runExport"];
}

export function QrExportPanel({
  encoded,
  style,
  exporting,
  updateStyle,
  copyPayload,
  runExport,
}: QrExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const canExport = encoded.isValid && !exporting;

  const handleCopy = async () => {
    const ok = await copyPayload();
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <ImageUploader
        variant="compact"
        label="Center logo (optional)"
        hint="PNG or JPG — appears in the middle of your QR code"
        imageUrl={style.logoUrl}
        onImage={(dataUrl) => updateStyle("logoUrl", dataUrl)}
        onRemove={() => updateStyle("logoUrl", null)}
      />

      <AdvancedToolsToggle variant="sidebar" label="Advanced Tools">
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">
            Foreground
            <input
              type="color"
              value={style.foreground}
              onChange={(e) => updateStyle("foreground", e.target.value)}
              className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-moss-dark"
            />
          </label>
          <label className="block text-sm font-semibold">
            Background
            <input
              type="color"
              value={style.background}
              onChange={(e) => updateStyle("background", e.target.value)}
              className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-moss-dark"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold">
          Export resolution
          <select
            value={style.exportSize}
            onChange={(e) => updateStyle("exportSize", Number(e.target.value) as QrExportSize)}
            className={INPUT_CLASS}
          >
            <option value={256}>256 px</option>
            <option value={512}>512 px</option>
            <option value={1024}>1024 px</option>
          </select>
        </label>

        <label className="block text-sm font-semibold">
          PDF card size
          <select
            value={style.pdfCardSize}
            onChange={(e) => updateStyle("pdfCardSize", e.target.value as QrPdfCardSize)}
            className={INPUT_CLASS}
          >
            <option value="business">Business card (85 × 55 mm)</option>
            <option value="a6">A6 flyer (105 × 148 mm)</option>
          </select>
        </label>

        <ToolButton
          onClick={handleCopy}
          disabled={!canExport}
          variant="secondary"
          className="w-full"
        >
          <Copy className="mr-2 h-4 w-4" aria-hidden />
          {copied ? "Copied!" : "Copy encoded data"}
        </ToolButton>

        <p className="text-xs text-sand-light">
          PNG and JPG use your chosen resolution. SVG scales infinitely for print. PDF cards include
          a title and key details.
        </p>
      </AdvancedToolsToggle>

      <div className={`${TOOL_SIDEBAR_CTA_CLASS} space-y-2`}>
        <ToolButton
          onClick={() => runExport("png")}
          disabled={!canExport}
          className="w-full"
        >
          <FileDown className="mr-2 h-4 w-4" aria-hidden />
          Download PNG
        </ToolButton>
        <ToolButton
          onClick={() => runExport("jpg")}
          disabled={!canExport}
          variant="secondary"
          className="w-full"
        >
          <FileDown className="mr-2 h-4 w-4" aria-hidden />
          Download JPG
        </ToolButton>
        <ToolButton
          onClick={() => runExport("svg")}
          disabled={!canExport}
          variant="secondary"
          className="w-full"
        >
          <FileDown className="mr-2 h-4 w-4" aria-hidden />
          Download SVG
        </ToolButton>
        <ToolButton
          onClick={() => runExport("pdf")}
          disabled={!canExport}
          variant="secondary"
          className="w-full"
        >
          <FileDown className="mr-2 h-4 w-4" aria-hidden />
          Download PDF card
        </ToolButton>
      </div>
    </>
  );
}
