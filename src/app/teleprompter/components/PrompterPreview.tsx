"use client";

import { getTheme, THEME_ORDER } from "@/lib/teleprompter/themes";
import type { TeleprompterSettings, ThemeId } from "@/lib/teleprompter/types";
import type { WordRange } from "@/lib/teleprompter/script-parser";
import { PrompterViewport } from "./PrompterViewport";

interface PrompterPreviewProps {
  script: string;
  settings: TeleprompterSettings;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  previewScrollOffsetRef?: React.MutableRefObject<number>;
  followLineIndex?: number | null;
  highlightWordRange?: WordRange | null;
  onThemeChange: (theme: ThemeId) => void;
}

export function PrompterPreview({
  script,
  settings,
  viewportRef,
  contentRef,
  previewScrollOffsetRef,
  followLineIndex = null,
  highlightWordRange = null,
  onThemeChange,
}: PrompterPreviewProps) {
  const theme = getTheme(settings.theme);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-forest-700">Preview</p>
        <label className="flex items-center gap-2 text-xs font-semibold text-forest-700">
          Theme
          <select
            value={settings.theme}
            onChange={(e) => onThemeChange(e.target.value as ThemeId)}
            className="rounded-lg border border-cream-300 bg-cream px-2 py-1 text-xs"
          >
            {THEME_ORDER.map((id) => (
              <option key={id} value={id}>
                {getTheme(id).label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="flex min-h-[20rem] flex-1 flex-col overflow-hidden rounded-xl border shadow-paper lg:min-h-0"
        style={{ borderColor: theme.border, backgroundColor: theme.background }}
      >
        <PrompterViewport
          script={script}
          settings={settings}
          viewportRef={viewportRef}
          contentRef={contentRef}
          mode="preview"
          previewScrollOffsetRef={previewScrollOffsetRef}
          followLineIndex={followLineIndex}
          highlightWordRange={highlightWordRange}
          className="h-full min-h-[20rem] lg:min-h-0"
        />
      </div>
    </div>
  );
}
