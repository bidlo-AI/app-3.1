'use client';

import { Preloaded, usePreloadedQuery } from 'convex/react';
import { useMemo, memo } from 'react';
import { Doc } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { Switch } from '@/components/utils/switch';
import { TeamSection } from './components/section/team-section';
import { PrivateSection } from './components/section/private-section';

type SidebarSectionId = 'teams' | 'private';

const DEFAULT_SECTION_ORDER = ['teams', 'private'];

export const Pages = memo(function Pages({
  preloadedPrivatePages,
  preloadedTeamSections,
  preloadedUser,
}: {
  preloadedPrivatePages: Preloaded<typeof api.blocks.listPrivatePages>;
  preloadedTeamSections: Preloaded<typeof api.blocks.listTeamPagesForUser>;
  preloadedUser: Preloaded<typeof api.users.getUser>;
}) {
  const user = usePreloadedQuery(preloadedUser) as Doc<'users'> | null;

  // STATE
  const sectionOrder = useMemo(() => {
    const persisted = user?.sidebar_sections_order as SidebarSectionId[] | undefined;
    return Array.isArray(persisted) && persisted.length > 0 ? persisted : DEFAULT_SECTION_ORDER;
  }, [user?.sidebar_sections_order]);

  // HANDLERS

  return (
    <div className="flex flex-col gap-1">
      {sectionOrder.map((sectionId) => (
        <div key={sectionId} className="flex flex-col gap-px">
          <Switch value={sectionId}>
            {{
              teams: () => <TeamSection preloadedTeamSections={preloadedTeamSections} />,
              private: () => <PrivateSection preloadedPrivatePages={preloadedPrivatePages} />,
            }}
          </Switch>
        </div>
      ))}
    </div>
  );
});
