'use client';

import * as React from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function UploadTab({ blockId, onDone }: { blockId?: Id<'blocks'>; onDone?: () => void }) {
  const [uploading, setUploading] = React.useState(false);
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
      const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!res.ok) throw new Error('Upload failed');
      await finalizeUpload({ blockId, fileId });
      toast.success('Icon updated');
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
        <Button variant="secondary" size="sm" disabled={uploading}>
          Choose
        </Button>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
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
