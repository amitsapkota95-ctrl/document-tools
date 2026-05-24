import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("extract-text-from-pdf");

export default function ExtractTextPage() {
  return (
    <ToolPageShell tool="extract-text-from-pdf">
      <ToolComponent />
    </ToolPageShell>
  );
}
