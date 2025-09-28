import { Profile } from './components/profile';
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
  accessToken,
}: {
  preloadedUser: Preloaded<typeof api.users.getUser>;
  accessToken: string;
}) => (
  <>
    <Header preloadedUser={preloadedUser} />
    <div className="flex flex-col px-2 pb-5 gap-5 overflow-y-auto">
      <div className="flex flex-col gap-1">
        <Suspense fallback={<LoadingContent />}>
          <Content accessToken={accessToken} preloadedUser={preloadedUser} />
        </Suspense>
      </div>
      <Footer />
    </div>
  </>
);

//------------------------------------------
// SIDEBAR SECTIONS
//------------------------------------------
const Header = ({ preloadedUser }: { preloadedUser: Preloaded<typeof api.users.getUser> }) => (
  <>
    <Profile preloadedUser={preloadedUser} />
    <div className="flex flex-col gap-px px-2 mb-2">
      <Home />
      <Search />
    </div>
  </>
);

const Footer = () => (
  <div className="flex flex-col gap-1">
    <Data />
    <Settings />
  </div>
);

async function Content({
  accessToken,
  preloadedUser,
}: {
  accessToken: string;
  preloadedUser: Preloaded<typeof api.users.getUser>;
}) {
  const [preloadedPrivatePages, preloadedTeamSections] = await Promise.all([
    preloadQuery(api.blocks.listPrivatePages, {}, { token: accessToken }),
    preloadQuery(api.blocks.listTeamPagesForUser, {}, { token: accessToken }),
  ]);

  return (
    <Pages
      preloadedUser={preloadedUser}
      preloadedPrivatePages={preloadedPrivatePages}
      preloadedTeamSections={preloadedTeamSections}
    />
  );
}
