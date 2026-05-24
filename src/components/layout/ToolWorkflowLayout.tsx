"use client";

import { useEffect } from "react";
import { useToolLayout } from "@/contexts/tool-layout-context";
import {
  TOOL_IMMERSIVE_GRID,
  TOOL_IMMERSIVE_SIDEBAR,
  TOOL_IMMERSIVE_WORKSPACE,
  TOOL_UPLOAD_INNER,
  TOOL_UPLOAD_VIEW,
} from "@/lib/ui/classes";

interface ToolWorkflowLayoutProps {
  hasFiles: boolean;
  upload: React.ReactNode;
  workspace: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarLabel?: string;
  /** Wider initial upload column for text-heavy tools (e.g. teleprompter scripts). */
  wideUpload?: boolean;
  /** Extra classes merged onto the immersive workspace panel. */
  workspaceClassName?: string;
}

export function ToolWorkflowLayout({
  hasFiles,
  upload,
  workspace,
  sidebar,
  sidebarLabel = "Tool options",
  wideUpload = false,
  workspaceClassName,
}: ToolWorkflowLayoutProps) {
  const { setImmersive } = useToolLayout();

  useEffect(() => {
    setImmersive(hasFiles);
    return () => setImmersive(false);
  }, [hasFiles, setImmersive]);

  if (!hasFiles) {
    return (
      <div className={TOOL_UPLOAD_VIEW}>
        <div className={wideUpload ? "w-full max-w-4xl" : TOOL_UPLOAD_INNER}>{upload}</div>
      </div>
    );
  }

  return (
    <div className={TOOL_IMMERSIVE_GRID}>
      <div
        className={
          workspaceClassName
            ? `${TOOL_IMMERSIVE_WORKSPACE} ${workspaceClassName}`
            : TOOL_IMMERSIVE_WORKSPACE
        }
      >
        {workspace}
      </div>
      <aside className={TOOL_IMMERSIVE_SIDEBAR} aria-label={sidebarLabel}>
        {sidebar}
      </aside>
    </div>
  );
}
