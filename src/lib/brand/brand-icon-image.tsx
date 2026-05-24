import { ImageResponse } from "next/og";

/** Lucide `Leaf` paths — same icon as SiteHeader brand mark. */
const LEAF_PATHS = [
  "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z",
  "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
] as const;

const FOREST_700 = "#2d452c";
const CREAM_100 = "#faf8f5";

export function createBrandIconImage(size: number) {
  const leafSize = size * 0.5;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: FOREST_700,
          borderRadius: size * 0.3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={leafSize}
          height={leafSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke={CREAM_100}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {LEAF_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
