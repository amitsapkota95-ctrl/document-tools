import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("url-shortener");

export default function UrlShortenerPage() {
  return (
    <ToolPageShell tool="url-shortener">
      <ToolComponent />
    </ToolPageShell>
  );
}
