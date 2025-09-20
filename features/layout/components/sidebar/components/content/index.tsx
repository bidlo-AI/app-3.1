import { Header } from './components/header';
import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';

// menu items
import { Search } from './components/search';
import { Home } from './components/home';
import { Data } from './components/data';
import { Settings } from './components/settings';
import { Pages } from './components/pages';

// Mobile and desktop sidebar content.
// Kept as a client component so it can render inside the mobile Sheet.
export const SidebarContent = async ({
  preloadedUser,
  orgId,
}: {
  preloadedUser: Preloaded<typeof api.users.getUser>;
  orgId: string;
}) => {
  return (
    <>
      <Header preloadedUser={preloadedUser} />
      <div className="flex flex-col gap-px px-2 mb-2">
        <Home />
        <Search />
      </div>
      <div className="flex flex-col px-2 mb-5 gap-5">
        <div className="flex flex-col gap-1">
          <Pages orgId={orgId} />
        </div>
        <div className="flex flex-col gap-1">
          <Data />
          <Settings />
        </div>
      </div>
    </>
  );
};
