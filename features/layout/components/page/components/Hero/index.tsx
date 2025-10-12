'use client';

import { AddIcon } from '../Hero/components/add-icon';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { IconSelector } from '@/components/icons/icon-selector';
import Icon from '@/components/icons/icon';
import { Show, useObservable, Memo } from '@legendapp/state/react';
import { Button } from '@/components/ui/button';
import { ImageIcon, InfoIcon } from 'lucide-react';
import { useEffect } from 'react';
import { BlockIcon } from '@/components/icons/icon-selector/components/IconsTab/types';
import { Observable } from '@legendapp/state';
import { use$ } from '@legendapp/state/react';

export const Hero = ({ preloaded }: { preloaded: Preloaded<typeof api.blocks.getBlock> }) => {
  const data = usePreloadedQuery(preloaded);
  const state$ = useObservable({
    icon: data.block.icon,
    title: data.block.title,
    show_description: true,
    description: 'example description',
  });

  //listener
  useEffect(() => {
    const description = state$.description.get();
    if (description !== data.block.description) state$.show_description.set(true);
  }, [data?.block?.description]);
  useEffect(() => {
    const icon = state$.icon.get();
    if (icon !== data.block.icon) state$.icon.set(data.block.icon);
  }, [data?.block?.icon]);
  useEffect(() => {
    const title = state$.title.get();
    if (title !== data.block.title) state$.title.set(data.block.title);
  }, [data?.block?.title]);

  //handlers
  const handleSelect = (icon: BlockIcon) => {
    state$.icon.set(icon);
  };

  return (
    <div className="group/hero sm:px-12 px-4">
      {/* <div>Cover image</div> */}
      <div className="-ml-2 flex py-1 items-center group-hover/hero:opacity-100 opacity-0 transition-opacity duration-150">
        <AddIcon icon={state$.icon} blockId={data.block._id} />
        <Button variant="ghost_muted" size="xs">
          <ImageIcon className="size-4" />
          Add cover
        </Button>
        <Button variant="ghost_muted" size="xs">
          <InfoIcon className="size-4" />
          Add description
        </Button>
      </div>
      <div className="flex items-center">
        <Show if={state$.icon}>
          <IconSelector blockId={data.block._id} callback={handleSelect}>
            <IconContent icon$={state$.icon} title$={state$.title} />
          </IconSelector>
        </Show>
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

const IconContent = ({ icon$, title$ }: { icon$: Observable<BlockIcon>; title$: Observable<string> }) => {
  const icon = use$(icon$);
  const title = use$(title$);
  return <Icon icon={icon} title={title} className="size-9 ml-[-3px] mt-1 mr-2 rounded-md hover:bg-hover" />;
};
