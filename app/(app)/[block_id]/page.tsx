import { Favorites } from '@/features/blocks/components/header/favorites';
import { Presence } from '@/features/blocks/components/header/presence';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { More } from '@/features/blocks/components/header/more';
import { preloadQuery, preloadedQueryResult } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';

export default async function BlockPage({ params }: { params: Promise<{ block_id: string }> }) {
  const { block_id } = await params;
  // Authenticate and use Convex preloading for SSR + hydration
  const { accessToken } = await withAuth();
  const preloaded = await preloadQuery(
    api.blocks.getBlock,
    { blockId: block_id as Id<'blocks'> },
    { token: accessToken },
  );
  const data = await preloadedQueryResult(preloaded);

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
        <div className="flex size-full flex-col justify-start p-4 gap-4">
          <div>
            <div className="text-base font-semibold">{data.block.title}</div>
            <div className="text-muted-foreground text-sm">
              {data.block.type} • {data.block.scope}
            </div>
          </div>

          {/* Block content rendering */}
          <div className="rounded-md border p-3 bg-muted/30">
            {data.block.content == null ? (
              <span className="text-muted-foreground-opaque">No content yet</span>
            ) : typeof data.block.content === 'string' ? (
              <p className="whitespace-pre-wrap">{data.block.content}</p>
            ) : (
              <pre className="text-sm overflow-auto">{JSON.stringify(data.block.content, null, 2)}</pre>
            )}
          </div>

          {/* Children list */}
          {data.children.length > 0 && (
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-2">Children</div>
              <ul className="flex flex-col gap-1">
                {data.children.map((c) => (
                  <li key={c._id}>
                    <Link href={`/${c._id}`} className="hover:underline">
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
