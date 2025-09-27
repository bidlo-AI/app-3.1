'use client';

import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { use$ } from '@legendapp/state/react';
import { Observable } from '@legendapp/state';

export const ExpandButton = ({ open$, className }: { open$: Observable<boolean>; className: string }) => {
  const open = use$(open$);

  return (
    <div
      role="button"
      aria-label={open ? 'Collapse' : 'Expand'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open$.set(!open);
      }}
      className={cn('size-5 rounded hover:bg-hover flex items-center justify-center', className)}
    >
      <ChevronRight
        className={cn('size-5 text-muted-foreground-opaque transition-transform duration-150', open && 'rotate-90')}
      />
    </div>
  );
};
