import { supabase } from '../lib/supabase';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const BUCKET_NAME = 'images';

export class StorageService {
  static async initializeBucket(): Promise<void> {
    return Promise.resolve();
  }

  static async uploadImage(
    file: File,
    folder: string = 'uploads',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      if (onProgress) {
        const total = file.size;
        let loaded = 0;
        const interval = setInterval(() => {
          loaded += total / 10;
          if (loaded >= total) {
            loaded = total;
            clearInterval(interval);
          }
          onProgress({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100)
          });
        }, 100);
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const path = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '31536000',
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(error.message || 'Failed to upload image to storage');
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error instanceof Error ? error : new Error('Failed to upload image');
    }
  }

  static async deleteImage(path: string): Promise<void> {
    try {
      const url = new URL(path);
      const pathSegments = url.pathname.split('/storage/v1/object/public/images/');
      if (pathSegments.length > 1) {
        const filePath = pathSegments[1];
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  static getPublicUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    if (path.startsWith('/uploads')) {
      return path;
    }
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  }
}
