import { SectionHeader } from './components/header';
import { TeamItem } from '../team-item';
import { usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';
import { useMutation } from 'convex/react';
import { useObservable } from '@legendapp/state/react';
import { useCallback } from 'react';
import { Show } from '@legendapp/state/react';
import { Id } from '@/convex/_generated/dataModel';

export const TeamSection = ({
  preloadedTeamSections,
}: {
  preloadedTeamSections: Preloaded<typeof api.blocks.listTeamPagesForUser>;
}) => {
  const teamSections = usePreloadedQuery(preloadedTeamSections) ?? [];
  const createTeam = useMutation(api.teams.createTeam);
  const open$ = useObservable(true);

  //handlers
  const onAddTeam = useCallback(async () => await createTeam({ name: 'Team name' }), [createTeam]);

  return (
    <>
      <SectionHeader
        title="Teams"
        onAdd={onAddTeam}
        tooltip={'Add team'}
        onToggle={() => open$.set((prev: boolean) => !prev)}
      />
      <Show if={open$}>
        <div className="flex flex-col gap-px pb-3">
          {teamSections.map((section) => (
            <div key={section.team._id}>
              <TeamItem
                teamName={section.team.name}
                teamId={section.team._id as Id<'teams'>}
                pages={section.pages as { _id: string; title: string }[]}
              />
            </div>
          ))}
        </div>
      </Show>
    </>
  );
};
