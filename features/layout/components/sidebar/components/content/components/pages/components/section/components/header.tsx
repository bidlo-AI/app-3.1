'use client';

import { memo } from 'react';

/**
 * SectionHeader
 * Simple, self-contained header row for a pages section.
 * Handles label click to toggle open state and shows an Add action.
 */
export const SectionHeader = memo(function SectionHeader({
  title,
  onToggle,
  children,
}: {
  title: string;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="cursor-pointer group/list-row flex items-center h-7.5 rounded-md hover:bg-hover pr-2 gap-0.5">
      <div
        role="button"
        onClick={onToggle}
        style={{ padding: '0 8px', paddingLeft: 8 }}
        className="h-full flex-1 flex items-center gap-2 min-w-0 pl-2 justify-start text-xs font-semibold text-muted-foreground-opaque truncate"
      >
        {title}
      </div>
      <div className="absolute right-0 w-0 overflow-hidden group-hover/list-row:w-fit group-hover/list-row:relative flex gap-0.5">
        {children}
      </div>
    </div>
  );
});
