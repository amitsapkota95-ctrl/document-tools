import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("pdf-to-image");

export default function PdfToImagePage() {
  return (
    <ToolPageShell tool="pdf-to-image">
      <ToolComponent />
    </ToolPageShell>
  );
}
