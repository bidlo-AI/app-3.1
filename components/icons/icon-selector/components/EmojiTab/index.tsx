'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Command, CommandList, CommandGroup } from '@/components/ui/command';
import { toast } from 'sonner';
import { Show, use$, useObservable, useMount } from '@legendapp/state/react';
import type { Observable } from '@legendapp/state';
import { Fades } from '@/components/icons/icon-selector/components/IconsTab/compoents/fades';
import { BlockIcon } from '../IconsTab/types';
import { SectionNav } from '@/components/icons/icon-selector/components/EmojiTab/components/section-nav';
import { Header } from '@/components/icons/icon-selector/components/EmojiTab/components/header';
import { EmojiGrid } from '@/components/icons/icon-selector/components/EmojiTab/components/emoji-grid';
import type { CategoryKey } from './types';
import { CATEGORY_ORDER, LABEL_TO_KEY, SKIN_TONES } from './lib';
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

// Large dataset of emojis organized by category (ships with emoji-picker-react)
// Minimal fields used: names (n), unified (u), variations (v)
// Importing JSON directly avoids pulling in the whole picker UI.
// Note: We'll lazy-load the JSON on mount for performance (see useMount below).

// --------------------------------
// Constants
// --------------------------------
const RECENT_EMOJIS_KEY = 'emoji:recent';
const SKIN_TONE_KEY = 'emoji:skinTone';

// BottomSectionsBar handles icon map locally to minimize dependencies here
import type { SkinToneKey } from './types';
import type { EmojiData } from './lib';
import { fromUnified, withSkinToneUnified } from './lib';

