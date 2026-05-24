"use client";

import { FeedbackProvider } from "@/contexts/feedback-context";
import { FeedbackTrigger } from "@/components/feedback/FeedbackTrigger";
import { ToastProvider } from "@/components/ui/Toast";

export function ClientProviders() {
  return (
    <FeedbackProvider>
      <ToastProvider />
      <FeedbackTrigger variant="floating" />
    </FeedbackProvider>
  );
}
