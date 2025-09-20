'use client';

import { SquarePlus, Users } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NavLink } from './nav-link';
import { useMemo } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { File } from 'lucide-react';
import { useObservable } from '@legendapp/state/react';
import { Show } from '@legendapp/state/react';

export const Pages = ({ orgId }: { orgId: string }) => {
  const createPage = useMutation(api.blocks.createPage);
  const createTeam = useMutation(api.teams.createTeam);

  const privatePages = useQuery(api.blocks.listPrivatePages, orgId ? { workosOrgId: orgId } : 'skip');
  const teamSections = useQuery(api.blocks.listTeamPagesForUser, orgId ? { workosOrgId: orgId } : 'skip');

  const sortedPrivate = useMemo(
    () => (privatePages ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [privatePages],
  );

  const onAddPrivate = async () => {
    if (!orgId) return;
    await createPage({ workosOrgId: orgId, scope: 'private', title: 'Untitled' });
  };

  const onAddTeam = async (teamId: Id<'teams'>) => {
    if (!orgId) return;
    await createPage({ workosOrgId: orgId, scope: 'team', teamId, title: 'Untitled' });
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
    return (
      <>
        <NavLink
          href={`/${id}`}
          label={title}
          icon={<File className="size-4.5" />}
          indent={indent}
          onAddChild={async () => {
            if (!orgId) return;
            await createPage({
              workosOrgId: orgId,
              scope,
              teamId: scope === 'team' ? (teamId as Id<'teams'>) : undefined,
              title: 'Untitled',
              parentId: id,
            });
          }}
        />
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
            <div key={section.team._id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-1">
                <div
                  className="flex items-center gap-2 text-muted-foreground justify-between h-7.5 px-2 rounded hover:bg-hover cursor-pointer flex-1"
                  role="button"
                >
                  <Users className="size-5 shrink-0" />
                  <span className="font-semibold truncate text-start w-full">{section.team.name}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Add page to ${section.team.name}`}
                        className="text-muted-foreground-opaque"
                        onClick={() => onAddTeam(section.team._id as Id<'teams'>)}
                      >
                        <SquarePlus className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Add page</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-col gap-px">
                {section.pages.map((p) => (
                  <PageItem
                    key={p._id}
                    id={p._id as Id<'blocks'>}
                    title={p.title}
                    indent={0}
                    scope="team"
                    teamId={section.team._id as Id<'teams'>}
                  />
                ))}
              </div>
            </div>
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Add private page"
              className="text-muted-foreground-opaque"
              onClick={onAdd}
            >
              <SquarePlus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tooltip}</TooltipContent>
        </Tooltip>
      </div>
      <Show if={open$}>
        <div>{children}</div>
      </Show>
    </div>
  );
};
