export interface CanvasGridConfig {
  cardClass: string;
  gapClass: string;
  justifyClass: string;
  cardWidthPx: number;
  canvasSurfaceClass: string;
  innerGridClass: string;
}

export function getCanvasGridConfig(pageCount: number): CanvasGridConfig {
  if (pageCount <= 4) {
    return {
      cardClass: "w-full max-w-[220px]",
      gapClass: "gap-8",
      justifyClass: "justify-center content-center",
      cardWidthPx: 220,
      canvasSurfaceClass:
        "h-fit max-h-full min-h-[280px] w-fit max-w-full",
      innerGridClass: "w-fit p-8 sm:p-10",
    };
  }

  if (pageCount <= 12) {
    return {
      cardClass: "w-full max-w-[160px]",
      gapClass: "gap-5",
      justifyClass: "justify-start content-start",
      cardWidthPx: 160,
      canvasSurfaceClass:
        "h-full max-h-full min-h-[280px] w-full",
      innerGridClass: "min-h-full w-full p-6 sm:p-8",
    };
  }

  return {
    cardClass: "w-full max-w-[120px]",
    gapClass: "gap-3",
    justifyClass: "justify-start content-start",
    cardWidthPx: 120,
    canvasSurfaceClass:
      "h-full max-h-full min-h-[280px] w-full",
    innerGridClass: "min-h-full w-full p-4 sm:p-6",
  };
}
