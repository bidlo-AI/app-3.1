'use client';

import * as React from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BlockIcon } from './IconsTab/types';
import { Command, CommandGroup, CommandList } from '@/components/ui/command';
import { RECENT_LIMIT, loadRecentsFromStorage, upsertRecent } from '@/components/icons/icon-selector/lib';

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
  const setImageByUrl = useMutation(api.icons.setPageIconImageUrl);

  // Local recents are public image URLs (not files) so we avoid re-uploading.
  const RECENT_UPLOAD_URLS_KEY = 'upload_urls:recent';
  const [recentUrls, setRecentUrls] = React.useState<string[]>([]);

  React.useEffect(() => {
    const loaded = loadRecentsFromStorage(
      RECENT_UPLOAD_URLS_KEY,
      RECENT_LIMIT,
      (s) => s.trim(),
      (s) => /^https?:\/\//.test(s),
    );
    if (loaded.length) setRecentUrls(loaded);
  }, []);

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

  const onPickFile = React.useCallback(
    async (file: File) => {
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
        const { uploadUrl } = await prepareUpload({
          blockId,
          mime: file.type,
          size: file.size,
        });
        // Step 2: POST the file to Convex's short-lived upload URL with progress
        // See: https://docs.convex.dev/file-storage/upload-files
        const { storageId } = await uploadFileWithProgress(uploadUrl, file, file.type, setProgress);
        // Step 3: Persist the storage id and set the block's icon to this image
        const result = await finalizeUpload({
          blockId,
          storageId,
          filename: file.name,
          mime: file.type,
          size: file.size,
        });
        const url = result?.url;
        if (url) {
          // Record the public URL in local recents, deduped and capped.
          setRecentUrls((prev) => upsertRecent(RECENT_UPLOAD_URLS_KEY, prev, url, RECENT_LIMIT));
        }
        toast.success('Icon updated');

        // Optimistically update parent with a direct URL if available via finalize
        // We don't have the URL from finalize response, but Icon component now prefers url if present on block icon.
        // The parent block should refresh via subscription; invoke callback without waiting.
        callback?.({ kind: 'image', file_id: result.fileId, ...(url ? { url } : {}) } as BlockIcon);
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
    },
    [blockId, prepareUpload, finalizeUpload, callback, onDone],
  );

  async function handleSelectRecent(url: string) {
    try {
      // Move selection to front and persist in localStorage
      setRecentUrls((prev) => upsertRecent(RECENT_UPLOAD_URLS_KEY, prev, url, RECENT_LIMIT));
      if (blockId) {
        await setImageByUrl({ blockId, url });
      }
      callback?.({ kind: 'image', url } as BlockIcon);
      onDone?.();
    } catch {
      toast.error('Failed to set image');
    }
  }

  // Allow users to paste an image (from clipboard) or a link to an image.
  // This listens globally while the tab is mounted for a smooth UX.
  React.useEffect(() => {
    const onPaste = (event: Event) => {
      if (uploading) return;
      const e = event as ClipboardEvent;
      const cd = e.clipboardData;
      if (!cd) return;

      // Do not hijack paste when the user is typing into an editable field
      const active = (document.activeElement as HTMLElement | null) ?? undefined;
      const isEditable = !!active && (active.isContentEditable || ['INPUT', 'TEXTAREA'].includes(active.tagName));
      if (isEditable) return;

      // Prefer image content if available
      const items = cd.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            // Fire and let existing upload logic handle progress/errors
            void onPickFile(file);
            e.preventDefault();
            return;
          }
        }
      }

      // Otherwise fall back to text; set by URL if it looks like http(s)
      const text = cd.getData('text');
      if (text && /^https?:\/\//.test(text.trim())) {
        const url = text.trim();
        if (!blockId) {
          const msg = 'Cannot set image without a block';
          setError(msg);
          toast.error(msg);
          return;
        }
        // Update local recents immediately
        setRecentUrls((prev) => upsertRecent(RECENT_UPLOAD_URLS_KEY, prev, url, RECENT_LIMIT));
        // Persist to server and notify parent
        (async () => {
          try {
            await setImageByUrl({ blockId, url });
            callback?.({ kind: 'image', url } as BlockIcon);
            onDone?.();
            toast.success('Icon updated');
          } catch {
            toast.error('Failed to set image');
          }
        })();
        e.preventDefault();
      }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [uploading, blockId, setImageByUrl, callback, onDone, onPickFile]);

  return (
    <>
      <div className="px-3 pt-3">
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
        <p className="text-center text-xs text-muted-foreground-opaque mt-2">or ⌘+V to paste an image or link</p>
      </div>

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
      {recentUrls.length > 0 && (
        <Command shouldFilter={false}>
          <CommandList>
            <CommandGroup heading="Recent" className="text-inherit">
              <div className="grid grid-cols-11 gap-0 px-2 pb-3">
                {recentUrls.slice(0, RECENT_LIMIT).map((url) => (
                  <button
                    key={url}
                    className="hover:bg-hover flex size-8 items-center justify-center rounded p-0.5 cursor-pointer overflow-hidden"
                    onClick={() => handleSelectRecent(url)}
                    title={url}
                  >
                    {/* Render small preview; avoid Next/Image to minimize overhead here */}
                    <img src={url} alt="recent upload" className="h-full w-full rounded object-cover" />
                  </button>
                ))}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      )}
    </>
  );
}

export default UploadTab;
