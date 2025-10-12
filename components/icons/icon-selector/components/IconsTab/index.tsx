'use client';

import { toast } from 'sonner';
import { Fades } from './compoents/fades';
import { useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { IconGrid } from './compoents/icon-grid';
import { Header } from './compoents/incon-header';
import { useMount } from '@legendapp/state/react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { Show, use$, useObservable } from '@legendapp/state/react';
import { Command, CommandList, CommandGroup } from '@/components/ui/command';
import { ALL_ICONS, ICON_LOOKUP, normalizeForSearch, normalizeKey } from './lib';
import { Empty } from './compoents/empty';
import { cn } from '@/lib/utils';
import { uiState$ } from '@/features/layout/providers/ui-state';

import type { Observable } from '@legendapp/state';
import type { BlockIcon, IconMeta } from './types';
import type { Id } from '@/convex/_generated/dataModel';

const RECENT_ICONS_KEY = 'icons:recent';
const RECENT_LIMIT = 11; // cap list length and recent UI row
const PAGE_SIZE = 66; // 11 columns * 6 rows
const INITIAL_VISIBLE = PAGE_SIZE * 2; // ensure initial overflow to enable scrolling
const LOAD_MORE_DEBOUNCE_MS = 120; // debounce load-more on scroll
const SEARCH_DEBOUNCE_MS = 120; // debounce search input
const SCROLL_THRESHOLD_PX = 16; // distance from bottom to trigger load-more

export function IconsTab({
  blockId,
  close,
  search$,
  callback,
}: {
  blockId?: Id<'blocks'>;
  close: () => void;
  search$: Observable<string>;
  callback?: (icon: BlockIcon) => void;
}) {
  const setPreset = useMutation(api.icons.setPageIconPreset);
  const state$ = useObservable({
    //state
    recentList: [] as string[],
    debouncedQuery: '',
    visibleCount: INITIAL_VISIBLE,
    hasMore: () => state$.visibleCount.get() < state$.filteredAll.get().length,
    keyExists: (key: string) => Object.prototype.hasOwnProperty.call(dynamicIconImports, normalizeKey(key)),
    showRecent: () => state$.filteredRecent.get().length > 0,
    showIcons: () => state$.iconsToShow.get().length > 0,
    showAll: () => state$.showIcons.get() && state$.showRecent.get(),
    noResults: () => state$.filteredAll.get().length === 0,
    // UI state for preview hue
    iconsToShow: () =>
      state$.filteredAll
        .get()
        .slice(0, state$.visibleCount.get())
        .map((i) => i.kebab),

    //filtered
    filteredAll: () => {
      const q = normalizeForSearch(state$.debouncedQuery.get());
      if (!q) return ALL_ICONS;
      return ALL_ICONS.filter((m) => m.pSearch.includes(q) || m.kSearch.includes(q));
    },
    filteredRecent: () => {
      const q = normalizeForSearch(state$.debouncedQuery.get());
      const list = state$.recentList.get().slice(0, RECENT_LIMIT);
      const metas = list.map((k) => ICON_LOOKUP.get(k)).filter(Boolean) as IconMeta[];
      if (!q) return metas.map(({ kebab }) => kebab);
      return metas.filter((m) => m.pSearch.includes(q) || m.kSearch.includes(q)).map(({ kebab }) => kebab);
    },
  });

  //mount
  useMount(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(RECENT_ICONS_KEY) : null;
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed
        .map((k: unknown) => (typeof k === 'string' ? normalizeKey(k) : ''))
        .filter((k: string) => k && Object.prototype.hasOwnProperty.call(dynamicIconImports, k));
      state$.recentList.set(cleaned.slice(0, RECENT_LIMIT));
    }
  });

  //listeners
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = search$.onChange(({ value }) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        state$.debouncedQuery.set(value);
        state$.visibleCount.set(INITIAL_VISIBLE);
      }, SEARCH_DEBOUNCE_MS);
    });
    return () => {
      if (t) clearTimeout(t);
      unsubscribe();
    };
  }, [search$]);

  // handlers
  const handleRecordRecent = (key: string) =>
    state$.recentList.set((prev) => {
      const normalized = normalizeKey(key);
      const withoutDupes = prev.filter((k) => k !== normalized);
      const next = [normalized, ...withoutDupes].slice(0, RECENT_LIMIT);
      if (typeof window !== 'undefined') window.localStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(next));
      return next;
    });
  const handleSelect = async (key: string) => {
    if (!state$.keyExists(key)) return toast.error('Icon not found');
    handleRecordRecent(key);
    if (blockId) {
      const c = uiState$.iconPicker.iconColor.get();
      void setPreset({ blockId, key, style: 'line', color: c }).catch(() => toast.error('Failed to set icon'));
      callback?.({ key, style: 'line', color: c, kind: 'preset' });
    }
    close();
    search$.set('');
  };

  // Random selection from the entire filtered set (O(1) selection, no extra allocations)
  const pickRandomKey = () => {
    const pool = state$.filteredAll.get();
    if (pool.length === 0) return null;
    return pool[(Math.random() * pool.length) | 0].kebab;
  };

  const handleRandom = () => {
    const k = pickRandomKey();
    if (k) void handleSelect(k);
  };

  // Keep load-more debounce state in a ref to avoid mutating DOM
  const lastLoadMoreAtRef = useRef(0);
  const filteredRecent = use$(state$.filteredRecent);
  const iconsToShow = use$(state$.iconsToShow);
  const color = use$(uiState$.iconPicker.iconColor);

  return (
    <div className="">
      <Command shouldFilter={false}>
        <Header search$={search$} onRandom={handleRandom} color$={uiState$.iconPicker.iconColor} />
        <div className={cn('relative pt-1 pb-2', color === 'default' ? 'text-foreground' : `text-${color}`)}>
          <CommandList
            onScroll={(e) => {
              const t = e.currentTarget;
              const distanceFromBottom = t.scrollHeight - (t.scrollTop + t.clientHeight);
              if (distanceFromBottom <= SCROLL_THRESHOLD_PX && state$.hasMore.get()) {
                const now = Date.now();
                const last = lastLoadMoreAtRef.current;
                if (now - last >= LOAD_MORE_DEBOUNCE_MS) {
                  lastLoadMoreAtRef.current = now;
                  state$.visibleCount.set((prev) => prev + PAGE_SIZE);
                }
              }
            }}
          >
            <Empty show$={state$.noResults} search$={search$} />
            <Show if={state$.showRecent}>
              <CommandGroup heading="Recent" className="text-inherit">
                <IconGrid items={filteredRecent} onSelect={handleSelect} />
              </CommandGroup>
            </Show>
            <Show if={state$.showIcons}>
              <CommandGroup heading="Icons" className="text-inherit">
                <IconGrid items={iconsToShow} onSelect={handleSelect} />
              </CommandGroup>
            </Show>
          </CommandList>
          <Fades />
        </div>
      </Command>
    </div>
  );
}

export default IconsTab;
