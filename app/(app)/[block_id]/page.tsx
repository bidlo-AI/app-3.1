import { Favorites } from '@/features/blocks/components/header/favorites';
import { Presence } from '@/features/blocks/components/header/presence';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { More } from '@/features/blocks/components/header/more';
import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

import Page from '@/features/layout/components/page';

export default async function BlockPage({ params }: { params: Promise<{ block_id: string }> }) {
  const { block_id } = await params;
  const { accessToken } = await withAuth();
  const preloaded = await preloadQuery(
    api.blocks.getBlock,
    { blockId: block_id as Id<'blocks'> },
    { token: accessToken },
  );

  return (
    <>
      {/* Live presence for this block */}
      <Presence block_id={block_id} />

      {/* Header actions */}
      <div className="actions flex items-center text-muted-foreground">
        <Favorites />
        <More />
      </div>

      {/* Content */}
      <div className="content">
        <div className="flex size-full flex-col justify-start gap-4">
          <Page preloaded={preloaded} />
          {/* Renders counter for debugging rerenders and state updates */}
          {/* <RendersCounter /> */}
        </div>
      </div>
    </>
  );
}
