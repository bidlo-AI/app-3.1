'use client';

import { Id } from '@/convex/_generated/dataModel';
import { Show } from '@legendapp/state/react';
import { EmptyStateRow } from '../../empty-state-row';
import { PageItem } from '../../page-item';
import { Observable } from '@legendapp/state';
import { useHandleAddPage } from '../../page-item/utils';

export const Children = ({
  open$,
  pages,
  teamId,
}: {
  open$: Observable<boolean>;
  pages: { _id: string; title: string; icon?: unknown }[];
  teamId: Id<'teams'>;
}) => {
  //handlers
  const handleAddPage = useHandleAddPage();

  return (
    <Show if={open$}>
      {Array.isArray(pages) && pages.length === 0 && <EmptyStateRow indent={1} />}
      {Array.isArray(pages) && pages.length > 0 && (
        <div className="flex flex-col gap-px">
          {pages.map((p) => (
            <div key={p._id}>
              <PageItem
                id={p._id as Id<'blocks'>}
                title={p.title}
                icon={p.icon as any}
                indent={1}
                scope="team"
                teamId={teamId}
                handleAddPage={handleAddPage}
              />
            </div>
          ))}
        </div>
      )}
    </Show>
  );
};
