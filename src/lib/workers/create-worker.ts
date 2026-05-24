export interface WorkerRequest<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

export interface WorkerResponse<R = unknown> {
  id: string;
  progress?: { value: number; message?: string };
  result?: R;
  error?: string;
}

export function createWorkerClient(workerUrl: URL) {
  const worker = new Worker(workerUrl, { type: "module" });
  const pending = new Map<
    string,
    {
      resolve: (value: WorkerResponse) => void;
      reject: (reason: Error) => void;
      onProgress?: (value: number, message?: string) => void;
    }
  >();

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const msg = event.data;
    const entry = pending.get(msg.id);
    if (!entry) return;

    if (msg.progress !== undefined) {
      entry.onProgress?.(msg.progress.value, msg.progress.message);
      return;
    }

    pending.delete(msg.id);
    if (msg.error) {
      entry.reject(new Error(msg.error));
    } else {
      entry.resolve(msg);
    }
  };

  worker.onerror = () => {
    for (const [, entry] of pending) {
      entry.reject(new Error("Worker failed"));
    }
    pending.clear();
  };

  return {
    post<T, R>(
      type: string,
      payload: T,
      onProgress?: (value: number, message?: string) => void,
    ): Promise<R> {
      const id = crypto.randomUUID();
      return new Promise((resolve, reject) => {
        pending.set(id, {
          resolve: (msg) => resolve(msg.result as R),
          reject,
          onProgress,
        });
        worker.postMessage({ id, type, payload } satisfies WorkerRequest<T>);
      });
    },
    terminate: () => worker.terminate(),
  };
}
