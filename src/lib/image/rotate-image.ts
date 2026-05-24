export type ImageRotation = 0 | 90 | 180 | 270;

export function nextImageRotation(current: ImageRotation): ImageRotation {
  if (current === 0) return 90;
  if (current === 90) return 180;
  if (current === 180) return 270;
  return 0;
}

function loadImageElement(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image."));
    };
    img.src = url;
  });
}

/** Rasterize rotation so exported PDF dimensions match the preview. */
export async function rotateImageBlob(
  file: Blob,
  rotation: ImageRotation,
  mimeType?: string,
): Promise<Blob> {
  if (rotation === 0) return file;

  const img = await loadImageElement(file);
  const swap = rotation === 90 || rotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? img.height : img.width;
  canvas.height = swap ? img.width : img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas for rotation.");

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  const outputType =
    mimeType === "image/png" || mimeType === "image/webp" ? "image/png" : "image/jpeg";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode rotated image."))),
      outputType,
      outputType === "image/jpeg" ? 0.92 : undefined,
    );
  });
}
