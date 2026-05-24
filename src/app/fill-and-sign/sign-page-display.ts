export const SIGN_PAGE_MAX_WIDTH = 960;
export const SIGN_PAGE_RENDER_SCALE = 1.75;

export function computeSignPageDisplaySize(naturalWidth: number, naturalHeight: number) {
  const viewportMax =
    typeof window !== "undefined"
      ? Math.floor(window.innerWidth * 0.62)
      : SIGN_PAGE_MAX_WIDTH;
  const maxWidth = Math.min(SIGN_PAGE_MAX_WIDTH, viewportMax);
  const width = Math.min(naturalWidth, maxWidth);
  const ratio = width / naturalWidth;

  return {
    displayWidth: width,
    displayHeight: naturalHeight * ratio,
  };
}
