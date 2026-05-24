import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("image-to-pdf");

export default function ImageToPdfPage() {
  return (
    <ToolPageShell tool="image-to-pdf">
      <ToolComponent />
    </ToolPageShell>
  );
}
