'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { BaseArgs } from '../types';
import { Observable } from '@legendapp/state';
import { ExpandButton } from '../../buttons/expand-button';
import { FileText } from 'lucide-react';
import { Icon as BlockIcon } from '@/components/icons/icon';
import type { Doc } from '@/convex/_generated/dataModel';

export const Route = ({
  id,
  title,
  indent,
  open$,
  icon,
}: BaseArgs & {
  indent: number;
  open$: Observable<boolean>;
  icon?: Doc<'blocks'>['icon'];
}) => {
  const indentStyle = useMemo(() => ({ padding: '0 8px', paddingLeft: 8 + indent * 8 }), [indent]);

  return (
    <Link href={`/${id}`} prefetch={false} aria-label={title} className="flex-1 flex items-center h-full min-w-0">
      <div
        role="button"
        className="flex items-center gap-2 min-w-0 pl-2 justify-start font-medium truncate"
        style={indentStyle}
      >
        <span className="relative inline-flex items-center justify-center size-5 shrink-0">
          {icon ? (
            <BlockIcon icon={icon} title={title} size={20} className="group-hover/list-row:opacity-0" />
          ) : (
            <FileText className="size-5 group-hover/list-row:opacity-0 text-muted-foreground-opaque" />
          )}
          <ExpandButton open$={open$} className="group-hover/list-row:opacity-100 opacity-0 absolute -inset-px" />
        </span>
        <div className="truncate">{title}</div>
      </div>
    </Link>
  );
};
