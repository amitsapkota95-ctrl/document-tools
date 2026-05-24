"use client";

import { memo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CARD_CLASS } from "@/lib/ui/classes";
import type { QrEncodeResult, QrStyleOptions } from "@/lib/qr/types";

interface QrPreviewProps {
  encoded: QrEncodeResult;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  style: QrStyleOptions;
}

function QrPreviewInner({ encoded, errorCorrectionLevel, style }: QrPreviewProps) {
  const charCount = encoded.payload.length;

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
      <div className={`${CARD_CLASS} relative inline-block p-5`}>
        {encoded.isValid && encoded.payload ? (
          <>
            <QRCodeSVG
              id="live-qr-code"
              value={encoded.payload}
              size={256}
              level={errorCorrectionLevel}
              fgColor={style.foreground}
              bgColor={style.background}
            />
            {style.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={style.logoUrl}
                alt="Logo"
                className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded bg-white p-1 object-contain"
              />
            ) : null}
          </>
        ) : (
          <div className="flex h-[256px] w-[256px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-cream-300/50 bg-cream-200/50 px-6 text-center">
            <p className="text-sm font-semibold text-forest-600">QR preview</p>
            <p className="text-sm text-ink/60">{encoded.hint}</p>
          </div>
        )}
      </div>

      <div className="max-w-md space-y-1 text-center">
        {encoded.title ? (
          <p className="text-sm font-semibold text-forest-700">{encoded.title}</p>
        ) : null}
        {encoded.isValid ? (
          <>
            <p className="text-xs text-ink/60">Scan this code with any QR reader app.</p>
            <p className="text-xs text-ink/50">
              {charCount} character{charCount === 1 ? "" : "s"}
              {charCount > 800 ? " — approaching capacity for dense codes" : ""}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export const QrPreview = memo(QrPreviewInner);
