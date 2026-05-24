import {
  TOOL_SIDEBAR_CLASS,
  TOOL_WORKSPACE_CLASS,
  TOOL_WORKSPACE_GRID,
} from "@/lib/ui/classes";

interface ToolWorkspaceLayoutProps {
  workspace: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarLabel?: string;
}

export function ToolWorkspaceLayout({
  workspace,
  sidebar,
  sidebarLabel = "Tool options",
}: ToolWorkspaceLayoutProps) {
  return (
    <div className={TOOL_WORKSPACE_GRID}>
      <div className={TOOL_WORKSPACE_CLASS}>{workspace}</div>
      <aside className={TOOL_SIDEBAR_CLASS} aria-label={sidebarLabel}>
        {sidebar}
      </aside>
    </div>
  );
}
