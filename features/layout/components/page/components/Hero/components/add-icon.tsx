import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { Show } from '@legendapp/state/react';
import { Observable } from '@legendapp/state';
import type { Doc } from '@/convex/_generated/dataModel';

// Local alias for the blocks.icon type from Convex schema
type BlockIcon = Doc<'blocks'>['icon'];

export const AddIcon = ({ icon }: { icon: Observable<BlockIcon> }) => {
  return (
    <Show if={() => !icon.get()}>
      <Button variant="ghost_muted" size="xs">
        <Smile className="size-4" />
        AddIcon
      </Button>
    </Show>
  );
};
