'use client';

import { toast } from 'sonner';
import { Fades } from './compoents/fades';
import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { IconGrid } from './compoents/icon-grid';
import { Header } from './compoents/header';
import { useMount } from '@legendapp/state/react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { Show, use$, useObservable } from '@legendapp/state/react';
import { Command, CommandList, CommandGroup } from '@/components/ui/command';
import { ALL_ICONS, ICON_LOOKUP, normalizeKey } from './lib';
import {
  RECENT_LIMIT,
  PAGE_SIZE,
  INITIAL_VISIBLE,
  SEARCH_DEBOUNCE_MS,
  SCROLL_THRESHOLD_PX,
  normalizeForSearch,
  subscribeDebouncedSearch,
  loadRecentsFromStorage,
  upsertRecent,
} from '@/components/icons/icon-selector/lib';
import { Empty } from './compoents/empty';
import { cn } from '@/lib/utils';
import { uiState$ } from '@/features/layout/providers/ui-state';
import { TooltipProvider } from '@/components/ui/tooltip';

import type { Observable } from '@legendapp/state';
import type { BlockIcon, IconMeta } from './types';
import type { Id } from '@/convex/_generated/dataModel';

const RECENT_ICONS_KEY = 'icons:recent';

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
    const loaded = loadRecentsFromStorage(
      RECENT_ICONS_KEY,
      RECENT_LIMIT,
      (k) => normalizeKey(k),
      (k) => Object.prototype.hasOwnProperty.call(dynamicIconImports, k),
    );
    if (loaded.length) state$.recentList.set(loaded);
  });

  //listeners
  const onDebounced = useCallback(
    (value: string) => {
      state$.debouncedQuery.set(value);
      state$.visibleCount.set(INITIAL_VISIBLE);
    },
    [state$],
  );
  useEffect(() => subscribeDebouncedSearch(search$, SEARCH_DEBOUNCE_MS, onDebounced), [search$, onDebounced]);

  // handlers
  const handleSelect = useCallback(
    async (key: string, opts?: { close?: boolean; clearSearch?: boolean }) => {
      if (!state$.keyExists(key)) return toast.error('Icon not found');
      // Record recent with dedupe + persist via shared helper
      state$.recentList.set((prev) => upsertRecent(RECENT_ICONS_KEY, prev, key, RECENT_LIMIT, normalizeKey));
      if (blockId) {
        const c = uiState$.iconPicker.iconColor.get();
        void setPreset({ blockId, key, style: 'line', color: c }).catch(() => toast.error('Failed to set icon'));
        callback?.({ key, style: 'line', color: c, kind: 'preset' });
      }
      if (opts?.close !== false) close();
      if (opts?.clearSearch !== false) search$.set('');
    },
    [blockId, setPreset, callback, close, search$, state$],
  );

  // Random selection from the entire filtered set (O(1) selection, no extra allocations)
  const pickRandomKey = () => {
    const pool = state$.filteredAll.get();
    if (pool.length === 0) return null;
    return pool[(Math.random() * pool.length) | 0].kebab;
  };

  const handleRandom = () => {
    const k = pickRandomKey();
    if (k) void handleSelect(k, { close: false });
  };

  const scrollRafIdRef = useRef<number | null>(null);
  const filteredRecent = use$(state$.filteredRecent);
  const iconsToShow = use$(state$.iconsToShow);
  const color = use$(uiState$.iconPicker.iconColor);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="">
        <Command shouldFilter={false}>
          <Header search$={search$} onRandom={handleRandom} color$={uiState$.iconPicker.iconColor} />
          <div className={cn('relative pt-1 pb-2', color === 'default' ? 'text-foreground' : `text-${color}`)}>
            <CommandList
              onScroll={(e) => {
                if (scrollRafIdRef.current !== null) return;
                const t = e.currentTarget;
                scrollRafIdRef.current = requestAnimationFrame(() => {
                  scrollRafIdRef.current = null;
                  const distanceFromBottom = t.scrollHeight - (t.scrollTop + t.clientHeight);
                  if (distanceFromBottom <= SCROLL_THRESHOLD_PX && state$.hasMore.get()) {
                    state$.visibleCount.set((prev) => prev + PAGE_SIZE);
                  }
                });
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
    </TooltipProvider>
  );
}

export default IconsTab;
