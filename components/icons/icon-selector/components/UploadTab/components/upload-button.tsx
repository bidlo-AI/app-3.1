import * as React from 'react';
import { ImageIcon } from 'lucide-react';

export function UploadButton({ disabled, onSelect }: { disabled?: boolean; onSelect: (file: File) => void }) {
  return (
    <label className="w-full bg-hover hover:bg-secondary/50 rounded-md p-4 flex items-center justify-center cursor-pointer text-muted-foreground-opaque gap-2">
      <ImageIcon className="size-4" />
      <span>Upload an image</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.currentTarget.value = '';
        }}
      />
    </label>
  );
}
