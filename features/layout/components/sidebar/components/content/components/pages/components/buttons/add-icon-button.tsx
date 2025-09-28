'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export const AddIconButton = ({
  ariaLabel,
  tooltipText,
  className,
  onClick,
}: {
  ariaLabel: string;
  tooltipText: string;
  className?: string;
  onClick: () => void;
}) => {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={ariaLabel}
          style={{ height: '20px', width: '20px' }}
          className={cn('rounded text-muted-foreground-opaque', className)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
        >
          <Plus className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
};
