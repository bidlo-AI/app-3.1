'use client';

import * as React from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BlockIcon } from './IconsTab/types';

export function UploadTab({
  blockId,
  onDone,
  callback,
}: {
  blockId?: Id<'blocks'>;
  onDone?: () => void;
  callback?: (icon: BlockIcon) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const prepareUpload = useMutation(api.icons.prepareUploadPageIcon);
  const finalizeUpload = useMutation(api.icons.finalizeUploadPageIcon);

  // Uploads the file using XMLHttpRequest so we can surface upload progress.
  // Returns the Convex storageId JSON response on success.
  async function uploadFileWithProgress(
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

  async function onPickFile(file: File) {
    if (!file) return;
    if (!blockId) {
      setError('Cannot upload without a block');
      toast.error('Cannot upload without a block');
      return;
    }
    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      const { uploadUrl, fileId } = await prepareUpload({
        blockId,
        filename: file.name,
        mime: file.type,
        size: file.size,
      });
      // Step 2: POST the file to Convex's short-lived upload URL with progress
      // See: https://docs.convex.dev/file-storage/upload-files
      const { storageId } = await uploadFileWithProgress(uploadUrl, file, file.type, setProgress);
      // Step 3: Persist the storage id and set the block's icon to this image
      await finalizeUpload({ blockId, fileId, storageId });
      toast.success('Icon updated');

      // Optimistically update parent with a direct URL if available via finalize
      // We don't have the URL from finalize response, but Icon component now prefers url if present on block icon.
      // The parent block should refresh via subscription; invoke callback without waiting.
      callback?.({ kind: 'image', file_id: fileId } as BlockIcon);
      onDone?.();
    } catch (err) {
      // Extract a readable error message for both toast and inline alert
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Upload failed';
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="p-3">
      <label className="w-full bg-hover hover:bg-secondary/50 rounded-md p-4 flex items-center justify-center cursor-pointer text-muted-foreground-opaque gap-2">
        <ImageIcon className="size-4" />
        <span>Upload an image</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          disabled={uploading}
          className="hidden"
          ref={inputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
            e.currentTarget.value = '';
          }}
        />
      </label>
      {uploading && (
        <div className="mt-2" aria-live="polite">
          <div className="h-1.5 w-full rounded bg-muted">
            <div
              className="h-1.5 rounded bg-primary transition-[width]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
      {!uploading && error && (
        <div
          className="mt-2 rounded-md border border-destructive bg-destructive/10 p-2 text-xs text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default UploadTab;
