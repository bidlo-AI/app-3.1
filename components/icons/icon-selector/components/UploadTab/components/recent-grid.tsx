import { Command, CommandList, CommandGroup } from '@/components/ui/command';

export function RecentGrid({ urls, onSelect }: { urls: string[]; onSelect: (url: string) => void }) {
  if (!urls.length) return null;
  return (
    <Command shouldFilter={false}>
      <CommandList>
        <CommandGroup heading="Recent" className="text-inherit">
          <div className="grid grid-cols-11 gap-0 px-2 pb-3">
            {urls.map((url) => (
              <button
                key={url}
                className="hover:bg-hover flex size-8 items-center justify-center rounded p-0.5 cursor-pointer overflow-hidden"
                onClick={() => onSelect(url)}
                title={url}
              >
                <img src={url} alt="recent upload" className="h-full w-full rounded object-cover" />
              </button>
            ))}
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
