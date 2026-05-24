import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { getAllToolSlugs } from "@/lib/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const tools = getAllToolSlugs().map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...tools,
  ];
}
