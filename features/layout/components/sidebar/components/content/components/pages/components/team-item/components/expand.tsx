'use client';

import { ExpandButton } from '../../buttons/expand-button';
import { Observable } from '@legendapp/state';
import { Icon as BlockIcon } from '@/components/icons/icon';
import type { Doc } from '@/convex/_generated/dataModel';

export const Expand = ({
  open$,
  teamName,
  icon,
}: {
  open$: Observable<boolean>;
  teamName: string;
  icon?: Doc<'teams'>['icon'];
}) => {
  return (
    <div
      role="button"
      onClick={() => open$.set((prev) => !prev)}
      className="flex items-center gap-2 min-w-0 pl-2 justify-start font-medium truncate flex-1"
      style={{ padding: '0 8px', paddingLeft: 8 }}
    >
      <span className="bg-hover group-hover/list-row:bg-transparent rounded relative inline-flex items-center justify-center size-5 shrink-0">
        <BlockIcon icon={icon} title={teamName} className="size-5 opacity-100 group-hover/list-row:opacity-0" />
        <ExpandButton open$={open$} className="group-hover/list-row:opacity-100 opacity-0 absolute -inset-px" />
      </span>
      <span>{teamName}</span>
    </div>
  );
};
