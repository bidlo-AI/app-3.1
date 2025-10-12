import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/icons/icon-selector/components/search-input';
import { ArrowRightLeft } from 'lucide-react';
import { Observable } from '@legendapp/state';
import { use$ } from '@legendapp/state/react';
import { ColorSelector } from '@/components/icons/icon-selector/components/IconsTab/compoents/color-selector';
import type { Color } from '@/types/ui';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export const Header = ({
  search$,
  onRandom,
  color$,
}: {
  search$: Observable<string>;
  onRandom: () => void;
  color$: Observable<Color>;
}) => {
  const current = use$(color$);
  const triggerStyle = {
    backgroundColor: `var(--color-${current === 'default' ? 'foreground' : current})`,
  } as React.CSSProperties;

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1.5 pb-1 pt-2">
      <SearchInput search$={search$} />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Random icon" variant="outline" size="icon" onClick={onRandom}>
            <ArrowRightLeft className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Random</TooltipContent>
      </Tooltip>
      <Tooltip>
        <ColorSelector value={current} onChange={(c) => color$.set(c)} align="start">
          <TooltipTrigger asChild>
            <Button aria-label="Choose color" variant="outline" size="icon">
              <div className="size-3 rounded-full" style={triggerStyle} />
            </Button>
          </TooltipTrigger>
        </ColorSelector>
        <TooltipContent side="bottom">Select icon color</TooltipContent>
      </Tooltip>
    </div>
  );
};
