import Link from 'next/link';
import { Preloaded } from 'convex/react';
import { Hero } from './components/Hero';
import { api } from '@/convex/_generated/api';
import { preloadedQueryResult } from 'convex/nextjs';
import { PageProvider } from './provider';

export default async function Page({ preloaded }: { preloaded: Preloaded<typeof api.blocks.getBlock> }) {
  const data = await preloadedQueryResult(preloaded);

  return (
    <PageProvider data={data} preloaded={preloaded}>
      <Hero />
      <div className="@sm/page:px-12 px-4 flex flex-col gap-4">
        {/* Block content rendering */}
        <div className="rounded-md border p-3 bg-muted/30">
          <pre>{JSON.stringify(data.block ?? 'No content', null, 2)}</pre>
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
    </PageProvider>
  );
}
