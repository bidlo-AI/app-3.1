'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Show } from '@legendapp/state/react';
import { Observable } from '@legendapp/state';
import { use$ } from '@legendapp/state/react';
import { usePage } from '../../../provider';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import EditableDiv from '@/features/blocks/components/editable-div';

// Notion-style contentEditable description with placeholder and reactive binding to page state
export function DescriptionInput() {
  const page$ = usePage();
  const editableRef = useRef<HTMLDivElement | null>(null);
  const updateBlock = useMutation(api.blocks.updateBlock);
  const description = use$(page$.description as Observable<string | undefined>) ?? '';

  // Track last saved value to avoid redundant writes
  const lastSavedRef = useRef<string | undefined>(description);
  useEffect(() => {
    lastSavedRef.current = description;
  }, [description]);

  // Focus the description input when it becomes visible (un-hidden)
  const isHidden = use$(page$.hide_description as Observable<boolean | undefined>) ?? false;
  const prevHiddenRef = useRef<boolean>(page$.hide_description.get() ?? false);
  useEffect(() => {
    if (prevHiddenRef.current && !isHidden) {
      const el = editableRef.current;
      if (el) {
        el.focus();
      }
    }
    prevHiddenRef.current = isHidden;
  }, [isHidden]);

  // Subscribe to description for external updates (no per-keystroke writes from editor)
  const handleCommit = useCallback(
    (value: string) => {
      // Update observable only when changed
      if (value !== (page$.description.get() ?? '')) {
        page$.description.set(value);
      }
      // De-duped network save
      if (value === (lastSavedRef.current ?? '')) return;
      void updateBlock({ blockId: page$._id.get(), description: value }).then(() => {
        lastSavedRef.current = value;
      });
    },
    [page$._id, page$.description, updateBlock],
  );

  return (
    <Show if={() => !page$.hide_description.get()}>
      <div className="pt-[3px] pb-1 cursor-text">
        <EditableDiv
          ref={editableRef}
          onCommit={handleCommit}
          initialValue={description}
          placeholder="Add a description…"
          aria-label="Start typing to edit text"
          className="text-muted-foreground ps-1.5 pb-1 pt-[3px]"
        />
      </div>
    </Show>
  );
}