export function EmojiTab({
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
  const setEmoji = useMutation(api.icons.setPageIconEmoji);
  const state$ = useObservable({
    data: null as null | Record<CategoryKey, EmojiData[]>,
    recentList: [] as string[], // unified w/ tone if applied
    skinTone: ((): SkinToneKey => {
      if (typeof window === 'undefined') return 'neutral';
      const v = window.localStorage.getItem(SKIN_TONE_KEY) as SkinToneKey | null;
      return v && SKIN_TONES.some((t) => t.key === v) ? v : 'neutral';
    })(),
    debouncedQuery: '',
    visibleCount: INITIAL_VISIBLE,
    hasMore: () => state$.visibleCount.get() < state$.filteredAllCount.get(),
    currentSection: null as null | ('recent' | CategoryKey),
    hasRecent: () => state$.filteredRecent.get().length > 0,
    // Derived sets
    filteredAllGroups: () => {
      const q = normalizeForSearch(state$.debouncedQuery.get());
      const tone = state$.skinTone.get();
      const data = state$.data.get();
      if (!data) return [] as { key: CategoryKey; label: string; items: string[] }[];
      const groups = CATEGORY_ORDER.map(({ key, label }) => {
        const list = (data[key] as EmojiData[]) || [];
        const items = q ? list.filter((e) => e.n?.some((nm) => normalizeForSearch(nm).includes(q))) : list;
        const displayUnifs = items.map((e) => withSkinToneUnified(e, tone));
        return { key, label, items: displayUnifs };
      });
      return groups.filter((g) => g.items.length > 0);
    },
    filteredAllCount: () => state$.filteredAllGroups.get().reduce((acc, g) => acc + g.items.length, 0),
    groupsLimited: () => {
      const groups = state$.filteredAllGroups.get();
      let remaining = state$.visibleCount.get();
      const out: { label: string; items: string[] }[] = [];
      for (const g of groups) {
        if (remaining <= 0) break;
        const slice = g.items.slice(0, remaining);
        out.push({ label: g.label, items: slice });
        remaining -= slice.length;
      }
      return out;
    },
    filteredRecent: () => {
      const q = normalizeForSearch(state$.debouncedQuery.get());
      const src = state$.recentList.get().slice(0, RECENT_LIMIT);
      if (!q) return src;
      // To filter recent, map unified back to names via dataset lookup
      const data = state$.data.get();
      if (!data) return src.filter(() => false);
      const nameMatch = (unified: string) => {
        // Strip tone for lookup
        const base = unified.split('-')[0];
        const found = CATEGORY_ORDER.find(({ key }) => (data[key] as EmojiData[]).some((e) => e.u === base));
        if (!found) return false;
        const e = (data[found.key] as EmojiData[]).find((x) => x.u === base);
        return e?.n?.some((nm) => normalizeForSearch(nm).includes(q));
      };
      return src.filter(nameMatch);
    },
  });

  // mount
  useMount(() => {
    // Load emoji data on first mount
    void import('emoji-picker-react/src/data/emojis.json').then((mod) => {
      const json = (mod as unknown as { default: Record<CategoryKey, EmojiData[]> }).default;
      state$.data.set(json);
    });
    const recents = loadRecentsFromStorage(RECENT_EMOJIS_KEY, RECENT_LIMIT);
    if (recents.length) state$.recentList.set(recents);
  });

  // listeners
  const onDebounced = React.useCallback(
    (value: string) => {
      state$.debouncedQuery.set(value);
      state$.visibleCount.set(INITIAL_VISIBLE);
    },
    [state$],
  );
  useEffect(() => subscribeDebouncedSearch(search$, SEARCH_DEBOUNCE_MS, onDebounced), [search$, onDebounced]);

  const handleToneChange = (tone: SkinToneKey) => {
    state$.skinTone.set(tone);
    if (typeof window !== 'undefined') window.localStorage.setItem(SKIN_TONE_KEY, tone);
  };

  // Stable selection handler to avoid re-renders in memoized children
  const handleSelect = React.useCallback(
    async (unified: string) => {
      // Update recents (dedupe + persist) via shared helper
      state$.recentList.set((prev) => upsertRecent(RECENT_EMOJIS_KEY, prev, unified, RECENT_LIMIT));
      const emojiStr = fromUnified(unified);
      if (blockId) {
        void setEmoji({ blockId, emoji: emojiStr }).catch(() => toast.error('Failed to set emoji'));
        callback?.({ emoji: emojiStr, kind: 'emoji' });
      }
      close();
      search$.set('');
    },
    [blockId, setEmoji, callback, close, search$, state$],
  );

  const pickRandomUnified = () => {
    const groups = state$.filteredAllGroups.get();
    const flat = groups.flatMap((g) => g.items);
    if (flat.length === 0) return null;
    return flat[(Math.random() * flat.length) | 0];
  };

  const handleRandom = () => {
    const u = pickRandomUnified();
    if (u) void handleSelect(u);
  };

  const groupsLimited = use$(state$.groupsLimited);
  const groupsAll = use$(state$.filteredAllGroups);
  const filteredRecent = use$(state$.filteredRecent);
  const skinTone = use$(state$.skinTone);
  const currentSection = use$(state$.currentSection);

  // Refs for scrolling
  const listRef = useRef<HTMLDivElement | null>(null);
  const recentRef = useRef<HTMLDivElement | null>(null);
  const groupRefs = useRef<Record<CategoryKey, HTMLDivElement | null>>({
    smileys_people: null,
    animals_nature: null,
    food_drink: null,
    travel_places: null,
    activities: null,
    objects: null,
    symbols: null,
    flags: null,
  });
  const pendingScrollRef = useRef<null | ('recent' | CategoryKey)>(null);
  const scrollRafIdRef = useRef<number | null>(null);

  const scrollContainerTo = React.useCallback((el: HTMLElement) => {
    const c = listRef.current;
    if (!c) return;
    const targetTop = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - 4;
    c.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, []);

  const tryScrollIfPending = React.useCallback(() => {
    const target = pendingScrollRef.current;
    if (!target) return;
    if (target === 'recent') {
      if (recentRef.current) {
        scrollContainerTo(recentRef.current);
        pendingScrollRef.current = null;
      }
      return;
    }
    const el = groupRefs.current[target];
    if (el) {
      scrollContainerTo(el);
      pendingScrollRef.current = null;
    }
  }, [scrollContainerTo]);

  // Cleanup any pending rAF when unmounting
  useEffect(() => {
    return () => {
      const id = scrollRafIdRef.current;
      if (id !== null) cancelAnimationFrame(id);
    };
  }, []);

  const handleScrollToSection = (section: 'recent' | CategoryKey) => {
    // Ensure the target section exists in the DOM, expanding visible items if needed
    if (section !== 'recent') {
      const all = state$.filteredAllGroups.get();
      const idx = all.findIndex((g) => g.key === section);
      if (idx >= 0) {
        const itemsBefore = all.slice(0, idx).reduce((acc, g) => acc + g.items.length, 0);
        const current = state$.visibleCount.get();
        if (current <= itemsBefore) {
          state$.visibleCount.set(itemsBefore + PAGE_SIZE);
        }
      }
    }
    pendingScrollRef.current = section;
    // Try immediately, otherwise effect will retry after DOM updates
    requestAnimationFrame(() => tryScrollIfPending());
  };

  // Scroll spy: determine which section is in view and update highlight
  const updateActiveByScroll = React.useCallback(() => {
    const c = listRef.current;
    if (!c) return;
    const containerTop = c.getBoundingClientRect().top;
    const sections: Array<{ key: 'recent' | CategoryKey; el: HTMLElement }> = [];
    if (filteredRecent.length > 0 && recentRef.current) {
      sections.push({ key: 'recent', el: recentRef.current });
    }
    // Only consider groups currently rendered (limited)
    for (const g of groupsLimited) {
      const key = LABEL_TO_KEY[g.label];
      const el = groupRefs.current[key];
      if (el) sections.push({ key, el });
    }
    if (sections.length === 0) {
      state$.currentSection.set(null);
      return;
    }
    const offsets = sections.map(({ key, el }) => ({
      key,
      offset: el.getBoundingClientRect().top - containerTop,
    }));
    const ABOVE_EPS = 8; // px tolerance for being considered at top
    const above = offsets.filter((o) => o.offset <= ABOVE_EPS);
    let active: 'recent' | CategoryKey | null = null;
    if (above.length > 0) {
      // choose the closest to the top (max offset among <= 0)
      active = above.sort((a, b) => b.offset - a.offset)[0]!.key;
    } else {
      // choose the next section below the top (min positive offset)
      active = offsets.sort((a, b) => a.offset - b.offset)[0]!.key;
    }
    state$.currentSection.set(active);
  }, [filteredRecent, groupsLimited, state$.currentSection]);

  useEffect(() => {
    tryScrollIfPending();
    updateActiveByScroll();
  }, [groupsLimited, filteredRecent, tryScrollIfPending, updateActiveByScroll]);

  // rAF-throttled scroll handler to reduce layout thrash and improve smoothness
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollRafIdRef.current !== null) return;
    const t = e.currentTarget;
    scrollRafIdRef.current = requestAnimationFrame(() => {
      scrollRafIdRef.current = null;
      const distanceFromBottom = t.scrollHeight - (t.scrollTop + t.clientHeight);
      if (distanceFromBottom <= SCROLL_THRESHOLD_PX && state$.hasMore.get()) {
        state$.visibleCount.set((prev) => prev + PAGE_SIZE);
      }
      updateActiveByScroll();
    });
  };

  return (
    <div className="">
      <Command shouldFilter={false}>
        <Header search$={search$} onRandom={handleRandom} skinTone={skinTone} onToneChange={handleToneChange} />
        <div className="relative pt-1">
          <CommandList ref={listRef as unknown as React.Ref<HTMLDivElement>} onScroll={onScroll}>
            <Show if={() => state$.filteredAllCount.get() === 0}>
              <div className="py-6 text-center text-sm text-muted-foreground">No results</div>
            </Show>
            <Show if={() => state$.filteredRecent.get().length > 0}>
              <div ref={recentRef}>
                <CommandGroup heading="Recent" className="text-inherit">
                  <EmojiGrid items={filteredRecent} onSelect={handleSelect} />
                </CommandGroup>
              </div>
            </Show>
            {groupsLimited.map((g) => {
              const key = LABEL_TO_KEY[g.label];
              return (
                <div
                  key={g.label}
                  ref={(el) => {
                    groupRefs.current[key] = el;
                  }}
                >
                  <CommandGroup heading={g.label} className="text-inherit">
                    <EmojiGrid items={g.items} onSelect={handleSelect} />
                  </CommandGroup>
                </div>
              );
            })}
          </CommandList>
          <Fades />
        </div>
      </Command>
      {/* Bottom sections bar extracted for reuse and clarity */}
      <SectionNav
        hasRecent$={state$.hasRecent}
        currentSection={currentSection}
        groups={groupsAll.map((g) => ({ key: g.key, label: g.label }))}
        onScrollToSection={handleScrollToSection}
      />
    </div>
  );
}

export default EmojiTab;
