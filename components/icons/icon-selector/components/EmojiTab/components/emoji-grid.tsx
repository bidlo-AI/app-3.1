'use client';

import * as React from 'react';
import { fromUnified } from '../lib';

const NativeEmoji = React.memo(function NativeEmoji({ unified, label }: { unified: string; label: string }) {
  const char = React.useMemo(() => fromUnified(unified), [unified]);
  return (
    <span
      aria-label={label}
      className="size-5 text-[26px] leading-none select-none flex items-center justify-center"
      draggable={false}
    >
      {char}
    </span>
  );
});

export const EmojiGrid = React.memo(function EmojiGrid({
  items,
  onSelect,
}: {
  items: string[];
  onSelect: (unified: string) => void;
}) {
  return (
    <div className="grid grid-cols-11 gap-0 px-2">
      {items.map((unified) => (
        <button
          key={unified}
          className="hover:bg-hover flex size-8 items-center justify-center rounded p-1 cursor-pointer"
          onClick={() => onSelect(unified)}
          title={fromUnified(unified)}
        >
          <NativeEmoji unified={unified} label="emoji" />
        </button>
      ))}
    </div>
  );
});
