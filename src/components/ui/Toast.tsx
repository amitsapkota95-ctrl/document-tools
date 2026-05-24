"use client";

import { X } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/toast-store";

const TYPE_STYLES: Record<ToastType, string> = {
  success: "border-sage bg-forest text-cream",
  error: "border-red-400 bg-red-950 text-red-50",
  info: "border-moss-dark bg-forest-muted text-cream",
};

export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-fade-up flex items-start gap-3 rounded-lg border-2 px-4 py-3 shadow-eco-lg ${TYPE_STYLES[toast.type]}`}
          role="status"
        >
          <p className="flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 rounded border border-current/30 p-0.5 opacity-80 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
