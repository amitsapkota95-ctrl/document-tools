import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("merge-pdf");

export default function MergePdfPage() {
  return (
    <ToolPageShell tool="merge-pdf">
      <ToolComponent />
    </ToolPageShell>
  );
}
