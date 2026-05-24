import { create } from "zustand";
import { useToastStore } from "@/stores/toast-store";

export type ProcessingStatus = "idle" | "processing" | "done" | "error";

interface ProcessingState {
  status: ProcessingStatus;
  progress: number;
  message: string;
  error: string | null;
  setProcessing: (message?: string) => void;
  setProgress: (progress: number, message?: string) => void;
  setDone: (message?: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useProcessingStore = create<ProcessingState>((set) => ({
  status: "idle",
  progress: 0,
  message: "",
  error: null,
  setProcessing: (message = "Working…") =>
    set({ status: "processing", progress: 0, message, error: null }),
  setProgress: (progress, message) =>
    set((state) => ({
      status: "processing",
      progress,
      message: message ?? state.message,
    })),
  setDone: (message = "Done!") => {
    useToastStore.getState().pushToast("success", message);
    set({ status: "done", progress: 100, message, error: null });
  },
  setError: (error) => {
    useToastStore.getState().pushToast("error", error);
    set({ status: "error", error, message: error });
  },
  reset: () =>
    set({ status: "idle", progress: 0, message: "", error: null }),
}));
