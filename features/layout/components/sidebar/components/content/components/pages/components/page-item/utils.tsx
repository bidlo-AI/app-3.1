import { api } from '@/convex/_generated/api';
import { HandleAddPage } from './types';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';

//variables
export const DEFAULT_PAGE_NAME = 'New page';

//hooks
export const useHandleAddPage = () => {
  const createPage = useMutation(api.blocks.createPage);
  const router = useRouter();
  // Use the argument shape of HandleAddPage instead of the function type itself
  return async ({ scope, teamId, parentId, title = DEFAULT_PAGE_NAME }: Parameters<HandleAddPage>[0]) => {
    const res = await createPage({ scope, teamId, parentId, title });
    if (res?.blockId) router.push(`/${res.blockId}`);
  };
};
