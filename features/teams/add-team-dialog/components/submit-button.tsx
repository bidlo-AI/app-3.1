import { Button } from '@/components/ui/button';
import { Observable } from '@legendapp/state';
import { NewOrganization } from '@/features/auth/organizations/types';
import { Show, use$ } from '@legendapp/state/react';
import { Loading$ } from '@/components/ui/loading';

export const SubmitButton = ({
  form$,
  loading$,
}: {
  form$: Observable<NewOrganization>;
  loading$: Observable<boolean>;
}) => {
  const loading = use$(() => loading$.get());
  const disabled = use$(() => {
    const f = form$.get();
    if (!f?.name) return true;
    if (!f?.default_state) return true;
    if (!f?.default_contractor) return true;
    return false;
  });
  return (
    <Button type="submit" className="h-8 py-2 px-3 w-[105px]" disabled={disabled || loading}>
      <Show if={loading$} else="Create team">
        <Loading$ loading$={loading$} className="size-4" />
      </Show>
    </Button>
  );
};
