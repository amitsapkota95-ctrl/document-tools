"use client";

import { MessageSquare } from "lucide-react";
import { useFeedbackOptional } from "@/contexts/feedback-context";

interface FeedbackTriggerProps {
  variant?: "link" | "floating";
  className?: string;
}

export function FeedbackTrigger({
  variant = "link",
  className = "",
}: FeedbackTriggerProps) {
  const ctx = useFeedbackOptional();
  if (!ctx) return null;

  if (variant === "floating") {
    return (
      <button
        type="button"
        onClick={ctx.openFeedback}
        className={`fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white/95 px-4 py-2.5 text-sm font-bold text-forest-700 shadow-paper-lg backdrop-blur-sm transition-colors hover:border-forest-200 hover:bg-forest-50 ${className}`}
        aria-label="Send feedback"
      >
        <MessageSquare className="h-4 w-4 text-forest-500" aria-hidden />
        Feedback
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={ctx.openFeedback}
      className={`text-sm font-semibold text-forest-500 underline-offset-2 hover:underline ${className}`}
    >
      Send feedback
    </button>
  );
}
