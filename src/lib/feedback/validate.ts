import { getAllToolSlugs, type ToolSlug } from "@/lib/tools/registry";

export type FeedbackSentiment = "positive" | "neutral" | "negative";
export type FeedbackToolSlug = ToolSlug | "general";

export interface FeedbackPayload {
  toolSlug?: string;
  sentiment?: string;
  message?: string;
  website?: string;
  pagePath?: string;
}

export interface ParsedFeedback {
  toolSlug: FeedbackToolSlug;
  sentiment: FeedbackSentiment;
  message: string | null;
  pagePath: string | null;
  isHoneypot: boolean;
}

const VALID_SENTIMENTS = new Set<FeedbackSentiment>([
  "positive",
  "neutral",
  "negative",
]);

const VALID_TOOL_SLUGS = new Set<string>(["general", ...getAllToolSlugs()]);

export function parseFeedbackPayload(body: FeedbackPayload): ParsedFeedback | null {
  const isHoneypot = Boolean(body.website?.trim());

  const sentiment = body.sentiment?.trim();
  if (!sentiment || !VALID_SENTIMENTS.has(sentiment as FeedbackSentiment)) {
    return null;
  }

  const rawToolSlug = body.toolSlug?.trim() || "general";
  if (!VALID_TOOL_SLUGS.has(rawToolSlug)) {
    return null;
  }

  const message = body.message?.trim() ?? null;
  if (message && message.length > 1000) {
    return null;
  }

  const pagePath = body.pagePath?.trim() || null;
  if (pagePath && pagePath.length > 500) {
    return null;
  }

  return {
    toolSlug: rawToolSlug as FeedbackToolSlug,
    sentiment: sentiment as FeedbackSentiment,
    message,
    pagePath,
    isHoneypot,
  };
}

export function pagePathFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).pathname;
  } catch {
    return null;
  }
}

export function sentimentPlaceholder(sentiment: FeedbackSentiment): string {
  switch (sentiment) {
    case "positive":
      return "What did you like? (optional)";
    case "neutral":
      return "What could be better? (optional)";
    case "negative":
      return "What went wrong? (optional)";
  }
}
