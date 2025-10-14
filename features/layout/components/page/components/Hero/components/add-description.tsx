import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import { usePage } from '../../../provider';
import { useObservable, Memo } from '@legendapp/state/react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export const AddDescription = () => {
  const page$ = usePage();
  const action = useObservable(() => {
    const hidden = page$.hide_description.get() ?? false;
    const hasDescription = page$.description.get() !== '' ? true : false;
    return hidden && hasDescription ? 'Show' : !hasDescription && hidden ? 'Add' : 'Hide';
  });

  const updateBlock = useMutation(api.blocks.updateBlock);

  //handlers
  const handleClick = () => {
    const next = !page$.hide_description.get();
    page$.hide_description.set(next);
    void updateBlock({ blockId: page$._id.get(), hideDescription: next });
  };

  return (
    <Button variant="ghost_muted" size="xs" onClick={handleClick}>
      <InfoIcon className="size-4" />
      <Memo>{action}</Memo> description
    </Button>
  );
};
