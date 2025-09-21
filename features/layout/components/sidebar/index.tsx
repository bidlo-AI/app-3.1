import { SidebarWrapper } from './components/wrapper';
import { SidebarContent } from './components/content';
import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';

export const Sidebar = async ({
  orgId,
  accessToken,
  startingWidth,
  preloadedUser,
}: {
  orgId: string;
  accessToken: string;
  startingWidth?: number;
  preloadedUser: Preloaded<typeof api.users.getUser>;
}) => (
  <div className="hidden md:flex">
    <SidebarWrapper startingWidth={startingWidth}>
      <SidebarContent preloadedUser={preloadedUser} orgId={orgId} accessToken={accessToken} />
    </SidebarWrapper>
  </div>
);
