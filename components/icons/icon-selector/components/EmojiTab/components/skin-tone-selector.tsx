'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { SkinToneKey } from '../types';
import { fromUnified, SKIN_TONES } from '../lib';

export function SkinToneSelector({ value, onChange }: { value: SkinToneKey; onChange: (v: SkinToneKey) => void }) {
  const [open, setOpen] = React.useState(false);
  const unified = value === 'neutral' ? '270B' : `270B-${value}`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button focusable aria-label="Choose skin tone" variant="outline" size="icon">
              <span className="text-xl leading-none select-none">{fromUnified(unified)}</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Select skin tone</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-auto">
        <div className="flex items-center gap-1 p-1">
          {SKIN_TONES.map((t) => {
            const u = t.key === 'neutral' ? '270B' : `270B-${t.key}`;
            return (
              <button
                key={t.key}
                type="button"
                aria-label={t.label}
                className="hover:bg-hover flex size-7 items-center justify-center rounded cursor-pointer"
                onClick={() => {
                  onChange(t.key);
                  setOpen(false);
                }}
              >
                <span className="text-xl leading-none select-none">{fromUnified(u)}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
