"use client";

import { useState } from "react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { TAB_ACTIVE, TAB_INACTIVE } from "@/lib/ui/classes";
import { type QrContentType } from "@/lib/qr/types";
import { QrExportPanel } from "./components/QrExportPanel";
import { QrFormFields } from "./components/QrFormFields";
import { QrPreview } from "./components/QrPreview";
import { QrScanPanel } from "./components/QrScanPanel";
import { QrTypeSelector, QrTypeTabs } from "./components/QrTypeSelector";
import { useQrGeneratorState } from "./useQrGeneratorState";

type Mode = "create" | "scan";

export default function QrToolsTool() {
  const [mode, setMode] = useState<Mode>("create");
  const qr = useQrGeneratorState();

  const switchType = (type: QrContentType) => {
    qr.selectType(type);
  };

  const hasCreateSession = mode === "create" && qr.contentType !== null;

  return (
    <ToolWorkflowLayout
      hasFiles={mode === "scan" || hasCreateSession}
      sidebarLabel="QR options"
      wideUpload
      upload={
        mode === "create" ? (
          <QrTypeSelector onSelect={switchType} />
        ) : (
          <div className="space-y-3 text-center">
            <h2 className="font-serif text-xl font-semibold text-forest-700">Scan a QR code</h2>
            <p className="text-sm text-ink/60">
              Use your device camera to read any QR code. Switch back to Create mode in the sidebar
              to generate a new one.
            </p>
          </div>
        )
      }
      workspace={
        mode === "create" && qr.form ? (
          <QrPreview
            encoded={qr.encoded}
            errorCorrectionLevel={qr.errorCorrectionLevel}
            style={qr.style}
          />
        ) : mode === "scan" ? (
          <QrScanPanel />
        ) : null
      }
      sidebar={
        <>
          <div className="flex flex-col gap-2">
            {(["create", "scan"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-sm font-semibold ${mode === m ? TAB_ACTIVE : TAB_INACTIVE}`}
              >
                {m === "create" ? "Create QR Code" : "Scan QR Code"}
              </button>
            ))}
          </div>

          {mode === "create" && qr.contentType && qr.form ? (
            <>
              <QrTypeTabs
                active={qr.contentType}
                onChange={(type) => {
                  if (type !== qr.contentType) {
                    qr.selectType(type);
                  }
                }}
              />

              <QrFormFields form={qr.form} updateField={qr.updateField} />

              <QrExportPanel
                encoded={qr.encoded}
                style={qr.style}
                exporting={qr.exporting}
                updateStyle={qr.updateStyle}
                copyPayload={qr.copyPayload}
                runExport={qr.runExport}
              />
            </>
          ) : null}
        </>
      }
    />
  );
}
