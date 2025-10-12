import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarContent } from '@/features/layout/components/sidebar/components/content';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Preloaded } from 'convex/react';
import { Menu } from 'lucide-react';
import { api } from '@/convex/_generated/api';

export const MobileSidebarAction = ({
  preloadedUser,
  accessToken,
}: {
  preloadedUser: Preloaded<typeof api.users.getUser>;
  accessToken: string;
}) => {
  return (
    <div className="flex md:hidden sidebar h-full items-center pr-1.5">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="size-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[240px]" hideCloseButton>
          <VisuallyHidden>
            <SheetHeader className="sr-only">
              <SheetTitle>Mobile Sidebar</SheetTitle>
            </SheetHeader>
          </VisuallyHidden>
          <div>
            <SidebarContent preloadedUser={preloadedUser} accessToken={accessToken} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
