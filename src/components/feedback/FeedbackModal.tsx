"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThumbsDown, ThumbsUp, Meh } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ToolButton } from "@/components/tools/ToolButton";
import {
  sentimentPlaceholder,
  type FeedbackSentiment,
  type FeedbackToolSlug,
} from "@/lib/feedback/validate";
import { getToolBySlug } from "@/lib/tools/registry";

interface FeedbackModalProps {
  open: boolean;
  toolSlug: FeedbackToolSlug;
  onClose: () => void;
}

const SENTIMENT_OPTIONS: {
  value: FeedbackSentiment;
  label: string;
  icon: typeof ThumbsUp;
}[] = [
  { value: "positive", label: "Great", icon: ThumbsUp },
  { value: "neutral", label: "Okay", icon: Meh },
  { value: "negative", label: "Needs work", icon: ThumbsDown },
];

export function FeedbackModal({ open, toolSlug, onClose }: FeedbackModalProps) {
  const pathname = usePathname();
  const [sentiment, setSentiment] = useState<FeedbackSentiment | null>(null);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tool = toolSlug !== "general" ? getToolBySlug(toolSlug) : null;
  const title = tool ? `Feedback on ${tool.title}` : "Send feedback";

  useEffect(() => {
    if (!submitted) return;
    const timer = window.setTimeout(onClose, 2000);
    return () => window.clearTimeout(timer);
  }, [submitted, onClose]);

  async function handleSubmit() {
    if (!sentiment || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolSlug,
          sentiment,
          message: message.trim() || undefined,
          website,
          pagePath: pathname,
        }),
      });

      if (!res.ok) {
        throw new Error("Could not send feedback.");
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Modal open={open} title="Thank you" onClose={onClose}>
        <p className="text-sm leading-relaxed text-ink/60">
          Thanks — we read every note.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      actions={
        <ToolButton
          type="button"
          disabled={!sentiment || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Sending…" : "Send feedback"}
        </ToolButton>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-3 text-sm font-bold text-forest-700">How was it?</p>
          <div className="grid grid-cols-3 gap-2">
            {SENTIMENT_OPTIONS.map(({ value, label, icon: Icon }) => {
              const selected = sentiment === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSentiment(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-semibold transition-colors ${
                    selected
                      ? "border-forest-500 bg-forest-50 text-forest-700"
                      : "border-cream-300 bg-white text-ink/60 hover:border-forest-200 hover:bg-forest-50/50"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {sentiment ? (
          <div>
            <label htmlFor="feedback-message" className="sr-only">
              Optional message
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={sentimentPlaceholder(sentiment)}
              rows={3}
              maxLength={1000}
              className="w-full resize-none rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/30"
            />
          </div>
        ) : null}

        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
        />

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </Modal>
  );
}
