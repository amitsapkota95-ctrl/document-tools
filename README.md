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

The production namespace is `paperless-shortner-kv`. Its ID is already in `wrangler.jsonc`.
To create a new one:

```bash
npx wrangler kv namespace create URL_SHORTENER
```

Copy the namespace ID into `wrangler.jsonc` under `kv_namespaces`.

### 2. Create D1 database (feedback)

The production database is `paperless-feedback`. Its ID is already in `wrangler.jsonc`.
To create a new one:

```bash
npx wrangler d1 create paperless-feedback
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

Attach custom domain `paperless.tools` in the Cloudflare dashboard under Workers & Pages.

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
