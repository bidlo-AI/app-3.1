'use client';

import { AddIcon } from '../Hero/components/add-icon';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { IconSelector } from '@/components/icons/icon-selector';
import Icon from '@/components/icons/icon';
import { Show, useObservable, Memo } from '@legendapp/state/react';
import { Button } from '@/components/ui/button';

export const Hero = ({ preloaded }: { preloaded: Preloaded<typeof api.blocks.getBlock> }) => {
  const data = usePreloadedQuery(preloaded);
  const state$ = useObservable({
    icon: data.block.icon,
    title: data.block.title,
    show_description: true,
    description: 'example description',
  });

  return (
    <div className="group/hero sm:px-12 px-4">
      {/* //! page context wrapper*/}

      {/* <div>Cover image</div> */}
      <div className="-ml-2 flex h-9 items-center group-hover/hero:opacity-100 opacity-0 transition-opacity duration-150">
        <AddIcon />
        <Button variant="ghost" size="xs" className="text-muted-foreground-opaque">
          Add cover
        </Button>
        <Button variant="ghost" size="xs" className="text-muted-foreground-opaque">
          Add description
        </Button>
      </div>
      <div className="flex items-center">
        <IconSelector blockId={data.block._id}>
          <Icon
            icon={data.block.icon}
            title={data.block.title}
            className="size-9 ml-[-3px] mt-1 mr-2 rounded-md hover:bg-hover"
          />
        </IconSelector>
        <div className="text-[32px] font-bold">Title</div>
      </div>

      <Show if={state$.show_description}>
        <div className="text-muted-foreground pt-[3px] pb-1">
          <Memo>{state$.description}</Memo>
        </div>
      </Show>
    </div>
  );
};
