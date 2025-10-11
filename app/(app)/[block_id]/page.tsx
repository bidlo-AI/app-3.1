import { Favorites } from '@/features/blocks/components/header/favorites';
import { Presence } from '@/features/blocks/components/header/presence';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { More } from '@/features/blocks/components/header/more';
import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

import Page from '@/features/layout/components/page';
// import { RendersCounter } from './renders-counter';

export default async function BlockPage({ params }: { params: Promise<{ block_id: string }> }) {
  const { block_id } = await params;
  // Authenticate and use Convex preloading for SSR + hydration
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

// const Chat = ({ block_id }: { block_id: string }) => {
//   return (
//     <div className="flex size-full flex-col justify-between p-4">
//       <div>
//         <div>Chat</div>
//         <div className="text-muted-foreground">Block {block_id}</div>
//       </div>

//       {/* THE CHAT BAR */}
//       <div id="chat-input" className="shadow-sm text-base rounded-3xl bg-muted border h-fit min-h-12 w-full px-4 py-3">
//         <span className="text-muted-foreground-opaque">Search or Ask anything...</span>
//       </div>
//     </div>
//   );
// };

// const Page = ({ block_id }: { block_id: string }) => {
//   return (
//     <div>
//       <div>Page</div>
//       <div className="text-muted-foreground">Block {block_id}</div>
//     </div>
//   );
// };
