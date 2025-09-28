'use client';

import { BaseArgs, HandleAddPage } from '../types';
import { useCallback } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { MoreMenu } from '../../buttons/more-button';
import { PageMoreContent } from './more-content';
import { AddIconButton } from '../../buttons/add-icon-button';

export const Actions = ({
  id,
  title,
  scope,
  teamId,
  handleAddPage,
}: BaseArgs & {
  scope: 'private' | 'team';
  handleAddPage: HandleAddPage;
}) => {
  const handleAddChild = useCallback(() => {
    void handleAddPage({
      scope,
      teamId: scope === 'team' ? (teamId as Id<'teams'>) : undefined,
      parentId: id,
    });
  }, [handleAddPage, id, scope, teamId]);

  return (
    <div className="absolute right-0 w-0 overflow-hidden group-hover/list-row:w-fit group-hover/list-row:relative flex gap-0.5">
      <MoreMenu
        aria-label="More options"
        tooltip="Delete, duplicate, and more..."
        className="rounded text-muted-foreground-opaque size-5 "
      >
        <PageMoreContent title={title} />
      </MoreMenu>
      <AddIconButton
        ariaLabel="Add subpage"
        tooltipText="Add a page inside"
        className="size-7"
        onClick={handleAddChild}
      />
    </div>
  );
};
