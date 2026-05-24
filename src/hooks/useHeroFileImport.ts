"use client";

import { useEffect, useRef } from "react";
import type { ToolSlug } from "@/lib/tools/registry";
import {
  clearHeroImport,
  heroImportPayloadToFile,
  readHeroImport,
} from "@/lib/hero-import";

/**
 * Loads a PDF staged from the home-page hero dropzone into a tool workspace.
 */
export function useHeroFileImport(
  slug: ToolSlug,
  onImport: (files: File[]) => void | Promise<void>,
) {
  const importedRef = useRef(false);
  const onImportRef = useRef(onImport);
  onImportRef.current = onImport;

  useEffect(() => {
    if (importedRef.current) return;

    const payload = readHeroImport(slug);
    if (!payload) return;

    importedRef.current = true;

    void (async () => {
      try {
        const file = await heroImportPayloadToFile(payload);
        await onImportRef.current([file]);
      } finally {
        clearHeroImport();
      }
    })();
  }, [slug]);
}
