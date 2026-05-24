import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("qr-tools");

export default function QrToolsPage() {
  return (
    <ToolPageShell tool="qr-tools">
      <ToolComponent />
    </ToolPageShell>
  );
}
