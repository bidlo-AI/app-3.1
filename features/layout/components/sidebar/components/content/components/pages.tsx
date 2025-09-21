'use client';

import { Plus, Users, ChevronRight, File } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, memo, useCallback } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { useObservable, Show, observer, use$ } from '@legendapp/state/react';
import { cn } from '@/lib/utils';
import { Observable } from '@legendapp/state';

// Reusable add button with tooltip to reduce duplication across sections and items
const AddIconButton = ({
  ariaLabel,
  tooltipText,
  className,
  onClick,
}: {
  ariaLabel: string;
  tooltipText: string;
  className?: string;
  onClick: () => void;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={ariaLabel}
          className={cn('text-muted-foreground-opaque', className)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
        >
          <Plus className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltipText}</TooltipContent>
    </Tooltip>
  );
};

const ExpandButton = ({ open$, className }: { open$: Observable<boolean>; className: string }) => {
  const open = use$(open$);

  return (
    <div
      role="button"
      aria-label={open ? 'Collapse' : 'Expand'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open$.set(!open);
      }}
      className={cn('size-5 rounded hover:bg-hover flex items-center justify-center', className)}
    >
      <ChevronRight
        className={cn('size-5 text-muted-foreground-opaque transition-transform duration-150', open && 'rotate-90')}
      />
    </div>
  );
};

// Shared type for child creation callback used by row items
type CreateNewPageHandler = (args: {
  scope: 'private' | 'team';
  teamId?: Id<'teams'>;
  parentId?: Id<'blocks'>;
  title?: string;
}) => Promise<void>;

// Presentational icon content for a page row with inline expand affordance
const PageIcon = observer(({ open$ }: { open$: Observable<boolean> }) => (
  <span className="relative inline-flex items-center justify-center size-5 shrink-0">
    <File className={cn('size-5 group-hover/page-row:opacity-0')} />
    <ExpandButton open$={open$} className="group-hover/page-row:opacity-100 opacity-0 absolute -inset-px" />
  </span>
));

// Reusable empty state row to avoid duplicated markup
const EmptyStateRow = memo(function EmptyStateRow({
  indent,
  label = 'No pages inside',
}: {
  indent: number;
  label?: string;
}) {
  return (
    <div
      className="flex items-center h-7.5 text-muted-foreground-opaque"
      style={{ padding: '0 8px', paddingLeft: 8 + indent * 8 }}
    >
      <span className="opacity-50">{label}</span>
    </div>
  );
});

// Simple row renderer for pages (no NavLink)
const PageRow = memo(function PageRow({
  href,
  title,
  indent,
  icon,
  onAddChild,
}: {
  href: string;
  title: string;
  indent: number;
  icon: React.ReactNode;
  onAddChild: () => void;
}) {
  return (
    <div className="group/page-row flex items-center h-7.5 rounded hover:bg-hover pr-2">
      <Link
        style={{ padding: '0 8px', paddingLeft: 8 + indent * 8 }}
        href={href}
        prefetch
        aria-label={title}
        className="flex-1 flex items-center gap-2 min-w-0 pl-2 justify-start font-medium size-full text-muted-foreground-opaque truncate"
      >
        {icon}
        {title}
      </Link>
      <AddIconButton
        ariaLabel="Add subpage"
        tooltipText="Add subpage"
        className="size-7 opacity-0 group-hover/page-row:opacity-100 focus:opacity-100"
        onClick={onAddChild}
      />
    </div>
  );
});

