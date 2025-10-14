'use client';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const More = () => {
  return (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground-opaque"
          onMouseDown={() => {
            console.log('More');
          }}
        >
          <Settings2 className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Page settings</p>
      </TooltipContent>
    </Tooltip>
  );
};
