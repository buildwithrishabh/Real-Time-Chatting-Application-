export type FileCategory = 'image' | 'video' | 'raw';
export type VirusScanStatus = 'unscanned' | 'passed' | 'failed';

export interface FileMeta {
  _id: string;
  url: string;
  publicId: string;
  size: number;
  mimeType: string;
  ownerId: string;
  conversationId: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  virusScanStatus: VirusScanStatus;
  category: FileCategory;
  createdAt: string;
}
