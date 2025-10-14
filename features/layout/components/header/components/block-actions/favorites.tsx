'use client';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const Favorites = () => {
  return (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground-opaque"
          onMouseDown={() => {
            console.log('favorites');
          }}
        >
          <Star className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Add to your favorites</p>
      </TooltipContent>
    </Tooltip>
  );
};
