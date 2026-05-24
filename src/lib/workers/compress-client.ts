import { compressPdfBytes } from "@/lib/pdf/compress-pdf";
import type { CompressOptions } from "@/lib/pdf/pdf-diagnostics";

export async function compressPdfInWorker(
  pdfBytes: ArrayBuffer,
  quality: number,
  options: Pick<CompressOptions, "crushImages" | "stripMetadata" | "imageDpi">,
  password?: string,
  onProgress?: (value: number, message?: string) => void,
): Promise<ArrayBuffer> {
  return compressPdfBytes(
    pdfBytes,
    {
      quality,
      crushImages: options.crushImages,
      stripMetadata: options.stripMetadata,
      imageDpi: options.imageDpi,
      password,
    },
    onProgress,
  );
}
