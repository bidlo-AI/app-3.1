import { SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const NewPage = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="New page" className="text-muted-foreground-opaque">
          <SquarePen className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">New page</TooltipContent>
    </Tooltip>
  );
};
