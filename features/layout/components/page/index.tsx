import Link from 'next/link';
import { Preloaded } from 'convex/react';
import { Hero } from './components/Hero';
import { api } from '@/convex/_generated/api';
import { preloadedQueryResult } from 'convex/nextjs';

export default async function Page({ preloaded }: { preloaded: Preloaded<typeof api.blocks.getBlock> }) {
  const data = await preloadedQueryResult(preloaded);

  return (
    <>
      <Hero preloaded={preloaded} />
      <div className="@sm/page:px-12 px-4 flex flex-col gap-4">
        <div className="">
          <div className="text-base font-semibold">{data.block.title}</div>
          <div className="text-muted-foreground text-sm">
            {data.block.type} • {data.block.scope}
          </div>
        </div>

        {/* Block content rendering */}
        <div className=" rounded-md border p-3 bg-muted/30">
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
    </>
  );
}
