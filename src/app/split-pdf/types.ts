export type PageRotation = 0 | 90 | 180 | 270;

export interface SplitDocument {
  id: string;
  file: File;
  password?: string;
  displayName: string;
}

export interface SplitPage {
  id: string;
  docId: string;
  pageIndex: number;
  thumbnail: string;
  rotation: PageRotation;
}
