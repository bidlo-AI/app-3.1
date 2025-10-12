'use client';

import * as React from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const prepareUpload = useMutation(api.icons.prepareUploadPageIcon);
  const finalizeUpload = useMutation(api.icons.finalizeUploadPageIcon);

  async function onPickFile(file: File) {
    if (!file) return;
    if (!blockId) {
      toast.error('Cannot upload without a block');
      return;
    }
    try {
      setUploading(true);
      const { uploadUrl, fileId } = await prepareUpload({
        blockId,
        filename: file.name,
        mime: file.type,
        size: file.size,
      });
      // Step 2: POST the file to Convex's short-lived upload URL
      // See: https://docs.convex.dev/file-storage/upload-files
      const res = await fetch(uploadUrl, { method: 'POST', body: file, headers: { 'Content-Type': file.type } });
      if (!res.ok) throw new Error('Upload failed');
      const { storageId } = (await res.json()) as { storageId: Id<'_storage'> };
      // Step 3: Persist the storage id and set the block's icon to this image
      await finalizeUpload({ blockId, fileId, storageId });
      toast.success('Icon updated');

      // Optimistically update parent with a direct URL if available via finalize
      // We don't have the URL from finalize response, but Icon component now prefers url if present on block icon.
      // The parent block should refresh via subscription; invoke callback without waiting.
      callback?.({ kind: 'image', file_id: fileId } as BlockIcon);
      onDone?.();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-3">
      <label
        className={cn(
          'bg-muted/40 text-foreground hover:bg-hover flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-8',
          uploading && 'opacity-70 pointer-events-none',
        )}
      >
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Upload image</div>
            <div className="text-muted-foreground text-xs">PNG, JPG, WEBP, AVIF up to 512 KB</div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={(e) => {
            e.preventDefault();
            inputRef.current?.click();
          }}
        >
          Choose
        </Button>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
          ref={inputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
            e.currentTarget.value = '';
          }}
        />
      </label>
    </div>
  );
}

export default UploadTab;
