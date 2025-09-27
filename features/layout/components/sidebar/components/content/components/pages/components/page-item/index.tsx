'use client';

import Link from 'next/link';
import { memo, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { Show, use$, useObservable } from '@legendapp/state/react';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import { MoreMenu } from '../buttons/more-button';
import { PageMoreContent } from './components/more-content';
import { PageIcon } from './components/icon';
import { AddIconButton } from '../buttons/add-icon-button';
import { EmptyStateRow } from '../empty-state-row';

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
  createNewPage,
}: {
  id: Id<'blocks'>;
  title: string;
  indent: number;
  scope: 'private' | 'team';
  teamId?: Id<'teams'>;
  createNewPage: (args: {
    scope: 'private' | 'team';
    teamId?: Id<'teams'>;
    parentId?: Id<'blocks'>;
    title?: string;
  }) => Promise<void>;
}) {
  const open$ = useObservable(false);
  const isOpen = use$(open$);
  const pathname = usePathname();
  const isSelected = pathname === `/${id}`;

  const children = useQuery(api.blocks.listChildren, isOpen && id ? { parentId: id } : 'skip');

  const handleAddChild = useCallback(() => {
    void createNewPage({
      scope,
      teamId: scope === 'team' ? (teamId as Id<'teams'>) : undefined,
      parentId: id,
    });
  }, [createNewPage, id, scope, teamId]);

  const indentStyle = useMemo(() => ({ padding: '0 8px', paddingLeft: 8 + indent * 8 }), [indent]);

  return (
    <>
      <div
        className={cn(
          'cursor-pointer group/list-row flex items-center h-7.5 rounded-md hover:bg-hover pr-2 gap-0.5',
          isSelected && 'bg-hover',
        )}
      >
        <Link href={`/${id}`} prefetch={false} aria-label={title} className="flex-1 min-w-0">
          <div
            role="button"
            onClick={() => open$.set(!open$.get())}
            className="flex items-center gap-2 min-w-0 pl-2 justify-start font-medium text-muted-foreground-opaque truncate"
            style={indentStyle}
          >
            <PageIcon open$={open$} />
            <span className={cn('', isSelected && 'text-foreground')}>{title}</span>
          </div>
        </Link>
        <MoreMenu
          aria-label="More options"
          tooltip="Delete, duplicate, and more..."
          className="rounded text-muted-foreground-opaque opacity-0 size-5 group-hover/list-row:opacity-100 focus:opacity-100"
        >
          <PageMoreContent title={title} />
        </MoreMenu>
        <AddIconButton
          ariaLabel="Add subpage"
          tooltipText="Add subpage"
          className="size-7 opacity-0 group-hover/list-row:opacity-100 focus:opacity-100"
          onClick={handleAddChild}
        />
      </div>

      <Show if={open$}>
        <div>
          {Array.isArray(children) && children.length === 0 && <EmptyStateRow indent={indent + 1} />}
          {children?.map((c) => (
            <PageItem
              key={c._id}
              id={c._id as Id<'blocks'>}
              title={c.title}
              indent={indent + 1}
              scope={scope}
              teamId={teamId}
              createNewPage={createNewPage}
            />
          ))}
        </div>
      </Show>
    </>
  );
});
