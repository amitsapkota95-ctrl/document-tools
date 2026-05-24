import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import {
  aggregateByCountry,
  aggregateByDay,
  analyticsKey,
  type LinkAnalytics,
} from "@/lib/analytics/link-analytics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  if (!code || !/^[a-z0-9]{4,12}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }

  try {
    const { env } = getCloudflareContext();
    const kv = env.URL_SHORTENER;
    const raw = await kv.get(analyticsKey(code));
    const analytics: LinkAnalytics = raw
      ? JSON.parse(raw)
      : { code, url: (await kv.get(code)) ?? "", clicks: [], createdAt: Date.now() };

    return NextResponse.json({
      ...analytics,
      byCountry: aggregateByCountry(analytics.clicks),
      byDay: aggregateByDay(analytics.clicks),
      totalClicks: analytics.clicks.length,
    });
  } catch {
    return NextResponse.json({ error: "Could not load analytics." }, { status: 500 });
  }
}
