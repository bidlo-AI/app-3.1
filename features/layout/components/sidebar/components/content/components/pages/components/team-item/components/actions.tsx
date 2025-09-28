'use client';

import { AddIconButton } from '../../buttons/add-icon-button';
import { MoreMenu } from '../../buttons/more-button';
import { TeamMoreContent } from './more-content';
import { useHandleAddPage } from '../../page-item/utils';
import { Id } from '@/convex/_generated/dataModel';

export const Actions = ({ teamName, teamId }: { teamName: string; teamId: Id<'teams'> }) => {
  //handlers
  const handleAddPage = useHandleAddPage();

  return (
    <div className="absolute right-0 w-0 overflow-hidden group-hover/list-row:w-fit group-hover/list-row:relative flex gap-0.5">
      <MoreMenu aria-label="More options" tooltip="Team settings and members...">
        <TeamMoreContent teamName={teamName} />
      </MoreMenu>
      <AddIconButton
        className="size-7"
        tooltipText="Add page"
        ariaLabel={`Add page to ${teamName}`}
        onClick={() => handleAddPage({ scope: 'team', teamId })}
      />
    </div>
  );
};
