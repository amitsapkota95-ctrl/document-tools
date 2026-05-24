export type PageRotation = 0 | 90 | 180 | 270;

export interface DocumentEntry {
  id: string;
  file: File;
  name: string;
  displayName: string;
  size: number;
  totalPages: number;
  thumbnailDataUrl: string;
  password?: string;
}

export interface PageEntry {
  id: string;
  parentDocId: string;
  originalPageNumber: number;
  thumbnailDataUrl: string;
  rotation: PageRotation;
  isBlank?: boolean;
}

export type ViewMode = "document" | "page";

export interface MergeGridItem {
  id: string;
  thumbnailDataUrl: string;
  label: string;
  sublabel?: string;
  rotation?: PageRotation;
  isBlank?: boolean;
  kind: "document" | "page";
  lazyThumbnail?: {
    file: File;
    pageIndex: number;
    password?: string;
    rotation: PageRotation;
  };
}
