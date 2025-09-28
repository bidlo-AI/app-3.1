import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export const LearnMore = () => {
  return (
    <div className="flex flex-1 ">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 w-fit text-muted-foreground text-sm">
              <Info className="size-4" />
              <p>Learn about teams</p>
            </div>
          </TooltipTrigger>
          <TooltipContent className="w-[300px]">
            Teams are a way to compartmentalize data and resources. Users commonly create teams for different
            departments or divisions. You can create as many teams as you need.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
