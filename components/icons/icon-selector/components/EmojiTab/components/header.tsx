'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowRightLeft } from 'lucide-react';
import type { Observable } from '@legendapp/state';
import { SearchInput } from '../../search-input';
import { SkinToneSelector } from './skin-tone-selector';
import type { SkinToneKey } from '../types';

export function Header({
  search$,
  onRandom,
  skinTone,
  onToneChange,
}: {
  search$: Observable<string>;
  onRandom: () => void;
  skinTone: SkinToneKey;
  onToneChange: (tone: SkinToneKey) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1.5 pb-1 pt-2">
      <SearchInput search$={search$} />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Random emoji" variant="outline" size="icon" onClick={onRandom}>
            <ArrowRightLeft className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Random</TooltipContent>
      </Tooltip>
      <div>
        <SkinToneSelector value={skinTone} onChange={onToneChange} />
      </div>
    </div>
  );
}
