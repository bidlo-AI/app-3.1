'use client';

import { Plus, Users, ChevronRight, File } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NavLink } from './nav-link';
import { useMemo } from 'react';
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
          onClick={onClick}
        >
          <Plus className="size-4" />
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
      className={cn(className, 'size-5 rounded hover:bg-hover flex items-center justify-center')}
    >
      <ChevronRight className={cn('size-4 text-muted-foreground-opaque', open && 'rotate-90')} />
    </div>
  );
};

export const Pages = ({ orgId }: { orgId: string }) => {
  const createPage = useMutation(api.blocks.createPage);
  const createTeam = useMutation(api.teams.createTeam);

  // Centralized helper for creating pages to avoid repeating payload construction
  const createNewPage = async ({
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
    await createPage({
      workosOrgId: orgId,
      scope,
      teamId,
      title,
      parentId,
    });
  };

  const privatePages = useQuery(api.blocks.listPrivatePages, orgId ? { workosOrgId: orgId } : 'skip');
  const teamSections = useQuery(api.blocks.listTeamPagesForUser, orgId ? { workosOrgId: orgId } : 'skip');

  const sortedPrivate = useMemo(
    () => (privatePages ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [privatePages],
  );

  const onAddPrivate = async () => {
    await createNewPage({ scope: 'private' });
  };

  const onAddTeam = async (teamId: Id<'teams'>) => {
    await createNewPage({ scope: 'team', teamId });
  };

  const TeamItem = ({
    teamId,
    teamName,
    pages,
  }: {
    teamId: Id<'teams'>;
    teamName: string;
    pages: { _id: string; title: string }[];
  }) => {
    const open$ = useObservable(true);
    return (
      <div className="flex flex-col gap-px">
        <div className="flex items-center gap-2 text-muted-foreground justify-between h-7.5 px-2 rounded hover:bg-hover cursor-pointer flex-1">
          <div
            className="flex relative items-center gap-2 flex-1 min-w-0 group/team"
            role="button"
            onClick={() => open$.set(!open$.get())}
          >
            <ExpandButton open$={open$} className="group-hover/team:opacity-100 opacity-0 absolute -inset-px" />
            <Users className="size-5 shrink-0 opacity-100 group-hover/team:opacity-0" />
            <span className="font-semibold truncate text-start w-full">{teamName}</span>
          </div>
          <AddIconButton
            ariaLabel={`Add page to ${teamName}`}
            tooltipText="Add page"
            className="size-7"
            onClick={() => onAddTeam(teamId)}
          />
        </div>
        <Show if={open$}>
          <div className="flex flex-col gap-px">
            {pages.map((p) => (
              <PageItem
                key={p._id}
                id={p._id as Id<'blocks'>}
                title={p.title}
                indent={1}
                scope="team"
                teamId={teamId}
              />
            ))}
          </div>
        </Show>
      </div>
    );
  };

  const PageItem = ({
    id,
    title,
    indent,
    scope,
    teamId,
  }: {
    id: Id<'blocks'>;
    title: string;
    indent: number;
    scope: 'private' | 'team';
    teamId?: Id<'teams'>;
  }) => {
    const children = useQuery(api.blocks.listChildren, id ? { parentId: id } : 'skip');
    const open$ = useObservable(false);
    const IconContent = observer(() => (
      <span className="relative inline-flex items-center justify-center size-4.5 shrink-0">
        <File className={cn('size-4 group-hover:opacity-0')} />
        <ExpandButton open$={open$} className="group-hover:opacity-100 opacity-0 absolute -inset-px" />
      </span>
    ));
    return (
      <>
        <NavLink
          href={`/${id}`}
          label={title}
          icon={<IconContent />}
          indent={indent}
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
            {Array.isArray(children) && children.length === 0 && (
              <div
                className="flex items-center h-7.5 text-muted-foreground-opaque"
                style={{ padding: '0 8px', paddingLeft: 8 + (indent + 1) * 8 }}
              >
                <span className="opacity-50">No pages inside</span>
              </div>
            )}
            {children?.map((c) => (
              <PageItem
                key={c._id}
                id={c._id as Id<'blocks'>}
                title={c.title}
                indent={indent + 1}
                scope={scope}
                teamId={teamId}
              />
            ))}
          </div>
        </Show>
      </>
    );
  };

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
            />
          ))}
        </div>
      </Section>

      <Section title="Private" onAdd={onAddPrivate} tooltip="Add private page">
        <div className="flex flex-col gap-px">
          {sortedPrivate?.map((p) => (
            <PageItem key={p._id} id={p._id as Id<'blocks'>} title={p.title} indent={0} scope="private" />
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
    <div className="flex flex-col gap-1">
      <div
        onClick={() => open$.set(!open$.get())}
        className="text-xs font-semibold text-muted-foreground h-7.5 px-2 flex-1 flex items-center justify-between hover:bg-hover rounded"
        role="button"
      >
        <span>{title}</span>
        <AddIconButton ariaLabel={tooltip} tooltipText={tooltip} onClick={onAdd} />
      </div>
      <Show if={open$}>
        <div>{children}</div>
      </Show>
    </div>
  );
};
