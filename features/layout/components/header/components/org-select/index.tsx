import { preloadQuery } from 'convex/nextjs';
import { OrgSelectClient } from './client';
import { api } from '@/convex/_generated/api';
import { withAuth } from '@workos-inc/authkit-nextjs';

export const OrgSelect = async ({ orgId }: { orgId: string }) => {
  const { accessToken } = await withAuth();
  const preloaded = await preloadQuery(api.organizations.getUserOrganizations, {}, { token: accessToken });

  return (
    <div className="org flex items-center">
      <OrgSelectClient preloaded={preloaded} selectedOrg={orgId} />
    </div>
  );
};
