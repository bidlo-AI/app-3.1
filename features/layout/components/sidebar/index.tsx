import { SidebarWrapper } from './components/wrapper';
import { SidebarContent } from './components/content';
import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';

export const Sidebar = async ({
  accessToken,
  startingWidth,
  preloadedUser,
}: {
  accessToken: string;
  startingWidth?: number;
  preloadedUser: Preloaded<typeof api.users.getUser>;
}) => (
  <div className="hidden md:flex">
    <SidebarWrapper startingWidth={startingWidth}>
      <SidebarContent preloadedUser={preloadedUser} accessToken={accessToken} />
    </SidebarWrapper>
  </div>
);
