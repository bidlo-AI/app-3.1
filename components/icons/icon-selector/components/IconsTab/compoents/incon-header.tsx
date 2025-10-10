import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/icons/icon-selector/components/search-input';
import { ArrowRightLeft } from 'lucide-react';
import { Observable } from '@legendapp/state';
import { use$ } from '@legendapp/state/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Shared hue names for icon coloring. These map to CSS variables defined in globals.css
export type Hue = 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red';

const HUES: Hue[] = ['default', 'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];

function Swatch({ hue, selected, onSelect }: { hue: Hue; selected: boolean; onSelect: (h: Hue) => void }) {
  // Render a ring with a smaller colored dot inside to mimic a radial swatch.
  const dotStyle = {
    backgroundColor: `var(--color-${hue === 'default' ? 'foreground' : hue})`,
  } as React.CSSProperties;
  return (
    <button
      type="button"
      aria-label={hue}
      title={hue}
      onClick={() => onSelect(hue)}
      className={cn(
        'flex items-center justify-center size-5 rounded-full border border-border',
        selected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : 'ring-0',
      )}
    >
      <span className="size-3 rounded-full" style={dotStyle} />
    </button>
  );
}

export const Header = ({
  search$,
  onRandom,
  color$,
}: {
  search$: Observable<string>;
  onRandom: () => void;
  color$: Observable<Hue>;
}) => {
  const current = use$(color$);
  const triggerStyle = {
    backgroundColor: `var(--color-${current === 'default' ? 'foreground' : current})`,
  } as React.CSSProperties;

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1.5 pb-1 pt-2">
      <SearchInput search$={search$} />
      <Button aria-label="Random icon" variant="outline" size="icon" onClick={onRandom}>
        <ArrowRightLeft className="size-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button aria-label="Choose color" variant="outline" size="icon">
            <div className="size-3 rounded-full" style={triggerStyle} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <div className="grid grid-cols-5 gap-2">
            {HUES.map((h) => (
              <Swatch key={h} hue={h} selected={current === h} onSelect={(hh) => color$.set(hh)} />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
