import { Preloaded } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MobileSidebarAction } from './mobile';
import { DesktopSidebarAction } from './desktop';

export const SidebarActions = ({
  preloadedUser,
  accessToken,
}: {
  preloadedUser: Preloaded<typeof api.users.getUser>;
  accessToken: string;
}) => (
  <>
    <MobileSidebarAction preloadedUser={preloadedUser} accessToken={accessToken} />
    <DesktopSidebarAction />
  </>
);
