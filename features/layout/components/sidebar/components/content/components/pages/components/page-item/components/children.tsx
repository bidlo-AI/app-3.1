'use client';

import { useQuery } from 'convex/react';
import { Show, use$ } from '@legendapp/state/react';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { EmptyStateRow } from '../../empty-state-row';
import { Observable } from '@legendapp/state';
import { HandleAddPage } from '../types';
import { PageItem } from '../index';

export const Children = ({
  id,
  indent,
  scope,
  teamId,
  handleAddPage,
  open$,
}: {
  id: Id<'blocks'>;
  teamId?: Id<'teams'>;
  indent: number;
  scope: 'private' | 'team';
  open$: Observable<boolean>;
  handleAddPage: HandleAddPage;
}) => {
  const isOpen = use$(open$);
  const children = useQuery(api.blocks.listChildren, isOpen && id ? { parentId: id } : 'skip');

  return (
    <Show if={open$}>
      <div className="flex flex-col gap-px">
        {Array.isArray(children) && children.length === 0 && <EmptyStateRow indent={indent + 1} />}
        {children?.map((c) => (
          <PageItem
            key={c._id}
            id={c._id as Id<'blocks'>}
            title={c.title}
            indent={indent + 1}
            scope={scope}
            teamId={teamId}
            handleAddPage={handleAddPage}
          />
        ))}
      </div>
    </Show>
  );
};
