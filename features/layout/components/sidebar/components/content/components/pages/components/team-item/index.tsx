'use client';

import { memo } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { useObservable } from '@legendapp/state/react';
import { Children } from './components/children';
import { Actions } from './components/actions';
import { Expand } from './components/expand';

/**
 * TeamItem
 * Renders a team row with expand/collapse, inline add, and more menu.
 * When open, renders the team's pages.
 */
export const TeamItem = memo(function TeamItem({
  teamId,
  teamName,
  pages,
}: {
  teamId: Id<'teams'>;
  teamName: string;
  pages: { _id: string; title: string }[];
}) {
  const open$ = useObservable(false);

  return (
    <div className="flex flex-col gap-px">
      <div className="cursor-pointer group/list-row flex items-center h-7.5 rounded-md hover:bg-hover pr-2 gap-0.5 relative text-muted-foreground-opaque">
        <Expand open$={open$} teamName={teamName} />
        <Actions teamName={teamName} teamId={teamId} />
      </div>
      <Children open$={open$} pages={pages} teamId={teamId} />
    </div>
  );
});
