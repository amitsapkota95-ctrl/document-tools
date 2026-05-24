/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from "@/lib/workers/create-worker";

interface CompressPayload {
  pdfBytes: ArrayBuffer;
  quality: number;
  password?: string;
  crushImages: boolean;
  stripMetadata: boolean;
  imageDpi: number;
}

interface CompressResult {
  bytes: ArrayBuffer;
}

self.onmessage = async (event: MessageEvent<WorkerRequest<CompressPayload>>) => {
  const { id, payload } = event.data;

  try {
    const { PDFDocument } = await import("pdf-lib");

    if (!payload.crushImages) {
      const doc = await PDFDocument.load(payload.pdfBytes, { ignoreEncryption: true });
      if (payload.stripMetadata) {
        doc.setTitle("");
        doc.setAuthor("");
        doc.setSubject("");
        doc.setKeywords([]);
        doc.setProducer("paperless.tools");
        doc.setCreator("paperless.tools");
      }
      const saved = await doc.save({ useObjectStreams: true });
      self.postMessage({
        id,
        result: { bytes: saved.slice().buffer },
      } satisfies WorkerResponse<CompressResult>);
      return;
    }

    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const pdf = await pdfjs.getDocument({ data: payload.pdfBytes, password: payload.password }).promise;
    const total = pdf.numPages;
    const outDoc = await PDFDocument.create();

    const scale = payload.imageDpi / 72;
    const jpegQuality = 0.3 + payload.quality * 0.7;

    for (let i = 1; i <= total; i++) {
      self.postMessage({
        id,
        progress: {
          value: Math.round((i / total) * 90),
          message: `Compressing page ${i} of ${total}…`,
        },
      } satisfies WorkerResponse);

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: Math.max(0.5, scale) });
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d")!;
      await page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      }).promise;

      const jpegBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: jpegQuality });
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      const embedded = await outDoc.embedJpg(jpegBytes);
      const outPage = outDoc.addPage([viewport.width, viewport.height]);
      outPage.drawImage(embedded, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }

    if (payload.stripMetadata) {
      outDoc.setProducer("paperless.tools");
      outDoc.setCreator("paperless.tools");
    }

    const saved = await outDoc.save({ useObjectStreams: true });

    self.postMessage({
      id,
      result: { bytes: saved.slice().buffer },
    } satisfies WorkerResponse<CompressResult>);
  } catch (err) {
    self.postMessage({
      id,
      error: err instanceof Error ? err.message : "Compression failed",
    } satisfies WorkerResponse);
  }
};

export type { CompressPayload, CompressResult };
