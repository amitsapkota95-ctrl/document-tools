import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import {
  pagePathFromReferer,
  parseFeedbackPayload,
  type FeedbackPayload,
} from "@/lib/feedback/validate";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackPayload;
    const parsed = parseFeedbackPayload(body);

    if (!parsed) {
      return NextResponse.json({ error: "Invalid feedback." }, { status: 400 });
    }

    if (parsed.isHoneypot) {
      return NextResponse.json({ ok: true });
    }

    const { env } = getCloudflareContext();
    const db = env.FEEDBACK_DB;
    const pagePath =
      parsed.pagePath ?? pagePathFromReferer(request.headers.get("referer"));

    if (parsed.message) {
      const recent = await db
        .prepare(
          `SELECT COUNT(*) AS count FROM feedback
           WHERE tool_slug = ? AND sentiment = ? AND message = ?
           AND created_at > unixepoch() - 60`,
        )
        .bind(parsed.toolSlug, parsed.sentiment, parsed.message)
        .first<{ count: number }>();

      if (recent && recent.count > 0) {
        return NextResponse.json({ ok: true });
      }
    }

    await db
      .prepare(
        `INSERT INTO feedback (tool_slug, sentiment, message, page_path)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(parsed.toolSlug, parsed.sentiment, parsed.message, pagePath)
      .run();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }
}
