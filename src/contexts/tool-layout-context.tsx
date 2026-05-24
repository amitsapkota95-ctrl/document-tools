"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface ToolLayoutContextValue {
  isImmersive: boolean;
  setImmersive: (value: boolean) => void;
}

const ToolLayoutContext = createContext<ToolLayoutContextValue | null>(null);

export function ToolLayoutProvider({ children }: { children: ReactNode }) {
  const [isImmersive, setImmersive] = useState(false);

  const value = useMemo(
    () => ({ isImmersive, setImmersive }),
    [isImmersive],
  );

  return <ToolLayoutContext.Provider value={value}>{children}</ToolLayoutContext.Provider>;
}

export function useToolLayout() {
  const context = useContext(ToolLayoutContext);
  if (!context) {
    throw new Error("useToolLayout must be used within ToolLayoutProvider");
  }
  return context;
}
