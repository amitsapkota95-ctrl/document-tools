"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CARD_CLASS } from "@/lib/ui/classes";

export function QrScanPanel() {
  const [scanResult, setScanResult] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );

    scanner.render((decoded) => setScanResult(decoded), () => {});
    scannerRef.current = scanner;
    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="rounded-xl border border-cream-300 shadow-paper" />
      {scanResult ? (
        <div className={`${CARD_CLASS} bg-cream-200/80 p-4`}>
          <p className="text-sm font-semibold">Scanned result</p>
          <p className="mt-1 break-all text-sm">{scanResult}</p>
        </div>
      ) : (
        <p className="text-sm text-ink/60">Point your camera at a QR code</p>
      )}
    </div>
  );
}
