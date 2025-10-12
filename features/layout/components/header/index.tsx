import { Suspense } from 'react';
import { OrgSelect } from '@/features/layout/components/header/components/org-select';
import { AgentActions } from '@/features/layout/components/header/components/agent-actions';
import { SidebarActions } from '@/features/layout/components/header/components/sidebar-actions';
import { Preloaded } from 'convex/react';
import { api } from '@/convex/_generated/api';

// import { Crumbs } from "./components/crumbs";
// import { TeamPresence } from "./components/team-presence/presence-client";

export const Header = ({
  preloadedUser,
  accessToken,
  orgId,
}: {
  preloadedUser: Preloaded<typeof api.users.getUser>;
  accessToken: string;
  orgId: string;
}) => (
  <>
    <div className="spacer-l" />
    <SidebarActions preloadedUser={preloadedUser} accessToken={accessToken} />
    <OrgSelect orgId={orgId} />
    <Suspense fallback={null}>
      <AgentActions />
    </Suspense>
    <div className="spacer-r" />
  </>
);
