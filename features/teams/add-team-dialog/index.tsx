'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useObservable } from '@legendapp/state/react';
import { NewOrganization } from '@/features/auth/organizations/types';
import { LearnMore } from './components/learn-more';
import { NewTeamForm } from './components/new-team-form';
import { SubmitButton } from './components/submit-button';
import { batch } from '@legendapp/state';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useQueryState, parseAsBoolean } from 'nuqs';
// import { NewTeamToast } from '../../toasts/new-team';

export const AddTeamDialog = () => {
  const [open, setOpen] = useQueryState('new-team', parseAsBoolean.withDefault(false));
  const loading$ = useObservable(false);
  const file$ = useObservable<File | undefined>(undefined);
  const form$ = useObservable<NewOrganization>(emptyTeam);

  const createTeam = useMutation(api.teams.createTeam);

  //handlers
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return setOpen(true);
    batch(() => {
      form$.set(emptyTeam);
      file$.set(undefined);
    });
    setOpen(null); // remove ?open from URL when closing
  };
  const handleAddTeam = async () => {
    await createTeam({ name: 'Team name' });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="contents">
          <DialogTitle>Create a new team</DialogTitle>
          <DialogDescription>
            Teams are where you can organize pages, permissions and information between members.
          </DialogDescription>
        </DialogHeader>
        <NewTeamForm form$={form$} file$={file$} onSubmit={handleAddTeam} />
        <DialogFooter className="mt-[22px] w-full flex justify-between ">
          <LearnMore />
          <SubmitButton form$={form$} loading$={loading$} />
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
  members: [],
};
