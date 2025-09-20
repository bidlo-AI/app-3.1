import { SidebarWrapper } from './components/wrapper';
import { SidebarContent } from './components/content';
import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';

export const Sidebar = async ({
  startingWidth,
  preloadedUser,
  orgId,
}: {
  startingWidth?: number;
  preloadedUser: Preloaded<typeof api.users.getUser>;
  orgId: string;
}) => {
  return (
    <div className="hidden md:flex">
      <SidebarWrapper startingWidth={startingWidth}>
        <SidebarContent preloadedUser={preloadedUser} orgId={orgId} />
      </SidebarWrapper>
    </div>
  );
};
