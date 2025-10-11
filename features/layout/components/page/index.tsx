'use client';

import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import Icon from '@/components/icons/icon';
import { IconSelector } from '@/components/icons/icon-selector';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Preloaded, usePreloadedQuery } from 'convex/react';

export default function Page({ preloaded }: { preloaded: Preloaded<typeof api.blocks.getBlock> }) {
  const data = usePreloadedQuery(preloaded);

  return (
    <>
      <div>
        {/* Block icon above the title. If none, show an add icon button instead. */}
        <IconSelector blockId={data.block._id}>
          {data.block.icon ? (
            <Icon
              icon={data.block.icon}
              title={data.block.title}
              className="size-[78px] mb-2 rounded-md hover:bg-hover"
            />
          ) : (
            <Button variant="ghost" size="xs" className="mb-2">
              <Plus />
              Add icon
            </Button>
          )}
        </IconSelector>
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
    </>
  );
}
