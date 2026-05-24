import { ToolLayoutProvider } from "@/contexts/tool-layout-context";
import { FeedbackToolScope } from "@/contexts/feedback-context";
import { buildToolJsonLd } from "@/lib/seo/tool-metadata";
import { getToolBySlug, type ToolSlug } from "@/lib/tools/registry";
import { ToolPageShellInner } from "./ToolPageShellInner";

interface ToolPageShellProps {
  tool: ToolSlug;
  children: React.ReactNode;
}

export function ToolPageShell({ tool: slug, children }: ToolPageShellProps) {
  const tool = getToolBySlug(slug);
  const jsonLd = buildToolJsonLd(slug);

  if (!tool) return null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <ToolLayoutProvider>
        <FeedbackToolScope tool={slug}>
          <ToolPageShellInner title={tool.title} description={tool.description}>
            {children}
          </ToolPageShellInner>
        </FeedbackToolScope>
      </ToolLayoutProvider>
    </>
  );
}
