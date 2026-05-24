import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("redact-pdf");

export default function RedactPdfPage() {
  return (
    <ToolPageShell tool="redact-pdf">
      <ToolComponent />
    </ToolPageShell>
  );
}
