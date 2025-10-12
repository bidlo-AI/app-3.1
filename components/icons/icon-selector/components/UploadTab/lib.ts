import type { Id } from '@/convex/_generated/dataModel';

// UploadTab-specific constants and helpers
export const RECENT_UPLOAD_URLS_KEY = 'upload_urls:recent';

// Upload a file with progress callbacks using XHR to support onprogress
export function uploadFileWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<{ storageId: Id<'_storage'> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as { storageId: Id<'_storage'> };
          resolve(json);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error('Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
}
