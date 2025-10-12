'use client';

import { useEffect, memo, useRef, useState } from 'react';
import { LazyIcon } from './lazy-icon';
// import { For, use$ } from '@legendapp/state/react';

type IconGridProps = {
  items: string[]; // kebab-case icon keys
  onSelect: (kebab: string) => void;
};

const COLUMNS = 11;
const ROW_HEIGHT = 32; // px; matches size-8 + padding + grid gaps
const OVERSCAN_ROWS = 3;

// Reusable grid for rendering icon buttons
export const IconGrid = memo(function IconGrid({ items, onSelect }: IconGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Find the nearest scrollable ancestor (the CommandList) and listen to scroll + resize
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    let el: HTMLElement | null = root.parentElement as HTMLElement | null;
    // Walk up until we find an element that actually scrolls
    while (el && el.scrollHeight <= el.clientHeight) el = el.parentElement as HTMLElement | null;
    if (!el) return;

    const updateFromEl = () => {
      setScrollTop(el!.scrollTop);
      setViewportHeight(el!.clientHeight);
    };
    updateFromEl();

    const onScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        setScrollTop(el!.scrollTop);
      });
    };
    const onResize = () => updateFromEl();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      const id = rafIdRef.current;
      if (id !== null) cancelAnimationFrame(id);
    };
  }, []);

  const totalRows = Math.ceil(items.length / COLUMNS);
  const totalHeight = totalRows * ROW_HEIGHT;

  // Compute visible window (row-based) with overscan
  const startRow = Math.max(Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS, 0);
  const endRow = Math.min(
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN_ROWS,
    Math.max(totalRows - 1, 0),
  );
  const startIndex = startRow * COLUMNS;
  const endIndexExclusive = Math.min((endRow + 1) * COLUMNS, items.length);
  const slice = items.slice(startIndex, endIndexExclusive);
  const offsetTop = startRow * ROW_HEIGHT;

  return (
    <div ref={containerRef} className="relative" style={{ height: totalHeight }}>
      <div
        className="absolute inset-x-0 top-0 grid grid-cols-11 gap-0 px-2"
        style={{ transform: `translateY(${offsetTop}px)` }}
      >
        {slice.map((kebab) => (
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
    </div>
  );
});
