export interface SignDocumentEntry {
  id: string;
  file: File;
  password?: string;
  displayName: string;
  pageCount: number;
}

export interface PageRenderInfo {
  pageIndex: number;
  sourceDocId: string;
  sourcePageIndex: number;
  dataUrl: string;
  displayWidth: number;
  displayHeight: number;
  pdfWidth: number;
  pdfHeight: number;
}

export interface PlacedSignature {
  id: string;
  pageIndex: number;
  dataUrl: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_SIGNATURE_WIDTH = 200;
export const DEFAULT_SIGNATURE_HEIGHT = 80;

export interface SignaturePlacementSize {
  width: number;
  height: number;
}
