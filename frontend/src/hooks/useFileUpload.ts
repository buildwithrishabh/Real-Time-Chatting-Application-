import { useState } from 'react';
import axios from 'axios';
import { filesApi } from '../api/files.api';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

const MIME_CATEGORY_MAP: Record<string, 'image' | 'video' | 'raw'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'application/pdf': 'raw',
  'application/zip': 'raw',
  'application/x-zip-compressed': 'raw',
};

const MAX_SIZE: Record<string, number> = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  raw: 100 * 1024 * 1024,
};

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const upload = async (file: File, conversationId: string) => {
    setState({ isUploading: true, progress: 0, error: null });

    try {
      const category = MIME_CATEGORY_MAP[file.type] || 'raw';
      const maxSize = MAX_SIZE[category] || 100 * 1024 * 1024;

      if (file.size > maxSize) {
        throw new Error(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
      }

      // 1. Get signed Cloudinary credentials
      const signed = await filesApi.sign(category, file.type);

      // 2. Direct upload to Cloudinary API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signed.apiKey);
      formData.append('timestamp', String(signed.timestamp));
      formData.append('signature', signed.signature);
      formData.append('folder', signed.folder);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/${category}/upload`,
        formData,
        {
          onUploadProgress: (e) => {
            if (e.total && e.total > 0) {
              setState((prev) => ({
                ...prev,
                progress: Math.round((e.loaded * 100) / e.total!),
              }));
            }
          },
        }
      );

      const { public_id, secure_url, width, height, bytes } = cloudinaryRes.data;

      // 3. Verify file upload metadata with backend server
      const fileMeta = await filesApi.verify({
        publicId: public_id,
        conversationId,
        size: bytes,
        mimeType: file.type,
        url: secure_url,
        category,
        width,
        height,
      });

      setState({ isUploading: false, progress: 100, error: null });
      return fileMeta;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setState({ isUploading: false, progress: 0, error: message });
      throw err;
    }
  };

  return { upload, ...state };
}
