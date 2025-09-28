'use client';

import { memo } from 'react';
import { usePathname } from 'next/navigation';
import { useObservable } from '@legendapp/state/react';
import { cn } from '@/lib/utils';
import { Route } from './components/route';
import { Actions } from './components/actions';
import { Children } from './components/children';
import { BaseArgs, HandleAddPage } from './types';

/**
 * PageItem
 * Renders a single page row with expand/collapse, inline add, and more menu.
 * Also renders child pages when expanded.
 */
export const PageItem = memo(function PageItem({
  id,
  title,
  indent,
  scope,
  teamId,
  handleAddPage,
}: BaseArgs & {
  indent: number;
  scope: 'private' | 'team';
  handleAddPage: HandleAddPage;
}) {
  const open$ = useObservable(false);
  const pathname = usePathname();
  const isSelected = pathname === `/${id}`;

  return (
    <>
      <div
        className={cn(
          'cursor-pointer group/list-row flex items-center h-7.5 rounded-md hover:bg-hover pr-2 gap-0.5 relative text-muted-foreground-opaque',
          isSelected && 'bg-hover text-foreground ',
        )}
      >
        <Route id={id} title={title} indent={indent} open$={open$} />
        <Actions id={id} title={title} scope={scope} teamId={teamId} handleAddPage={handleAddPage} />
      </div>
      <Children id={id} indent={indent} scope={scope} teamId={teamId} handleAddPage={handleAddPage} open$={open$} />
    </>
  );
});
