'use client';

import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExpandButton } from '../../buttons/expand-button';
import { Observable } from '@legendapp/state';

export const Expand = ({ open$, teamName }: { open$: Observable<boolean>; teamName: string }) => {
  return (
    <div
      role="button"
      onClick={() => open$.set((prev) => !prev)}
      className="flex items-center gap-2 min-w-0 pl-2 justify-start font-semibold truncate flex-1"
      style={{ padding: '0 8px', paddingLeft: 8 }}
    >
      <span className="bg-hover group-hover/list-row:bg-transparent rounded relative inline-flex items-center justify-center size-5 shrink-0">
        <Users className=" size-4 opacity-100 group-hover/list-row:opacity-0" />
        <ExpandButton open$={open$} className="group-hover/list-row:opacity-100 opacity-0 absolute -inset-px" />
      </span>
      <span className={cn('')}>{teamName}</span>
    </div>
  );
};
