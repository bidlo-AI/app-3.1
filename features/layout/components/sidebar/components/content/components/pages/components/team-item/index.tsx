'use client';

import { memo, useCallback, useMemo } from 'react';
import { Users } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { ExpandButton } from '../buttons/expand-button';
import { AddIconButton } from '../buttons/add-icon-button';
import { Show, useObservable } from '@legendapp/state/react';
import { MoreMenu } from '../buttons/more-button';
import { TeamMoreContent } from './components/more-content';
import { EmptyStateRow } from '../empty-state-row';
import { PageItem } from '../page-item';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * TeamItem
 * Renders a team row with expand/collapse, inline add, and more menu.
 * When open, renders the team's pages.
 */
export const TeamItem = memo(function TeamItem({
  teamId,
  teamName,
  pages,
  onAddTeam,
}: {
  teamId: Id<'teams'>;
  teamName: string;
  pages: { _id: string; title: string }[];
  onAddTeam: (teamId: Id<'teams'>) => void;
}) {
  const createPage = useMutation(api.blocks.createPage);
  const open$ = useObservable(false);

  //handlers
  const toggleOpen = useCallback(() => open$.set(!open$.get()), [open$]);
  const handleAdd = useCallback(() => onAddTeam(teamId), [onAddTeam, teamId]);
  const createNewPage = useCallback(async () => {
    await createPage({
      scope: 'team',
      teamId,
      parentId: undefined,
      title: 'New page',
    });
  }, [createPage, teamId]);

  const leftIcon = useMemo(
    () => (
      <span className="relative inline-flex items-center justify-center size-5 shrink-0">
        <Users className="bg-hover  rounded size-5 opacity-100 group-hover/list-row:opacity-0" />
        <ExpandButton open$={open$} className="group-hover/list-row:opacity-100 opacity-0 absolute -inset-px" />
      </span>
    ),
    [open$],
  );

  return (
    <div className="flex flex-col gap-px">
      <div className="cursor-pointer group/list-row flex items-center h-7.5 rounded-md hover:bg-hover pr-2 gap-0.5">
        <div
          role="button"
          onClick={toggleOpen}
          className="flex items-center gap-2 min-w-0 pl-2 justify-start font-semibold text-muted-foreground-opaque truncate"
          style={{ padding: '0 8px', paddingLeft: 8 }}
        >
          {leftIcon}
          <span className={cn('')}>{teamName}</span>
        </div>

        <MoreMenu aria-label="More options" tooltip="Team settings and members...">
          <TeamMoreContent teamName={teamName} />
        </MoreMenu>
        <AddIconButton
          ariaLabel={`Add page to ${teamName}`}
          tooltipText="Add page"
          className="size-7 opacity-0 group-hover/list-row:opacity-100 focus:opacity-100"
          onClick={handleAdd}
        />
      </div>

      <Show if={open$}>
        {Array.isArray(pages) && pages.length === 0 && <EmptyStateRow indent={1} />}
        {Array.isArray(pages) && pages.length > 0 && (
          <div className="flex flex-col gap-px">
            {pages.map((p) => (
              <div key={p._id}>
                <PageItem
                  id={p._id as Id<'blocks'>}
                  title={p.title}
                  indent={1}
                  scope="team"
                  teamId={teamId}
                  createNewPage={createNewPage}
                />
              </div>
            ))}
          </div>
        )}
      </Show>
    </div>
  );
});
