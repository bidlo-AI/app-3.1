import { Header } from './components/header';
import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';
import { preloadQuery } from 'convex/nextjs';
import { Suspense } from 'react';
import { LoadingContent } from './components/loading';

// menu items
import { Search } from './components/search';
import { Home } from './components/home';
import { Data } from './components/data';
import { Settings } from './components/settings';
import { Pages } from './components/pages';

// Mobile and desktop sidebar content.
// Kept as a client component so it can render inside the mobile Sheet.
export const SidebarContent = ({
  preloadedUser,
  orgId,
  accessToken,
}: {
  preloadedUser: Preloaded<typeof api.users.getUser>;
  orgId: string;
  accessToken: string;
}) => (
  <>
    <Header preloadedUser={preloadedUser} />
    <div className="flex flex-col gap-px px-2 mb-2">
      <Home />
      <Search />
    </div>
    <div className="flex flex-col px-2 mb-5 gap-5">
      <div className="flex flex-col gap-1">
        <Suspense fallback={<LoadingContent />}>
          <Content orgId={orgId} accessToken={accessToken} />
        </Suspense>
      </div>
      <div className="flex flex-col gap-1">
        <Data />
        <Settings />
      </div>
    </div>
  </>
);

// Server component that preloads sidebar queries for hydration.
// This reduces client waterfalls and keeps live reactivity via usePreloadedQuery.
async function Content({ orgId, accessToken }: { orgId: string; accessToken: string }) {
  const [preloadedPrivatePages, preloadedTeamSections] = await Promise.all([
    preloadQuery(api.blocks.listPrivatePages, { workosOrgId: orgId }, { token: accessToken }),
    preloadQuery(api.blocks.listTeamPagesForUser, { workosOrgId: orgId }, { token: accessToken }),
  ]);

  return (
    <Pages orgId={orgId} preloadedPrivatePages={preloadedPrivatePages} preloadedTeamSections={preloadedTeamSections} />
  );
}
