/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from "@/lib/workers/create-worker";
import { mergePdfsWithToc } from "@/lib/pdf/merge-with-toc";

interface MergePayload {
  files: Array<{ bytes: ArrayBuffer; name: string; password?: string }>;
  addToc: boolean;
}

interface MergeResult {
  bytes: ArrayBuffer;
}

self.onmessage = async (event: MessageEvent<WorkerRequest<MergePayload>>) => {
  const { id, payload } = event.data;

  try {
    self.postMessage({
      id,
      progress: { value: 10, message: "Structuring documents…" },
    } satisfies WorkerResponse);

    let result: Uint8Array;

    if (payload.addToc && payload.files.length > 1) {
      result = await mergePdfsWithToc(payload.files);
    } else {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();

      for (let i = 0; i < payload.files.length; i++) {
        self.postMessage({
          id,
          progress: {
            value: Math.round(((i + 1) / payload.files.length) * 90),
            message: `Adding file ${i + 1} of ${payload.files.length}…`,
          },
        } satisfies WorkerResponse);

        const file = payload.files[i];
        const doc = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }

      result = await merged.save();
    }

    self.postMessage({
      id,
      result: { bytes: result.slice().buffer },
    } satisfies WorkerResponse<MergeResult>);
  } catch (err) {
    self.postMessage({
      id,
      error: err instanceof Error ? err.message : "Merge failed",
    } satisfies WorkerResponse);
  }
};

export type { MergePayload, MergeResult };
