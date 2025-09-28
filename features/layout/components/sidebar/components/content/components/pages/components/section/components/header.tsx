'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { AddIconButton } from '../../buttons/add-icon-button';

/**
 * SectionHeader
 * Simple, self-contained header row for a pages section.
 * Handles label click to toggle open state and shows an Add action.
 */
export const SectionHeader = memo(function SectionHeader({
  title,
  onToggle,
  onAdd,
  tooltip,
  isSelected,
}: {
  title: string;
  onToggle: () => void;
  onAdd: () => void;
  tooltip: string;
  isSelected?: boolean;
}) {
  return (
    <div
      className={cn(
        'cursor-pointer group/list-row flex items-center h-7.5 rounded-md hover:bg-hover pr-2 gap-0.5',
        isSelected && 'bg-hover',
      )}
    >
      <div
        role="button"
        onClick={onToggle}
        style={{ padding: '0 8px', paddingLeft: 8 }}
        className="h-full flex-1 flex items-center gap-2 min-w-0 pl-2 justify-start text-xs font-semibold text-muted-foreground-opaque truncate"
      >
        <span className={cn('', isSelected && 'text-foreground')}>{title}</span>
      </div>
      <AddIconButton
        ariaLabel={tooltip}
        tooltipText={tooltip}
        className="size-7 opacity-0 group-hover/list-row:opacity-100 focus:opacity-100"
        onClick={onAdd}
      />
    </div>
  );
});
