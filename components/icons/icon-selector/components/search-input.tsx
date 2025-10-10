import { CommandInput } from '@/components/ui/command';
import { use$, Show } from '@legendapp/state/react';
import { Button } from '@/components/ui/button';
import { Observable } from '@legendapp/state';
import { useRef } from 'react';

export const SearchInput = ({ search$ }: { search$: Observable<string> }) => {
  const value = use$(search$);
  const rootRef = useRef<HTMLDivElement>(null);

  //handlers
  const handleClear = () => {
    search$.set('');
    (rootRef.current?.querySelector('[data-slot="command-input"]') as HTMLInputElement | null)?.focus();
  };

  return (
    <div className="relative" ref={rootRef}>
      <CommandInput
        value={value}
        onValueChange={(v) => search$.set(v)}
        placeholder="Filter..."
        containerClassName="px-2 border-input bg-input rounded-sm h-7"
        autoFocus
      />
      <Show if={search$.get()}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute size-6 right-0.5 top-1/2 -translate-y-1/2"
        >
          <svg
            aria-hidden="true"
            role="graphics-symbol"
            viewBox="0 0 16 16"
            className="clearInput"
            fill="currentColor"
            opacity={0.5}
          >
            <path d="M7.993 15.528a7.273 7.273 0 01-2.923-.593A7.633 7.633 0 012.653 13.3a7.797 7.797 0 01-1.633-2.417 7.273 7.273 0 01-.593-2.922c0-1.035.198-2.01.593-2.922A7.758 7.758 0 015.063.99 7.273 7.273 0 017.985.395a7.29 7.29 0 012.93.593 7.733 7.733 0 012.417 1.64 7.647 7.647 0 011.64 2.41c.396.914.594 1.888.594 2.923 0 1.035-.198 2.01-.593 2.922a7.735 7.735 0 01-4.058 4.05 7.272 7.272 0 01-2.922.594zM5.59 11.06c.2 0 .371-.066.513-.198L8 8.951l1.904 1.911a.675.675 0 00.498.198.667.667 0 00.491-.198.67.67 0 00.205-.49.64.64 0 00-.205-.491L8.981 7.969l1.92-1.911a.686.686 0 00.204-.491.646.646 0 00-.205-.484.646.646 0 00-.483-.205.67.67 0 00-.49.205L8 6.995 6.081 5.083a.696.696 0 00-.49-.19.682.682 0 00-.491.198.651.651 0 00-.198.49c0 .181.068.342.205.484l1.912 1.904-1.912 1.92a.646.646 0 00-.205.483c0 .19.066.354.198.49.136.132.3.198.49.198z"></path>
          </svg>
        </Button>
      </Show>
    </div>
  );
};
