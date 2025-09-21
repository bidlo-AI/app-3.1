import { Preloaded } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MobileSidebarAction } from './mobile';
import { DesktopSidebarAction } from './desktop';

export const SidebarActions = ({
  preloadedUser,
  accessToken,
  orgId,
}: {
  preloadedUser: Preloaded<typeof api.users.getUser>;
  accessToken: string;
  orgId: string;
}) => (
  <>
    <MobileSidebarAction preloadedUser={preloadedUser} accessToken={accessToken} orgId={orgId} />
    <DesktopSidebarAction />
  </>
);
