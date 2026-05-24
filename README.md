# paperless.tools

Privacy-first document tools that run entirely in your browser. Built with Next.js and deployed to Cloudflare Workers via OpenNext.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & Deploy

### 1. Create KV namespace (URL shortener)

```bash
npx wrangler kv namespace create URL_SHORTENER
```

Copy the namespace ID into `wrangler.jsonc` under `kv_namespaces`.

### 2. Create D1 database (feedback)

```bash
npx wrangler d1 create paperless-tools-feedback
```

Apply the feedback schema:

```bash
npm run db:migrate
```

### 3. Generate Cloudflare types

```bash
npm run cf-typegen
```

### 4. Preview locally (Workers runtime)

```bash
npm run preview
```

### 5. Deploy

```bash
npm run deploy
```

The Worker custom domain should be **apex only** (`paperless.tools`) once the www redirect is configured. Until then, both hostnames may remain attached so www keeps resolving.

### 6. Domain setup (apex + www)

**Apex (`paperless.tools`)** — served by the Worker. Verify under Workers & Pages → `paperless-tools` → Settings → Domains & Routes.

**WWW (`www.paperless.tools`)** — should 301 redirect to apex. Preferred: Cloudflare Single Redirect Rule at the edge (Rules → Redirect Rules → Create rule). Use the **Redirect from WWW to Root** template, or configure manually:

| Field | Value |
|-------|-------|
| Match | Wildcard: `https://www.paperless.tools/*` |
| Target | `https://paperless.tools/${1}` |
| Status | `301` |
| Preserve query string | Enabled |

Ensure a **proxied** DNS record exists for `www` (DNS → Records). If www was previously a Worker custom domain, add a proxied placeholder after removing it:

- Type: `AAAA`, Name: `www`, Content: `100::`, Proxy: ON

**Automate edge redirect + DNS** (requires an API token with Zone DNS Edit and Single Redirect Edit):

```powershell
$env:CLOUDFLARE_API_TOKEN = "your-token"
.\scripts\setup-www-redirect.ps1
npx wrangler triggers deploy --name paperless-tools
```

After the edge redirect works, remove `www.paperless.tools` from `wrangler.jsonc` so only apex remains on the Worker.

**App-level fallback:** `next.config.ts` includes a host-based redirect for www → apex (takes effect on the next successful deploy).

**Verify:**

```bash
curl -I https://paperless.tools
# Expect: HTTP/1.1 200 OK

curl -I https://www.paperless.tools/merge-pdf
# Expect: HTTP/1.1 301 + Location: https://paperless.tools/merge-pdf
```

## Tools (14)

**PDF:** merge, split, compress, image-to-pdf, pdf-to-image, fill-and-sign, redact, crop, extract-text (OCR)

**Content:** compare-text, invoice-builder, teleprompter

**Utilities:** qr-tools, url-shortener (KV-backed), site feedback (D1-backed)

## Architecture

- Tool landing pages are statically generated (SSG) with SEO metadata and JSON-LD
- All document processing happens client-side (pdf-lib, pdfjs-dist, tesseract.js)
- URL shortener uses Cloudflare KV via `/api/shorten` and `/x/[slug]`
- Feedback uses Cloudflare D1 via `/api/feedback` (global and per-tool)

## Lighthouse

Target 100/100 on Performance, SEO, Accessibility, and Best Practices. No third-party analytics. Fonts loaded via `next/font` with `display: swap`.

## iOS App

Native SwiftUI app on branch `platform/ios-native`. See [ios/README.md](ios/README.md) for setup.

```bash
open ios/PaperlessTools/PaperlessTools.xcodeproj
```

MVP tools: QR generator/scanner, URL shortener, document scanner, merge PDF, fill & sign, image to PDF. All processing is on-device except URL shortening (uses `/api/shorten`).
