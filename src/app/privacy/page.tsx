import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description:
    "How paperless.tools and the Paperless Tools iOS app handle your data, including on-device processing and URL shortener server storage.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">Legal</p>
        <h1 className="font-serif text-4xl font-bold text-ink">Privacy Policy</h1>
        <p className="text-sm text-ink/60">Last updated: May 28, 2026</p>
      </header>

      <div className="space-y-8 text-[15px] leading-relaxed text-ink/80">
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Overview</h2>
          <p>
            {SITE_NAME} provides document utilities on the web and in the Paperless Tools iOS app
            ({`tools.paperless.app`}). Most tools process your files entirely on your device. We
            designed the product so PDFs, scans, signatures, and OCR output are not uploaded for
            routine document tasks.
          </p>
          <p>
            The <strong>URL shortener</strong> is the only feature that sends user-provided data to
            our servers. Everything else runs locally in your browser or on your device.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">On-device processing</h2>
          <p>
            Document scanning, merging, splitting, compression, redaction, cropping, signing,
            OCR, and similar features run locally in your browser or on your iPhone/iPad. We do not
            receive the contents of those documents.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">URL shortener (server storage)</h2>
          <p>
            When you use the URL shortener on the website or in the iOS app, the original URL is
            sent to our server at{" "}
            <code className="rounded bg-cream-200 px-1.5 py-0.5 text-sm">paperless.tools</code> via{" "}
            <code className="rounded bg-cream-200 px-1.5 py-0.5 text-sm">POST /api/shorten</code>.
            We save your link on our servers so the short URL works and you can view basic click
            statistics.
          </p>
          <p>We store the following in Cloudflare KV (our link storage):</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Original URL</strong> — the address you submitted, mapped to a short code
            </li>
            <li>
              <strong>Short code</strong> — the random identifier used in links like{" "}
              <code className="rounded bg-cream-200 px-1.5 py-0.5 text-sm">/x/abc12</code>
            </li>
            <li>
              <strong>Click statistics</strong> — when someone opens a short link, we record the
              time of the click, approximate country (from Cloudflare request headers), and referer
              (where the click came from, if available)
            </li>
          </ul>
          <p>
            Click stats are available on the stats page (
            <code className="rounded bg-cream-200 px-1.5 py-0.5 text-sm">/stats/&#123;code&#125;</code>
            ) for links you create. This data is used only to operate the shortener and show you
            redirect counts — not for advertising or cross-app tracking.
          </p>
          <p>
            All URL shortener records (the link mapping and click statistics) are automatically
            deleted after <strong>72 hours</strong>. This retention period is also disclosed in the
            iOS app before you shorten a link.
          </p>
          <p>
            URL shortener data is not linked to an account, is not used for advertising, and is
            not sold to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Data stored on your device</h2>
          <p>The iOS app may store the following locally on your device:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Saved signatures (Fill &amp; Sign)</li>
            <li>Teleprompter scripts and settings</li>
            <li>Temporary exported files in the system temp folder (cleaned automatically)</li>
          </ul>
          <p>This data stays on your device unless you delete the app or clear app data.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">What we do not collect</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>No account registration is required</li>
            <li>No advertising or analytics trackers in the iOS app</li>
            <li>No sale of personal data</li>
            <li>No upload of document content for on-device PDF tools</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Third-party services</h2>
          <p>
            The URL shortener uses HTTPS to our own infrastructure hosted on Cloudflare. Standard TLS
            encryption protects data in transit. The iOS app declares that it uses only exempt
            encryption (HTTPS).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Children</h2>
          <p>
            Our services are not directed at children under 13, and we do not knowingly collect
            personal information from children.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Changes</h2>
          <p>
            We may update this policy from time to time. Material changes will be reflected on this
            page with an updated date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Contact</h2>
          <p>
            Questions about privacy? Visit{" "}
            <Link href="/" className="font-semibold text-forest-700 underline-offset-2 hover:underline">
              {SITE_NAME}
            </Link>{" "}
            and use the feedback option in the site footer.
          </p>
        </section>
      </div>
    </article>
  );
}
