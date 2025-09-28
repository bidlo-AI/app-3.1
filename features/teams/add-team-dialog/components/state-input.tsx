import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, MapPin } from 'lucide-react';
import { Observable } from '@legendapp/state';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { US_STATES } from '@/lib/states';

export interface StateInputProps {
  $value: Observable<string>;
  className?: string;
}

export const StateInput = ({ $value, className }: StateInputProps) => {
  const [open, setOpen] = useState(false);

  //handlers
  const handleSelect = (currentValue: string) => {
    $value.set(currentValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger
        className={cn(
          'bg-input px-2 h-9 flex gap-2 items-center justify-between rounded-md border border-input text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer w-full',
          className,
        )}
      >
        <MapPin className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn('text-left flex-1 text-sm', !$value.get() && 'text-muted-foreground')}>
          {$value.get() || 'Select a state'}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        className="p-0 shadow-md border-border/30"
        align="start"
        alignOffset={0}
        sideOffset={-37}
        avoidCollisions={false}
        noAnimation
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command className="rounded-lg border-none" autoFocus>
          <CommandInput className="h-9" placeholder="Search states..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {US_STATES.map((state) => (
                <CommandItem
                  key={state}
                  value={state}
                  onSelect={() => handleSelect(state)}
                  className="flex items-center justify-between"
                >
                  {state}
                  {$value.get() === state && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
