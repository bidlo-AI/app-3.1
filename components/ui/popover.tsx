'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';
// import { useUser } from "@/features/auth/providers/user";
// import { use$ } from "@legendapp/state/react";

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}
function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  collisionPadding = 8,
  noAnimation = false,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  noAnimation?: boolean;
}) {
  //! TODO: add this back in once we are saving the user's color
  // const user$ = useUser();
  // const color = use$(user$.color);
  const color = 'blue';
  const style = {
    '--color-primary': `var(--${color ?? 'blue'}-primary)`,
    ...props.style,
  } as React.CSSProperties;
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        style={style}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'shadow-popover bg-popover text-popover-foreground z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md outline-hidden',
          noAnimation
            ? 'data-[state=open]:animate-none data-[state=closed]:animate-none'
            : 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  scrollable?: boolean;
}
const PopoverGroup = forwardRef<HTMLDivElement, SectionProps>(({ children, scrollable, className, ...props }, ref) => (
  <div ref={ref} className={cn('px-1 py-1', scrollable ? 'overflow-y-auto' : 'shrink-0 ', className)} {...props}>
    {children}
  </div>
));
PopoverGroup.displayName = 'PopoverGroup';

const PopoverSeparator = ({ className }: { className?: string }) => {
  return <div className={cn('bg-border  h-px', className)} />;
};

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverGroup, PopoverSeparator };
