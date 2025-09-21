'use client';

import { useQuery, useMutation, Preloaded, usePreloadedQuery } from 'convex/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useObservable, Show, observer, use$ } from '@legendapp/state/react';
import { Plus, Users, ChevronRight, File } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useMemo, memo, useCallback, useState } from 'react';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Observable } from '@legendapp/state';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, DraggableAttributes } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
          style={{ height: '20px', width: '20px' }}
          className={cn('rounded text-muted-foreground-opaque', className)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
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
    <File className={cn('size-5 group-hover/list-row:opacity-0')} />
    <ExpandButton open$={open$} className="group-hover/list-row:opacity-100 opacity-0 absolute -inset-px" />
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
  // Memoize style object to avoid re-creating it on every render
  const indentStyle = useMemo(() => ({ padding: '0 8px', paddingLeft: 8 + indent * 8 }), [indent]);
  return (
    <div className="flex items-center h-7.5 text-muted-foreground-opaque" style={indentStyle}>
      <span className="opacity-50">{label}</span>
    </div>
  );
});

// Shared list row to unify layout for Team and Page items
const ListRow = memo(function ListRow({
  href,
  label,
  indent = 0,
  leftIcon,
  onLeftClick,
  onAdd,
  addAriaLabel,
  addTooltip,
  labelClassName,
  selected,
}: {
  href?: string;
  label: string;
  indent?: number;
  leftIcon?: React.ReactNode;
  onLeftClick?: () => void;
  onAdd?: () => void;
  addAriaLabel?: string;
  addTooltip?: string;
  labelClassName?: string;
  selected?: boolean;
}) {
  // Memoize style object to avoid identity changes on every render
  const indentStyle = useMemo(() => ({ padding: '0 8px', paddingLeft: 8 + indent * 8 }), [indent]);
  const Left = (
    <div
      role={onLeftClick ? 'button' : undefined}
      onClick={onLeftClick}
      className="flex items-center gap-2 min-w-0 pl-2 justify-start font-medium text-muted-foreground-opaque truncate"
      style={indentStyle}
    >
      {leftIcon}
      <span className={cn('', labelClassName, selected && 'text-foreground')}>{label}</span>
    </div>
  );

  return (
    <div
      className={cn(
        'cursor-pointer group/list-row flex items-center h-7.5 rounded-md hover:bg-hover pr-2',
        selected && 'bg-hover',
      )}
    >
      {href ? (
        <Link href={href} prefetch={false} aria-label={label} className="flex-1 min-w-0">
          {Left}
        </Link>
      ) : (
        <div className="flex-1 min-w-0">{Left}</div>
      )}
      {onAdd && (
        <AddIconButton
          ariaLabel={addAriaLabel ?? 'Add'}
          tooltipText={addTooltip ?? 'Add'}
          className="size-7 opacity-0 group-hover/list-row:opacity-100 focus:opacity-100"
          onClick={onAdd}
        />
      )}
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
  const pathname = usePathname();
  const isSelected = pathname === href;
  return (
    <ListRow
      href={href}
      label={title}
      indent={indent}
      leftIcon={icon}
      onAdd={onAddChild}
      addAriaLabel="Add subpage"
      addTooltip="Add subpage"
      selected={isSelected}
    />
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

  // Stable icon element and handler to minimize child re-renders
  const iconElement = useMemo(() => <PageIcon open$={open$} />, [open$]);
  const handleAddChild = useCallback(() => {
    void createNewPage({
      scope,
      teamId: scope === 'team' ? (teamId as Id<'teams'>) : undefined,
      parentId: id,
    });
  }, [createNewPage, id, scope, teamId]);
  return (
    <>
      <PageRow href={`/${id}`} title={title} indent={indent} icon={iconElement} onAddChild={handleAddChild} />
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
  const open$ = useObservable(false);
  // Stabilize frequently recreated props
  const toggleOpen = useCallback(() => open$.set(!open$.get()), [open$]);
  const handleAdd = useCallback(() => onAddTeam(teamId), [onAddTeam, teamId]);
  const leftIcon = useMemo(
    () => (
      <span className="relative inline-flex items-center justify-center size-5 shrink-0">
        <Users className="size-5 opacity-100 group-hover/list-row:opacity-0" />
        <ExpandButton open$={open$} className="group-hover/list-row:opacity-100 opacity-0 absolute -inset-px" />
      </span>
    ),
    [open$],
  );
  return (
    <div className="flex flex-col gap-px">
      {/* Team row uses shared ListRow */}
      <ListRow
        label={teamName}
        indent={0}
        leftIcon={leftIcon}
        onLeftClick={toggleOpen}
        onAdd={handleAdd}
        addAriaLabel={`Add page to ${teamName}`}
        addTooltip="Add page"
        labelClassName="font-semibold"
      />
      <Show if={open$}>
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
      </Show>
    </div>
  );
});

// Simplified Pages: hydrate from preloaded queries and render
export const Pages = memo(function Pages({
  orgId,
  preloadedPrivatePages,
  preloadedTeamSections,
  preloadedUser,
}: {
  orgId: string;
  preloadedPrivatePages: Preloaded<typeof api.blocks.listPrivatePages>;
  preloadedTeamSections: Preloaded<typeof api.blocks.listTeamPagesForUser>;
  preloadedUser: Preloaded<typeof api.users.getUser>;
}) {
  // Swap useQuery for usePreloadedQuery to use server-preloaded results
  const privatePages = usePreloadedQuery(preloadedPrivatePages);
  const teamSections = usePreloadedQuery(preloadedTeamSections) ?? [];
  const user = usePreloadedQuery(preloadedUser) as Doc<'users'> | null;

  const createPage = useMutation(api.blocks.createPage);
  const createTeam = useMutation(api.teams.createTeam);
  const setSectionsOrder = useMutation(api.users.setSidebarSectionsOrder);
  const router = useRouter();

  // Local section order state, defaulting to persisted user preference or fallback
  type SidebarSectionId = 'teams' | 'private';
  const [sectionOrder, setSectionOrder] = useState<Array<SidebarSectionId>>(() => {
    const persisted = user?.sidebar_sections_order as SidebarSectionId[] | undefined;
    return Array.isArray(persisted) && persisted.length > 0 ? persisted : ['teams', 'private'];
  });

  // DnD sensors: activate drag if pointer moved more than 3px
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

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

  const sortedPrivate = useMemo(() => {
    const arr = (privatePages ?? []).slice();
    return arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [privatePages]);

  const onAddPrivate = useCallback(async () => {
    await createNewPage({ scope: 'private' });
  }, [createNewPage]);

  const onAddTeam = useCallback(
    async (teamId: Id<'teams'>) => {
      await createNewPage({ scope: 'team', teamId });
    },
    [createNewPage],
  );

  // Handle reordering sections
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sectionOrder.indexOf(active.id as SidebarSectionId);
      const newIndex = sectionOrder.indexOf(over.id as SidebarSectionId);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(sectionOrder, oldIndex, newIndex);
      setSectionOrder(next);
      // Persist in background
      void setSectionsOrder({ order: next });
    },
    [sectionOrder, setSectionsOrder],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1">
          {sectionOrder.map((sectionId) => (
            <SortableSection key={sectionId} id={sectionId}>
              {(drag) =>
                sectionId === 'teams' ? (
                  <Section
                    title="Teams"
                    onAdd={async () => {
                      if (!orgId) return;
                      const name = prompt('Team name');
                      if (!name) return;
                      await createTeam({ workosOrgId: orgId, name });
                    }}
                    tooltip="Add team"
                    drag={drag}
                  >
                    <div className="flex flex-col gap-px">
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
                ) : (
                  <Section title="Private" onAdd={onAddPrivate} tooltip="Add private page" drag={drag}>
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
                )
              }
            </SortableSection>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
});

type DragHandleProps = {
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners?: Record<string, unknown>;
  style?: React.CSSProperties;
};

const Section = ({
  title,
  onAdd,
  tooltip,
  children,
  drag,
}: {
  title: string;
  onAdd: () => void;
  tooltip: string;
  children: React.ReactNode;
  drag?: DragHandleProps;
}) => {
  const open$ = useObservable(true);
  return (
    <div ref={drag?.setNodeRef} style={drag?.style} className="flex flex-col gap-px mb-3 ">
      <div {...(drag?.attributes ?? {})} {...(drag?.listeners as object)}>
        <ListRow
          label={title}
          indent={0}
          onLeftClick={() => open$.set(!open$.get())}
          onAdd={onAdd}
          addAriaLabel={tooltip}
          addTooltip={tooltip}
          labelClassName="text-xs font-semibold"
        />
      </div>
      <Show if={open$}>{children}</Show>
    </div>
  );
};

const SortableSection = ({
  id,
  children,
}: {
  id: 'teams' | 'private';
  children: (drag: DragHandleProps) => React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = useMemo(() => ({ transform: CSS.Transform.toString(transform), transition }), [transform, transition]);
  return <>{children({ attributes, listeners, setNodeRef, style })}</>;
};
