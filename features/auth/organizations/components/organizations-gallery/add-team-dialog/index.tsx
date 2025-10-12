'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useObservable, use$ } from '@legendapp/state/react';
import { pageHashParams } from '@legendapp/state/helpers/pageHashParams';
import { NewOrganization } from '@/features/auth/organizations/types';
import { LearnMore } from './learn-more';
import { NewTeamForm } from './new-team-form';
// import { SubmitButton } from './submit-button';
// // import { NewTeamToast } from '../../toasts/new-team';
import { batch } from '@legendapp/state';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCallback } from 'react';

export const AddTeamDialog = () => {
  const open = use$(() => pageHashParams.open.get() === 'true');
  // const loading$ = useObservable(false);
  const file$ = useObservable<File | undefined>(undefined);
  const form$ = useObservable<NewOrganization>(emptyTeam);

  const createTeam = useMutation(api.teams.createTeam);

  //handlers
  const handleOpenChange = (open: boolean) => {
    if (open) return pageHashParams.open.set('true');
    batch(() => {
      form$.set(emptyTeam);
      file$.set(undefined);
      pageHashParams.open.delete();
    });
  };

  //handlers
  const handleAddTeam = useCallback(async () => await createTeam({ name: 'Team name' }), [createTeam]);
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="contents">
          <DialogTitle>Create a new team</DialogTitle>
          <DialogDescription>
            Collaborate in a shared workspace—share data, run analyses together, and stay in sync.
          </DialogDescription>
        </DialogHeader>
        <NewTeamForm form$={form$} file$={file$} onSubmit={handleAddTeam} />
        <DialogFooter className="mt-[22px] w-full flex justify-between ">
          <LearnMore />
          {/* <SubmitButton form$={form$} loading$={loading$} handleSubmit={await() =>  console.log('submit')} /> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const emptyTeam: NewOrganization = {
  name: '',
  avatar: '',
  id: '',
  role: 'owner',
  default_state: '',
  default_contractor: {
    id: '',
    name: '',
    icon: '',
  },
  members: [],
};
