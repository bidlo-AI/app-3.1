'use client';

// Page-specific dropdown menu content.

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Copy, Trash2, ExternalLink } from 'lucide-react';

export function PageMoreContent({
  title,
  onDelete,
  onDuplicate,
}: {
  title: string;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{title}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onDuplicate}>
        <Copy /> Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem>
        <ExternalLink /> Open in new tab
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onClick={onDelete}>
        <Trash2 /> Delete
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
