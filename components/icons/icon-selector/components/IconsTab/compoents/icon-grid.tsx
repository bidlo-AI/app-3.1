'use client';

import * as React from 'react';
import { LazyIcon } from './lazy-icon';
// import { For, use$ } from '@legendapp/state/react';

type IconGridProps = {
  items: string[]; // kebab-case icon keys
  onSelect: (kebab: string) => void;
};

// Reusable grid for rendering icon buttons
export const IconGrid = React.memo(function IconGrid({ items, onSelect }: IconGridProps) {
  return (
    <div className="grid grid-cols-11 gap-0 px-2">
      {items.map((kebab) => (
        <button
          key={kebab}
          className="hover:bg-hover flex size-8 items-center justify-center rounded p-1 cursor-pointer"
          onClick={() => onSelect(kebab)}
          title={kebab}
        >
          <LazyIcon kebab={kebab} />
        </button>
      ))}
    </div>
  );
});
