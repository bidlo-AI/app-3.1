'use client';

import { AddIcon } from '../Hero/components/add-icon';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { IconSelector } from '@/components/icons/icon-selector';
import Icon from '@/components/icons/icon';
import { Show, useObservable, Memo } from '@legendapp/state/react';
import { Button } from '@/components/ui/button';
import { AppWindow, ImageIcon, InfoIcon } from 'lucide-react';
import { useEffect } from 'react';
import { BlockIcon } from '@/components/icons/icon-selector/components/IconsTab/types';
import { Observable } from '@legendapp/state';
import { use$ } from '@legendapp/state/react';
import { TitleInput } from './components/title-input';

type HeroState = {
  icon: BlockIcon;
  title: string;
  show_description: boolean;
  description: string;
};

export const Hero = ({ preloaded }: { preloaded: Preloaded<typeof api.blocks.getBlock> }) => {
  // const data = usePreloadedQuery(preloaded);
  const state$ = useObservable({
    icon: preloaded._valueJSON.block.icon,
    title: preloaded._valueJSON.block.title,
    show_description: true,
    description: 'example description',
  }) as Observable<HeroState>;

  // hooks
  const id = useBlock({ state$, preloaded });

  //handlers
  const handleSelect = (icon: BlockIcon) => {
    state$.icon.set(icon);
  };

  return (
    <div className="group/hero @sm/page:px-12 px-4 w-full">
      {/* <div>Cover image</div> */}
      <div className="-ml-2 flex py-1 items-center group-hover/hero:opacity-100 opacity-0 transition-opacity duration-150">
        <AddIcon icon={state$.icon} blockId={id} />
        <Button variant="ghost_muted" size="xs">
          <ImageIcon className="size-4" />
          Add cover
        </Button>
        <Button variant="ghost_muted" size="xs">
          <InfoIcon className="size-4" />
          Add description
        </Button>
        <Button variant="ghost_muted" size="xs">
          <AppWindow className="size-4" />
          Add tabs
        </Button>
      </div>
      <div className="flex items-center w-full">
        <Show if={state$.icon}>
          <IconSelector blockId={id} callback={handleSelect}>
            <IconContent icon$={state$.icon} title$={state$.title} />
          </IconSelector>
        </Show>
        <TitleInput blockId={id} title$={state$.title} serverTitle={preloaded._valueJSON.block.title} />
      </div>

      <Show if={state$.show_description}>
        <div className="text-muted-foreground pt-[3px] pb-1">
          <Memo>{state$.description}</Memo>
        </div>
      </Show>
    </div>
  );
};

const useBlock = ({
  state$,
  preloaded,
}: {
  state$: Observable<HeroState>;
  preloaded: Preloaded<typeof api.blocks.getBlock>;
}) => {
  const data = usePreloadedQuery(preloaded);

  //listeners
  useEffect(() => {
    const icon = state$.icon.get();
    if (icon !== data.block.icon) state$.icon.set(data.block.icon);
  }, [data?.block?.icon, state$]);
  useEffect(() => {
    const title = state$.title.get();
    if (title !== data.block.title) state$.title.set(data.block.title);
  }, [data?.block?.title, state$]);

  return data.block._id;
};

const IconContent = ({ icon$, title$ }: { icon$: Observable<BlockIcon>; title$: Observable<string> }) => {
  const icon = use$(icon$);
  const title = use$(title$);
  return <Icon icon={icon} title={title} size={36} className="ml-[-3px] mt-1 mr-2 rounded-md hover:bg-hover" />;
};