const PageItem = memo(function PageItem({
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
  createNewPage: CreateNewPageHandler;
}) {
  const open$ = useObservable(false);
  const isOpen = use$(open$);
  const children = useQuery(api.blocks.listChildren, isOpen && id ? { parentId: id } : 'skip');
  return (
    <>
      <PageRow
        href={`/${id}`}
        title={title}
        indent={indent}
        icon={<PageIcon open$={open$} />}
        onAddChild={async () => {
          await createNewPage({
            scope,
            teamId: scope === 'team' ? (teamId as Id<'teams'>) : undefined,
            parentId: id,
          });
        }}
      />
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

const TeamItem = memo(function TeamItem({
  teamId,
  teamName,
  pages,
  onAddTeam,
  createNewPage,
}: {
  teamId: Id<'teams'>;
  teamName: string;
  pages: { _id: string; title: string }[];
  onAddTeam: (teamId: Id<'teams'>) => void;
  createNewPage: CreateNewPageHandler;
}) {
  const open$ = useObservable(true);
  return (
    <div className="flex flex-col gap-px">
      {/* Team row: unified height and icon sizing */}
      <div
        // Team row hover container controls visibility of Add button
        className="group/team-row h-7.5 flex items-center gap-2 text-muted-foreground justify-between px-2 rounded hover:bg-hover cursor-pointer flex-1"
      >
        <div
          role="button"
          onClick={() => open$.set(!open$.get())}
          className="flex relative items-center gap-2 flex-1 min-w-0"
        >
          <ExpandButton open$={open$} className="group-hover/team-row:opacity-100 opacity-0 absolute z-[1]" />
          <Users className="size-5 shrink-0 opacity-100 group-hover/team-row:opacity-0" />
          <span className="font-semibold truncate text-start w-full">{teamName}</span>
        </div>
        <AddIconButton
          ariaLabel={`Add page to ${teamName}`}
          tooltipText="Add page"
          // Only show Add on hover/focus of the row
          className="size-7 opacity-0 group-hover/team-row:opacity-100 focus:opacity-100"
          onClick={() => onAddTeam(teamId)}
        />
      </div>
      <Show if={open$}>
        <div className="flex flex-col gap-px">
          {/* Show empty state when team has no pages */}
          {Array.isArray(pages) && pages.length === 0 && <EmptyStateRow indent={1} />}
          {pages.map((p) => (
            <PageItem
              key={p._id}
              id={p._id as Id<'blocks'>}
              title={p.title}
              indent={1}
              scope="team"
              teamId={teamId}
              createNewPage={createNewPage}
            />
          ))}
        </div>
      </Show>
    </div>
  );
});

export const Pages = ({ orgId }: { orgId: string }) => {
  const createPage = useMutation(api.blocks.createPage);
  const createTeam = useMutation(api.teams.createTeam);
  const router = useRouter();

  // Centralized helper for creating pages to avoid repeating payload construction
  const createNewPage = useCallback(
    async ({
      scope,
      teamId,
      parentId,
      title = 'Untitled',
    }: {
      scope: 'private' | 'team';
      teamId?: Id<'teams'>;
      parentId?: Id<'blocks'>;
      title?: string;
    }) => {
      if (!orgId) return;
      const res = await createPage({
        workosOrgId: orgId,
        scope,
        teamId,
        title,
        parentId,
      });
      if (res?.blockId) {
        router.push(`/${res.blockId}`);
      }
    },
    [createPage, orgId, router],
  );

  const privatePages = useQuery(api.blocks.listPrivatePages, orgId ? { workosOrgId: orgId } : 'skip');
  const teamSections = useQuery(api.blocks.listTeamPagesForUser, orgId ? { workosOrgId: orgId } : 'skip');

  const sortedPrivate = useMemo(
    () => (privatePages ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [privatePages],
  );

  const onAddPrivate = useCallback(async () => {
    await createNewPage({ scope: 'private' });
  }, [createNewPage]);

  const onAddTeam = useCallback(
    async (teamId: Id<'teams'>) => {
      await createNewPage({ scope: 'team', teamId });
    },
    [createNewPage],
  );

  return (
    <div className="flex flex-col gap-1">
      <Section
        title="Teams"
        onAdd={async () => {
          if (!orgId) return;
          const name = prompt('Team name');
          if (!name) return;
          await createTeam({ workosOrgId: orgId, name });
        }}
        tooltip="Add team"
      >
        <div className="flex flex-col gap-1">
          {teamSections?.map((section) => (
            <TeamItem
              key={section.team._id}
              teamId={section.team._id as Id<'teams'>}
              teamName={section.team.name}
              pages={section.pages as { _id: string; title: string }[]}
              onAddTeam={onAddTeam}
              createNewPage={createNewPage}
            />
          ))}
        </div>
      </Section>

      <Section title="Private" onAdd={onAddPrivate} tooltip="Add private page">
        <div className="flex flex-col gap-px">
          {sortedPrivate?.map((p) => (
            <PageItem
              key={p._id}
              id={p._id as Id<'blocks'>}
              title={p.title}
              indent={0}
              scope="private"
              createNewPage={createNewPage}
            />
          ))}
        </div>
      </Section>
    </div>
  );
};

const Section = ({
  title,
  onAdd,
  tooltip,
  children,
}: {
  title: string;
  onAdd: () => void;
  tooltip: string;
  children: React.ReactNode;
}) => {
  const open$ = useObservable(true);
  return (
    <div className="flex flex-col gap-px mb-3 ">
      <div
        onClick={() => open$.set(!open$.get())}
        // Section header hover container controls Add visibility
        className="group/section-row text-xs font-semibold text-muted-foreground min-h-7.5 px-2 flex-1 flex items-center justify-between hover:bg-hover rounded"
        role="button"
      >
        <span>{title}</span>
        {/* Only show Add on hover/focus of the header */}
        <AddIconButton
          ariaLabel={tooltip}
          tooltipText={tooltip}
          onClick={onAdd}
          className="size-7 opacity-0 group-hover/section-row:opacity-100 focus:opacity-100"
        />
      </div>
      <Show if={open$}>
        <div>{children}</div>
      </Show>
    </div>
  );
};
