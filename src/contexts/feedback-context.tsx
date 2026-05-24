"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import type { FeedbackToolSlug } from "@/lib/feedback/validate";

interface FeedbackContextValue {
  toolSlug: FeedbackToolSlug;
  setToolSlug: (slug: FeedbackToolSlug) => void;
  openFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toolSlug, setToolSlug] = useState<FeedbackToolSlug>("general");
  const [open, setOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const openFeedback = useCallback(() => {
    setModalKey((key) => key + 1);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ toolSlug, setToolSlug, openFeedback }),
    [toolSlug, openFeedback],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <FeedbackModal
        key={modalKey}
        open={open}
        toolSlug={toolSlug}
        onClose={() => setOpen(false)}
      />
    </FeedbackContext.Provider>
  );
}

export function FeedbackToolScope({
  tool,
  children,
}: {
  tool: FeedbackToolSlug;
  children: ReactNode;
}) {
  const ctx = useFeedbackOptional();

  useEffect(() => {
    if (!ctx) return;
    ctx.setToolSlug(tool);
    return () => ctx.setToolSlug("general");
  }, [tool, ctx]);

  return <>{children}</>;
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}

export function useFeedbackOptional() {
  return useContext(FeedbackContext);
}
