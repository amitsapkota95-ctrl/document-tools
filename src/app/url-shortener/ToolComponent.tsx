"use client";

import { useState } from "react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolButton } from "@/components/tools/ToolButton";
import { CARD_CLASS, INPUT_CLASS, TOOL_SIDEBAR_CTA_CLASS } from "@/lib/ui/classes";
import { useToastStore } from "@/stores/toast-store";

export default function UrlShortenerTool() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [statsUrl, setStatsUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const pushToast = useToastStore((s) => s.pushToast);
  const [copied, setCopied] = useState(false);

  const shorten = async () => {
    setShortUrl("");
    setStatsUrl("");
    setCopied(false);
    setLoading(true);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = (await res.json()) as {
        shortUrl?: string;
        statsUrl?: string;
        error?: string;
      };

      if (!res.ok) {
        pushToast("error", data.error ?? "Could not shorten link.");
        return;
      }

      setShortUrl(data.shortUrl ?? "");
      setStatsUrl(data.statsUrl ?? "");
      pushToast("success", "Link shortened!");
    } catch {
      pushToast("error", "Could not reach the server. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (shortUrl) {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
    }
  };

  const urlInput = (
    <label className="block w-full text-sm font-semibold">
      Paste your long URL here
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/very/long/link"
        className={`${INPUT_CLASS} mt-2 py-4 text-lg`}
      />
    </label>
  );

  return (
    <ToolWorkflowLayout
      hasFiles={!!shortUrl}
      sidebarLabel="Shorten options"
      upload={
        <div className="w-full space-y-4">
          {urlInput}
          <ToolButton onClick={shorten} disabled={!url.trim() || loading} className="w-full">
            {loading ? "Shortening…" : "Shorten Link"}
          </ToolButton>
        </div>
      }
      workspace={
        <div className={`${CARD_CLASS} space-y-4 p-6`}>
          <div>
            <p className="text-sm font-semibold">Your short link</p>
            <p className="mt-2 break-all font-mono text-lg">{shortUrl}</p>
            <ToolButton onClick={copy} className="mt-4 w-full sm:w-auto">
              {copied ? "Copied!" : "Copy"}
            </ToolButton>
          </div>
          {statsUrl ? (
            <div>
              <p className="text-sm font-semibold">Analytics dashboard</p>
              <a href={statsUrl} className="mt-1 block break-all text-sm text-forest underline">
                {statsUrl}
              </a>
              <p className="mt-1 text-xs text-sand-light">
                Privacy-first click analytics — country and referer only, processed at the edge.
              </p>
            </div>
          ) : null}
        </div>
      }
      sidebar={
        <>
          {urlInput}
          <div className={TOOL_SIDEBAR_CTA_CLASS}>
            <ToolButton onClick={shorten} disabled={!url.trim() || loading} className="w-full">
              {loading ? "Shortening…" : "Shorten Another Link"}
            </ToolButton>
          </div>
        </>
      }
    />
  );
}
