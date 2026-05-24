import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { getToolBySlug, type ToolSlug } from "@/lib/tools/registry";

export function buildToolMetadata(slug: ToolSlug): Metadata {
  const tool = getToolBySlug(slug);

  if (!tool) {
    return { title: SITE_NAME };
  }

  const url = `${SITE_URL}/${slug}`;

  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tool.seoTitle,
      description: tool.seoDescription,
    },
  };
}

export function buildToolJsonLd(slug: ToolSlug) {
  const tool = getToolBySlug(slug);
  if (!tool) return null;

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.seoDescription,
    url: `${SITE_URL}/${slug}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    browserRequirements: "Requires JavaScript. Files processed locally in browser.",
  };
}
