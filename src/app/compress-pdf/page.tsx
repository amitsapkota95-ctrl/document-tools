import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("compress-pdf");

export default function CompressPdfPage() {
  return (
    <ToolPageShell tool="compress-pdf">
      <ToolComponent />
    </ToolPageShell>
  );
}
