'use client';

import * as React from 'react';
import type { Id, Doc } from '@/convex/_generated/dataModel';

import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent, PopoverGroup, PopoverSeparator } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import EmojiTab from './components/EmojiTab';
import IconsTab from './components/IconsTab';
import UploadTab from './components/UploadTab';
import { Switch, use$, useObservable } from '@legendapp/state/react';
import { Observable } from '@legendapp/state';
import { uiState$ } from '@/features/layout/providers/ui-state';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

type BlockIcon = Doc<'blocks'>['icon'];
type Tab = 'emoji' | 'icons' | 'upload';

export function IconSelector({
  children,
  blockId,
  onSelected,
  onClear,
  className,
}: {
  children: React.ReactNode;
  blockId?: Id<'blocks'>;
  onSelected?: (icon: BlockIcon) => void;
  onClear?: () => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('inline-flex cursor-pointer', className)}>{children}</div>
      </PopoverTrigger>
      <Content blockId={blockId} onSelected={onSelected} onClear={onClear} close={() => setOpen(false)} />
    </Popover>
  );
}

const Content = ({
  blockId,
  onSelected,
  onClear,
  close,
}: {
  blockId?: Id<'blocks'>;
  onSelected?: (icon: BlockIcon) => void;
  onClear?: () => void;
  close: () => void;
}) => {
  const clearIcon = useMutation(api.icons.clearPageIcon);
  const search$ = useObservable('');

  //handlers
  async function handleClear() {
    // Clear in DB when tied to a block; otherwise delegate to parent for local state.
    try {
      if (blockId) {
        await clearIcon({ blockId });
        toast.success('Icon removed');
      } else {
        onClear?.();
      }
      search$.set('');
      close();
    } catch {
      toast.error('Failed to remove icon');
    }
  }

  return (
    <PopoverContent className="w-96 p-0">
      <PopoverGroup>
        <div className="flex items-center p-0.5">
          <TabButton tab$={uiState$.iconPicker.tab} label="emoji" />
          <TabButton tab$={uiState$.iconPicker.tab} label="icons" />
          <TabButton tab$={uiState$.iconPicker.tab} label="upload" />
          <div className="ml-auto">
            <Button variant="ghost" size="xs" onClick={handleClear} className="text-muted-foreground">
              Remove
            </Button>
          </div>
        </div>
      </PopoverGroup>
      <PopoverSeparator />
      <Switch value={uiState$.iconPicker.tab}>
        {{
          emoji: () => <EmojiTab blockId={blockId} search$={search$} onSelected={onSelected} close={close} />,
          icons: () => <IconsTab blockId={blockId} search$={search$} onSelected={onSelected} close={close} />,
          upload: () => <UploadTab blockId={blockId} onDone={close} />,
        }}
      </Switch>
    </PopoverContent>
  );
};

function TabButton({ tab$, label }: { tab$: Observable<Tab>; label: Tab }) {
  const active = use$(() => tab$.get() === label);
  return (
    <button
      type="button"
      onClick={() => tab$.set(label)}
      className={cn(
        'cursor-pointer relative hover:bg-hover inline-flex items-center gap-1 rounded-sm px-2 py-1 capitalize',
        active
          ? 'text-foreground after:content-[""] after:absolute after:h-0.5 after:bg-foreground after:bottom-[-7px] after:left-2 after:right-2'
          : 'text-muted-foreground ',
      )}
    >
      {label}
    </button>
  );
}

export default IconSelector;
