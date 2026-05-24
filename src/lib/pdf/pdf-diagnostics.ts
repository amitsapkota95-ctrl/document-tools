export interface PdfDiagnostics {
  totalBytes: number;
  imagesPct: number;
  fontsPct: number;
  metadataPct: number;
  textPct: number;
  imageCount: number;
  fontCount: number;
}

export async function analyzePdfStructure(bytes: ArrayBuffer): Promise<PdfDiagnostics> {
  const totalBytes = bytes.byteLength;
  const view = new Uint8Array(bytes);
  const text = new TextDecoder("latin1").decode(view);

  // Heuristic byte analysis from PDF raw structure
  let imageBytes = 0;
  let fontBytes = 0;
  let metaBytes = 0;

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const chunk = match[1];
    const len = chunk.length;
    if (/\/Image|\/DCTDecode|\/JPXDecode|\/FlateDecode.*\/Subtype\/Image/.test(text.slice(Math.max(0, match.index - 200), match.index))) {
      imageBytes += len;
    } else if (/\/Font|\/FontDescriptor/.test(text.slice(Math.max(0, match.index - 200), match.index))) {
      fontBytes += len;
    } else {
      metaBytes += len * 0.3;
    }
  }

  const infoMatch = text.match(/\/Info\s+\d+\s+\d+\s+R/);
  if (infoMatch) metaBytes += 2048;

  const catalogMeta = (text.match(/\/Metadata\s+\d+\s+\d+\s+R/g) ?? []).length * 1024;
  metaBytes += catalogMeta;

  const imageCount = (text.match(/\/Subtype\s*\/Image/g) ?? []).length;
  const fontCount = (text.match(/\/Type\s*\/Font[^I]/g) ?? []).length;

  const accounted = imageBytes + fontBytes + metaBytes;
  const remainder = Math.max(0, totalBytes - accounted);
  const textBytes = remainder * 0.6;
  metaBytes += remainder * 0.4;

  const sum = imageBytes + fontBytes + metaBytes + textBytes || 1;

  return {
    totalBytes,
    imagesPct: Math.round((imageBytes / sum) * 100),
    fontsPct: Math.round((fontBytes / sum) * 100),
    metadataPct: Math.round((metaBytes / sum) * 100),
    textPct: Math.round((textBytes / sum) * 100),
    imageCount,
    fontCount,
  };
}

export interface CompressOptions {
  crushImages: boolean;
  stripMetadata: boolean;
  imageDpi: number;
  quality: number;
}
