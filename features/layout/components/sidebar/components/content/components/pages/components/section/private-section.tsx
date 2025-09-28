import { useMutation } from 'convex/react';

import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';
import { usePreloadedQuery } from 'convex/react';
import { useObservable } from '@legendapp/state/react';
import { useCallback } from 'react';
import { Show } from '@legendapp/state/react';
import { Id } from '@/convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import { SectionHeader } from './components/header';
import { PageItem } from '../page-item';

//variables
const DEFAULT_PAGE_NAME = 'New page';

//types
type handleAddPageType = {
  scope: 'private' | 'team';
  teamId?: Id<'teams'>;
  parentId?: Id<'blocks'>;
  title?: string;
};

export const PrivateSection = ({
  preloadedPrivatePages,
}: {
  preloadedPrivatePages: Preloaded<typeof api.blocks.listPrivatePages>;
}) => {
  const privatePages = usePreloadedQuery(preloadedPrivatePages) ?? [];
  const createPage = useMutation(api.blocks.createPage);
  const open$ = useObservable(true);
  const router = useRouter();

  //handlers
  const handleAddPage = useCallback(
    async ({ teamId, parentId, title = DEFAULT_PAGE_NAME }: handleAddPageType) => {
      const res = await createPage({
        scope: 'private',
        teamId,
        title,
        parentId,
      });
      if (res?.blockId) router.push(`/${res.blockId}`);
    },
    [createPage, router],
  );

  return (
    <>
      <SectionHeader
        title="Private"
        onToggle={() => open$.set((prev: boolean) => !prev)}
        onAdd={() => handleAddPage({ scope: 'private', parentId: undefined, title: 'New private page' })}
        tooltip={'Add private page'}
      />
      <Show if={open$}>
        <div className="flex flex-col gap-px">
          {privatePages.map((p) => (
            <PageItem
              key={p._id}
              id={p._id as Id<'blocks'>}
              title={p.title}
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
