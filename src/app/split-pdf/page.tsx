import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("split-pdf");

export default function SplitPdfPage() {
  return (
    <ToolPageShell tool="split-pdf">
      <ToolComponent />
    </ToolPageShell>
  );
}
