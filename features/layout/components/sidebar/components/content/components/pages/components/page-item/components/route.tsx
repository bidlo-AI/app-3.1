'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { BaseArgs } from '../types';
import { cn } from '@/lib/utils';
import { Observable } from '@legendapp/state';
import { ExpandButton } from '../../buttons/expand-button';
import { File } from 'lucide-react';

export const Route = ({
  id,
  title,
  indent,
  isSelected,
  open$,
}: BaseArgs & {
  indent: number;
  isSelected: boolean;
  open$: Observable<boolean>;
}) => {
  const indentStyle = useMemo(() => ({ padding: '0 8px', paddingLeft: 8 + indent * 8 }), [indent]);

  return (
    <Link href={`/${id}`} prefetch={false} aria-label={title} className="flex-1 flex items-center h-full min-w-0">
      <div
        role="button"
        className="flex items-center gap-2 min-w-0 pl-2 justify-start font-medium text-muted-foreground-opaque truncate"
        style={indentStyle}
      >
        <span className="relative inline-flex items-center justify-center size-5 shrink-0">
          <File className={cn('size-5 group-hover/list-row:opacity-0')} />
          <ExpandButton open$={open$} className="group-hover/list-row:opacity-100 opacity-0 absolute -inset-px" />
        </span>
        <div className={cn(`truncate`, isSelected && 'text-foreground')}>{title}</div>
      </div>
    </Link>
  );
};
