'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
}

function Tooltip({
  delayDuration,
  disableHoverableContent,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & { delayDuration?: number }) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root data-slot="tooltip" disableHoverableContent={disableHoverableContent ?? true} {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 4,
  collisionPadding = 8,
  children,
  style,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'dark duration-75 animate-in shadow-popover fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
          className,
        )}
        style={
          style ??
          ({
            'backgroundColor': 'oklch(0.26 0 0)',
            'color': 'oklch(1 0.0001 274.03 / 81%)',
            '--color-foreground': 'oklch(1 0.0001 274.03 / 81%)',
            '--color-muted-foreground': 'oklch(1 0.0001 274.03 / 43%)',
          } as React.CSSProperties)
        }
        {...props}
      >
        {children}
        {/* <TooltipPrimitive.Arrow className="bg-popover fill-popover z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] " /> */}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
