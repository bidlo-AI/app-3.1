'use client';

import { Button } from '@/components/ui/button';
import { ChevronsRight, Menu } from 'lucide-react';
import { useSidebar } from '@/features/layout/components/sidebar/providers/SidebarProvider';
import { Show } from '@legendapp/state/react';

export const DesktopSidebarAction = () => {
  const sidebar$ = useSidebar();

  return (
    <div className="hidden md:flex sidebar h-full items-center pr-1.5">
      <Show if={sidebar$.sidebar_hidden}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => sidebar$.toggleSidebar()}
          className="group z-[41]"
          aria-label="Pin sidebar"
          onMouseEnter={() => sidebar$.openOverlay()}
        >
          <Show if={sidebar$.sidebar_hidden} else={() => <Menu className="size-5" />}>
            <Menu className="size-5 group-hover:hidden" />
            <ChevronsRight className="size-5 hidden group-hover:block" />
          </Show>
        </Button>
      </Show>
    </div>
  );
};
