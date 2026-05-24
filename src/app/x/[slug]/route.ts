import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { analyticsKey, type ClickEvent, type LinkAnalytics } from "@/lib/analytics/link-analytics";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || !/^[a-z0-9]{4,12}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid link." }, { status: 404 });
  }

  try {
    const { env } = getCloudflareContext();
    const kv = env.URL_SHORTENER;
    const url = await kv.get(slug);

    if (!url) {
      return NextResponse.json({ error: "Link not found or expired." }, { status: 404 });
    }

    const country = request.headers.get("cf-ipcountry") ?? "Unknown";
    const referer = request.headers.get("referer") ?? "Direct";

    const raw = await kv.get(analyticsKey(slug));
    const analytics: LinkAnalytics = raw
      ? JSON.parse(raw)
      : { code: slug, url, clicks: [], createdAt: Date.now() };

    const event: ClickEvent = { ts: Date.now(), country, referer };
    analytics.clicks.push(event);
    if (analytics.clicks.length > 5000) analytics.clicks = analytics.clicks.slice(-5000);

    await kv.put(analyticsKey(slug), JSON.stringify(analytics), {
      expirationTtl: 60 * 60 * 24 * 365,
    });

    return NextResponse.redirect(url, 302);
  } catch {
    return NextResponse.json({ error: "Could not redirect." }, { status: 500 });
  }
}
