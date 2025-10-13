'use client';

import * as React from 'react';
import { fromUnified } from '../lib';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  getLabel,
}: {
  items: string[];
  onSelect: (unified: string) => void;
  getLabel?: (unified: string) => string;
}) {
  return (
    <div className="grid grid-cols-11 gap-0 px-2">
      {items.map((unified) => {
        const label = getLabel ? getLabel(unified) : fromUnified(unified);
        return (
          <TooltipPrimitive.Root key={unified}>
            <TooltipTrigger asChild>
              <button
                className="hover:bg-hover flex size-8 items-center justify-center rounded p-1 cursor-pointer"
                onClick={() => onSelect(unified)}
                aria-label={label}
              >
                <NativeEmoji unified={unified} label={label} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="capitalize">{label}</TooltipContent>
          </TooltipPrimitive.Root>
        );
      })}
    </div>
  );
});
