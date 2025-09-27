'use client';

// Team-specific dropdown menu content.

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Settings, Users } from 'lucide-react';

export function TeamMoreContent({
  teamName,
  onOpenSettings,
  onManageMembers,
}: {
  teamName: string;
  onOpenSettings?: () => void;
  onManageMembers?: () => void;
}) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{teamName}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onOpenSettings}>
        <Settings /> Team settings
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onManageMembers}>
        <Users /> Members
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
