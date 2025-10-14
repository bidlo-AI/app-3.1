'use client';

import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { Show } from '@legendapp/state/react';
import { batch } from '@legendapp/state';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { popOverState$ } from '@/features/layout/providers/popover-state';
import { uiState$ } from '@/features/layout/providers/ui-state';

import { usePage } from '../../../provider';

// Local alias for the blocks.icon type from Convex schema

// Minimal helper to convert unified code (e.g. "1F600" or "1F469-1F3FD") to a native emoji
function fromUnified(unified: string) {
  return unified
    .split('-')
    .map((h) => String.fromCodePoint(parseInt(h, 16)))
    .join('');
}

export const AddIcon = () => {
  const page$ = usePage();
  const setEmoji = useMutation(api.icons.setPageIconEmoji);
  const [emojiData, setEmojiData] = useState<Record<string, Array<{ u: string }>> | null>(null);

  // Load emoji data on mount (same data source as EmojiTab)
  useEffect(() => {
    let mounted = true;
    void import('emoji-picker-react/src/data/emojis.json')
      .then((mod) => {
        if (!mounted) return;
        const json = (mod as unknown as { default: Record<string, Array<{ u: string }>> }).default;
        setEmojiData(json);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleClick = async () => {
    const blockId = page$._id.get();
    try {
      batch(() => {
        uiState$.iconPicker.tab.set('emoji');
        popOverState$['block-icon'].open.set(true);
      });

      const all = emojiData ? Object.values(emojiData).flat() : [];

      // Fallback to a small curated list if dataset missing for any reason
      const pick = () => {
        if (all.length > 0) return all[(Math.random() * all.length) | 0].u;
        const fallback = ['1F600', '1F60A', '1F44B', '2764', '1F44D'];
        return fallback[(Math.random() * fallback.length) | 0];
      };

      const unified = pick();
      const emojiChar = fromUnified(unified);

      // Optimistic local update
      page$.icon.set({ kind: 'emoji', emoji: emojiChar });

      // Persist to DB (fire-and-forget, same as EmojiTab)
      setEmoji({ blockId, emoji: emojiChar });
    } catch {
      toast.error('Failed to add emoji icon');
    }
  };

  return (
    <Show if={() => !page$.icon.get()}>
      <Button variant="ghost_muted" size="xs" onClick={handleClick}>
        <Smile className="size-4" />
        AddIcon
      </Button>
    </Show>
  );
};
