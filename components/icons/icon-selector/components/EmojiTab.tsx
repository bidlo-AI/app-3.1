'use client';

import * as React from 'react';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { toTwemojiUrl } from '@/lib/twemoji';
import { toast } from 'sonner';

type BlockIcon = Doc<'blocks'>['icon'];

export function EmojiTab({
  blockId,
  onSelected,
  close,
}: {
  blockId?: Id<'blocks'>;
  onSelected?: (icon: BlockIcon) => void;
  close?: () => void;
}) {
  const [emojiInput, setEmojiInput] = React.useState('');
  const emojiPreview = emojiInput.trim() ? toTwemojiUrl(emojiInput.trim()) : undefined;
  const setEmoji = useMutation(api.icons.setPageIconEmoji);

  async function commitEmoji() {
    const emoji = emojiInput.trim();
    if (!emoji) return;
    try {
      if (blockId) {
        await setEmoji({ blockId, emoji });
        toast.success('Icon updated');
      } else {
        onSelected?.({ kind: 'emoji', emoji });
      }
      close?.();
      setEmojiInput('');
    } catch {
      toast.error('Failed to set emoji');
    }
  }

  return (
    <div className="p-2">
      <div className="flex items-center gap-2">
        <input
          className="bg-input text-foreground placeholder:text-secondary h-9 w-full rounded-md border px-3 outline-hidden"
          placeholder="Type or paste an emoji"
          value={emojiInput}
          onChange={(e) => setEmojiInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEmoji();
          }}
        />
        <Button size="sm" onClick={commitEmoji} disabled={!emojiInput.trim()}>
          Set
        </Button>
      </div>
      {emojiPreview && (
        <div className="mt-3 flex items-center gap-2">
          <img src={emojiPreview} alt="preview" className="size-8" />
          <span className="text-sm text-muted-foreground">Preview</span>
        </div>
      )}
    </div>
  );
}

export default EmojiTab;
