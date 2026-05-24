"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/toast-store";

const TYPE_STYLES: Record<ToastType, { frame: string; icon: typeof CheckCircle2 }> = {
  success: {
    frame: "border-forest-200 bg-white text-ink",
    icon: CheckCircle2,
  },
  error: {
    frame: "border-rose-200 bg-rose-50/95 text-ink",
    icon: CircleAlert,
  },
  info: {
    frame: "border-cream-300 bg-white text-ink",
    icon: Info,
  },
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-forest-600",
  error: "text-rose-600",
  info: "text-forest-500",
};

export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-6 right-6 z-[100] flex max-w-sm flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type];
        const Icon = style.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-slide-in-right flex items-start gap-3 rounded-xl border px-4 py-3 shadow-paper ${style.frame}`}
            role="status"
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ICON_COLORS[toast.type]}`} aria-hidden />
            <p className="flex-1 text-xs font-semibold leading-relaxed">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-full p-0.5 text-ink/40 transition-colors hover:bg-cream-200 hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
