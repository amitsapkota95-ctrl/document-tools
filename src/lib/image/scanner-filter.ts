export interface ContentBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const WHITE_THRESHOLD = 245;

export function detectContentBounds(
  canvas: HTMLCanvasElement,
  padding = 4,
): ContentBounds {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (gray < WHITE_THRESHOLD) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: Math.min(width, maxX - minX + padding * 2),
    height: Math.min(height, maxY - minY + padding * 2),
  };
}

export function applyScannerEnhancement(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const enhanced = gray > 180 ? 255 : gray < 100 ? 0 : gray > 128 ? 255 : 0;
    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function deskewImage(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);

  const bounds = detectContentBounds(canvas, 0);
  const trimmed = document.createElement("canvas");
  trimmed.width = bounds.width;
  trimmed.height = bounds.height;
  trimmed.getContext("2d")!.drawImage(
    canvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height,
  );

  return applyScannerEnhancement(trimmed);
}

export async function canvasToBytes(canvas: HTMLCanvasElement, type: "image/jpeg" | "image/png"): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed"))), type, 0.92);
  });
  return new Uint8Array(await blob.arrayBuffer());
}
