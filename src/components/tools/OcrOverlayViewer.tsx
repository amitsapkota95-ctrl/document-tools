"use client";

interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

interface OcrOverlayViewerProps {
  imageUrl: string;
  words: OcrWord[];
  scale?: number;
  className?: string;
}

export function OcrOverlayViewer({
  imageUrl,
  words,
  scale = 1,
  className = "",
}: OcrOverlayViewerProps) {
  return (
    <div
      className={`relative w-full overflow-auto rounded-xl border-2 border-moss/70 bg-cream shadow-eco ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Scanned page" className="block h-auto w-full" draggable={false} />
      <div className="pointer-events-none absolute inset-0">
        {words.map((word, i) => {
          const left = word.bbox.x0 * scale;
          const top = word.bbox.y0 * scale;
          const width = (word.bbox.x1 - word.bbox.x0) * scale;
          const height = (word.bbox.y1 - word.bbox.y0) * scale;

          return (
            <span
              key={`${word.text}-${i}`}
              className="pointer-events-auto absolute cursor-text text-transparent selection:bg-sage/40 hover:bg-sage/20"
              style={{
                left,
                top,
                width,
                height,
                fontSize: height * 0.85,
                lineHeight: `${height}px`,
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export type { OcrWord };
