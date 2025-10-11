import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';

export const AddIcon = () => {
  return (
    <Button variant="ghost" size="xs" className="text-muted-foreground-opaque">
      <Smile className="size-4" />
      AddIcon
    </Button>
  );
};
