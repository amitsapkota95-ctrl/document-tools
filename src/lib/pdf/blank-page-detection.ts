export interface PageBlankResult {
  pageIndex: number;
  isBlank: boolean;
  variance: number;
}

export async function detectBlankPages(
  canvases: HTMLCanvasElement[],
  threshold = 12,
): Promise<PageBlankResult[]> {
  return canvases.map((canvas, pageIndex) => {
    const ctx = canvas.getContext("2d")!;
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;

    let sum = 0;
    let sumSq = 0;
    const step = 4 * 8; // sample every 8 pixels for speed
    let count = 0;

    for (let i = 0; i < data.length; i += step) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += gray;
      sumSq += gray * gray;
      count++;
    }

    const mean = sum / count;
    const variance = sumSq / count - mean * mean;

    return {
      pageIndex,
      isBlank: variance < threshold && mean > 240,
      variance,
    };
  });
}

export function suggestSplitPoints(blankResults: PageBlankResult[]): number[] {
  return blankResults.filter((r) => r.isBlank).map((r) => r.pageIndex);
}
