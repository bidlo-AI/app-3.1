'use client';

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarContent } from '@/features/layout/components/sidebar/components/content';
import { ChevronsRight, Menu } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useSidebar } from '@/features/layout/components/sidebar/providers/SidebarProvider';
import { Show } from '@legendapp/state/react';
import { Preloaded } from 'convex/react';
import { api } from '@/convex/_generated/api';

export const SidebarActions = ({
  preloadedUser,
  orgId,
}: {
  preloadedUser: Preloaded<typeof api.users.getUser>;
  orgId: string;
}) => {
  const sidebar$ = useSidebar();

  return (
    <>
      {/* Mobile: hamburger opens the sidebar in a sheet */}
      <div className="flex md:hidden sidebar h-full items-center pr-1.5">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <VisuallyHidden>
              <SheetHeader className="sr-only">
                <SheetTitle>Mobile Sidebar</SheetTitle>
              </SheetHeader>
            </VisuallyHidden>
            <SidebarContent preloadedUser={preloadedUser} orgId={orgId} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: show a Pin button when the sidebar is unpinned/hidden */}
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
    </>
  );
};
