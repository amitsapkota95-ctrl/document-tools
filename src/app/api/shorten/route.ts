import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { LINK_RETENTION_SECONDS } from "@/lib/analytics/link-analytics";

function generateCode(length = 5): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: "Please enter a valid http or https URL." }, { status: 400 });
    }

    const { env } = getCloudflareContext();
    const kv = env.URL_SHORTENER;

    let code = generateCode();
    let attempts = 0;

    while (attempts < 5) {
      const existing = await kv.get(code);
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const collision = await kv.get(code);
    if (collision) {
      return NextResponse.json(
        { error: "Could not generate a unique short link. Please try again." },
        { status: 503 },
      );
    }

    await kv.put(code, url, { expirationTtl: LINK_RETENTION_SECONDS });

    const origin = new URL(request.url).origin;
    const shortUrl = `${origin}/x/${code}`;
    const statsUrl = `${origin}/stats/${code}`;

    return NextResponse.json({ shortUrl, code, statsUrl });
  } catch {
    return NextResponse.json({ error: "Could not shorten URL." }, { status: 500 });
  }
}
