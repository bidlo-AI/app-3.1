import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';
import { usePreloadedQuery } from 'convex/react';
import { useObservable } from '@legendapp/state/react';
import { Show } from '@legendapp/state/react';
import { Id } from '@/convex/_generated/dataModel';
import { SectionHeader } from './components/header';
import { PageItem } from '../page-item';
import { useHandleAddPage } from '../page-item/utils';
import { AddIconButton } from '../buttons/add-icon-button';

export const PrivateSection = ({
  preloadedPrivatePages,
}: {
  preloadedPrivatePages: Preloaded<typeof api.blocks.listPrivatePages>;
}) => {
  const privatePages = usePreloadedQuery(preloadedPrivatePages) ?? [];
  const open$ = useObservable(true);

  //handlers
  const handleAddPage = useHandleAddPage();

  return (
    <>
      <SectionHeader title="Private" onToggle={() => open$.set((prev: boolean) => !prev)}>
        <AddIconButton
          ariaLabel="Add a page"
          tooltipText="Add a page"
          className="size-7 opacity-0 group-hover/list-row:opacity-100 focus:opacity-100"
          onClick={() => handleAddPage({ scope: 'private' })}
        />
      </SectionHeader>
      <Show if={open$}>
        <div className="flex flex-col gap-px pb-3">
          {privatePages.map((p) => (
            <PageItem
              key={p._id}
              id={p._id as Id<'blocks'>}
              title={p.title}
              icon={p.icon}
              indent={0}
              scope="private"
              handleAddPage={handleAddPage}
            />
          ))}
        </div>
      </Show>
    </>
  );
};
