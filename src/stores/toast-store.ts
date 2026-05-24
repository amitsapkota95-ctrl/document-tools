import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  pushToast: (type: ToastType, message: string, durationMs?: number) => void;
  dismissToast: (id: string) => void;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  pushToast: (type, message, durationMs = 5000) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));

    const existing = timers.get(id);
    if (existing) clearTimeout(existing);

    timers.set(
      id,
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        timers.delete(id);
      }, durationMs),
    );
  },
  dismissToast: (id) => {
    const existing = timers.get(id);
    if (existing) {
      clearTimeout(existing);
      timers.delete(id);
    }
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
