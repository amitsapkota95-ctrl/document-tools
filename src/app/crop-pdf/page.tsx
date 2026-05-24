import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("crop-pdf");

export default function CropPdfPage() {
  return (
    <ToolPageShell tool="crop-pdf">
      <ToolComponent />
    </ToolPageShell>
  );
}
