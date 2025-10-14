'use client';

import { useCallback, useEffect, useRef } from 'react';
import EditableH1 from '@/features/blocks/components/editable-h1';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { use$ } from '@legendapp/state/react';
import { usePage } from '../../../provider';

// Editable title as Notion-style contentEditable h1 with debounced autosave.
export function TitleInput() {
  const page$ = usePage();

  const updateBlock = useMutation(api.blocks.updateBlock);

  // Track last saved value to avoid redundant writes
  const lastSavedTitleRef = useRef<string | undefined>(page$.title.get());
  useEffect(() => {
    lastSavedTitleRef.current = page$.title.get();
  }, [page$.title]);

  // Debounce via PlainEditable's debounceMs; also flush on blur
  const currentTitle = use$(page$.title);

  const handleCommit = useCallback(
    async (value: string) => {
      // Optimistically update local observable for immediate UX feedback
      if (value !== (page$.title.get() ?? '')) {
        page$.title.set(value);
      }
      // De-dupe network writes
      if (value === (lastSavedTitleRef.current ?? '')) return;
      await updateBlock({ blockId: page$._id.get(), title: value });
      lastSavedTitleRef.current = value;
    },
    [page$._id, page$.title, updateBlock],
  );

  return (
    <EditableH1
      initialValue={currentTitle ?? ''}
      placeholder="Untitled"
      debounceMs={500}
      onCommit={handleCommit}
      aria-label="Edit title"
      style={{ fontSize: '32px' }}
    />
  );
}
