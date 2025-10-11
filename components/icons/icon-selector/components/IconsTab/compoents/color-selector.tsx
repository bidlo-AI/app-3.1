import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import type { Color } from '@/types/ui';

// Centralized hues list for the selector. Keep in sync with `Color` and CSS vars.
const HUES: Color[] = ['default', 'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];

function Swatch({ color, selected, onSelect }: { color: Color; selected: boolean; onSelect: (c: Color) => void }) {
  const exactColor = useMemo(() => (color === 'default' ? 'foreground' : color), [color]);
  const dotStyle = useMemo(
    () =>
      ({
        backgroundColor: `var(--color-${exactColor})`,
      }) as React.CSSProperties,
    [exactColor],
  );

  //handlers
  const handleSelect = () => {
    onSelect(color);
  };

  return (
    // Tooltip shows the color name on hover/focus for better clarity.
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={color}
          title={color}
          onClick={handleSelect}
          className={cn(
            'flex items-center justify-center size-5 rounded-full cursor-pointer',
            selected
              ? `ring-2 ring-offset-0 ring-offset-popover ring-${exactColor}`
              : 'ring-2 ring-popover hover:ring-secondary',
          )}
        >
          <span className="size-4 rounded-full" style={dotStyle} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="capitalize">
        {color}
      </TooltipContent>
    </Tooltip>
  );
}

export function ColorSelector({
  value,
  onChange,
  children,
  align = 'end',
}: {
  value: Color;
  onChange: (c: Color) => void;
  children: React.ReactNode; // Trigger element (e.g., a Button)
  align?: 'start' | 'center' | 'end';
}) {
  const [open, setOpen] = useState(false);

  //handlers
  const handleSelect = (c: Color) => {
    onChange(c);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2 grid grid-cols-5 gap-x-1.5 gap-y-2" align={align}>
        {HUES.map((hue) => (
          <Swatch key={hue} color={hue} selected={value === hue} onSelect={handleSelect} />
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default ColorSelector;
