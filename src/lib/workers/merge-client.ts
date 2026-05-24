import { createWorkerClient } from "@/lib/workers/create-worker";
import type { MergeResult } from "@/workers/pdf-merge.worker";

let mergeClient: ReturnType<typeof createWorkerClient> | null = null;

function getMergeClient() {
  if (!mergeClient) {
    mergeClient = createWorkerClient(
      new URL("../../workers/pdf-merge.worker.ts", import.meta.url),
    );
  }
  return mergeClient;
}

export async function mergePdfsInWorker(
  files: Array<{ bytes: ArrayBuffer; name: string; password?: string }>,
  addToc: boolean,
  onProgress?: (value: number, message?: string) => void,
): Promise<ArrayBuffer> {
  const client = getMergeClient();
  const result = await client.post<
    { files: Array<{ bytes: ArrayBuffer; name: string; password?: string }>; addToc: boolean },
    MergeResult
  >("merge", { files, addToc }, onProgress);
  return result.bytes;
}
