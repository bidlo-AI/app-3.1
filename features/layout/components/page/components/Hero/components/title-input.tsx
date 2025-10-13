'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Input$ } from '@/components/ui/input';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { Observable } from '@legendapp/state';
import { use$ } from '@legendapp/state/react';

type TitleInputProps = {
  blockId: Id<'blocks'>;
  title$: Observable<string>;
  serverTitle?: string;
};

// Editable title with debounced autosave and immediate save on blur/Enter.
export function TitleInput({ blockId, title$, serverTitle }: TitleInputProps) {
  const updateTitle = useMutation(api.blocks.updateTitle);

  // Track last saved value to avoid redundant writes
  const lastSavedTitleRef = useRef<string | undefined>(serverTitle);
  useEffect(() => {
    lastSavedTitleRef.current = serverTitle;
  }, [serverTitle]);

  // Debounce timer and reactive value for dependency
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTitle = use$(title$);

  const flushSave = useCallback(async () => {
    const value = title$.get();
    if (value === lastSavedTitleRef.current) return;
    await updateTitle({ blockId, title: value });
    lastSavedTitleRef.current = value;
  }, [blockId, title$, updateTitle]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      void flushSave();
    }, 500);
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [currentTitle, flushSave]);

  return (
    <Input$
      $value={title$}
      placeholder="Untitled"
      style={{ fontSize: '32px' }}
      className="truncate w-full font-bold h-auto p-0 border-0 bg-transparent shadow-none rounded-none leading-tight focus-visible:ring-0 focus-visible:border-0"
      onBlur={() => {
        void flushSave();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      aria-label="Edit title"
    />
  );
}
