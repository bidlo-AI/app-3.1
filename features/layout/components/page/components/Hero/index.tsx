'use client';

import { AddIcon } from '../Hero/components/add-icon';
import { IconSelector } from '@/components/icons/icon-selector';
import Icon from '@/components/icons/icon';
import { Show } from '@legendapp/state/react';
import { Button } from '@/components/ui/button';
import { AppWindow, ImageIcon } from 'lucide-react';
import { BlockIcon } from '@/components/icons/icon-selector/components/IconsTab/types';
import { Observable } from '@legendapp/state';
import { use$ } from '@legendapp/state/react';
import { TitleInput } from './components/title-input';
import { usePage } from '../../provider';
import { DescriptionInput } from './components/description-input';
import { AddDescription } from './components/add-description';

export const Hero = () => (
  <div className="group/hero @sm/page:px-12 px-4 w-full">
    {/* <div>Cover image</div> */}
    <div className="-ml-2 flex py-1 items-center group-hover/hero:opacity-100 opacity-0 transition-opacity duration-150">
      <AddIcon />
      <Button variant="ghost_muted" size="xs">
        <ImageIcon className="size-4" />
        Add cover
      </Button>
      <Button variant="ghost_muted" size="xs">
        <AppWindow className="size-4" />
        Add tabs
      </Button>
      <AddDescription />
    </div>
    <div className="flex items-center w-full">
      <IconInput />
      <TitleInput />
    </div>
    <DescriptionInput />
  </div>
);

const IconInput = () => {
  const page$ = usePage();
  const blockId = use$(page$._id);

  return (
    <Show if={page$.icon}>
      <IconSelector blockId={blockId} callback={(icon) => page$.icon.set(icon)}>
        <IconContent icon$={page$.icon} title$={page$.title} />
      </IconSelector>
    </Show>
  );
};

// DescriptionInput moved to ./components/description-input

const IconContent = ({ icon$, title$ }: { icon$: Observable<BlockIcon>; title$: Observable<string> }) => {
  const icon = use$(icon$);
  const title = use$(title$);
  return <Icon icon={icon} title={title} size={36} className="ml-[-3px] mt-1 mr-2 rounded-md hover:bg-hover" />;
};
