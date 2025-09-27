'use client';

import { api } from '@/convex/_generated/api';
import { Preloaded } from 'convex/react';
import { UserMenu } from './user-menu';
import { PinSidebar } from './pin-sidebar';
import { NewPage } from './new-page';

export const Profile = ({ preloadedUser }: { preloadedUser: Preloaded<typeof api.users.getUser> }) => {
  return (
    <div className="h-10 px-2 flex items-center">
      <div className="flex items-center justify-between w-full gap-1.5 p-0.5 pl-2 rounded hover:bg-hover ">
        <UserMenu preloadedUser={preloadedUser} />
        <PinSidebar />
        <NewPage />
      </div>
    </div>
  );
};
