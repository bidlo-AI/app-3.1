'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Command, CommandList, CommandGroup } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Show, use$, useObservable, useMount } from '@legendapp/state/react';
import type { Observable } from '@legendapp/state';
import { SearchInput } from '@/components/icons/icon-selector/components/search-input';
import { Fades } from '@/components/icons/icon-selector/components/IconsTab/compoents/fades';
import { cn } from '@/lib/utils';

// Large dataset of emojis organized by category (ships with emoji-picker-react)
// Minimal fields used: names (n), unified (u), variations (v)
// Importing JSON directly avoids pulling in the whole picker UI.
// Note: We'll lazy-load the JSON on mount for performance (see useMount below).

type BlockIcon = Doc<'blocks'>['icon'];

// --------------------------------
// Constants
// --------------------------------
const RECENT_EMOJIS_KEY = 'emoji:recent';
const SKIN_TONE_KEY = 'emoji:skinTone';
const RECENT_LIMIT = 11; // cap list length and recent UI row
const PAGE_SIZE = 66; // 11 columns * 6 rows
const INITIAL_VISIBLE = PAGE_SIZE * 2;
const LOAD_MORE_DEBOUNCE_MS = 120;
const SEARCH_DEBOUNCE_MS = 120;
const SCROLL_THRESHOLD_PX = 16;

// Emoji categories to display in order with friendly labels
type CategoryKey =
  | 'smileys_people'
  | 'animals_nature'
  | 'food_drink'
  | 'travel_places'
  | 'activities'
  | 'objects'
  | 'symbols'
  | 'flags';
const CATEGORY_ORDER: { key: CategoryKey; label: string }[] = [
  { key: 'smileys_people', label: 'Smileys & People' },
  { key: 'animals_nature', label: 'Animals & Nature' },
  { key: 'food_drink', label: 'Food & Drink' },
  { key: 'travel_places', label: 'Travel & Places' },
  { key: 'activities', label: 'Activities' },
  { key: 'objects', label: 'Objects' },
  { key: 'symbols', label: 'Symbols' },
  { key: 'flags', label: 'Flags' },
];

type EmojiData = { n: string[]; u: string; v?: string[] };
type SkinToneKey = 'neutral' | '1f3fb' | '1f3fc' | '1f3fd' | '1f3fe' | '1f3ff';

// Helpers
const normalize = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
const fromUnified = (unified: string) =>
  unified
    .split('-')
    .map((h) => String.fromCodePoint(parseInt(h, 16)))
    .join('');

const withSkinToneUnified = (emoji: EmojiData, skinTone: string | 'neutral') => {
  if (skinTone === 'neutral') return emoji.u;
  const vars = emoji.v || [];
  const found = vars.find((v) => v.includes(skinTone));
  return found || emoji.u;
};

// Native-emoji renderer: renders the Unicode glyph directly for fast, no-network display
function NativeEmoji({ unified, label }: { unified: string; label: string }) {
  const char = fromUnified(unified);
  return (
    <span
      aria-label={label}
      className="size-5 text-[26px] leading-none select-none flex items-center justify-center"
      draggable={false}
    >
      {char}
    </span>
  );
}

// Skin tone selector
const SKIN_TONES: Array<{ key: SkinToneKey; label: string }> = [
  { key: 'neutral', label: 'Neutral' },
  { key: '1f3fb', label: 'Light' },
  { key: '1f3fc', label: 'Medium Light' },
  { key: '1f3fd', label: 'Medium' },
  { key: '1f3fe', label: 'Medium Dark' },
  { key: '1f3ff', label: 'Dark' },
];

function SkinToneSelector({ value, onChange }: { value: SkinToneKey; onChange: (v: SkinToneKey) => void }) {
  // Right-hand glyph preview (👉) for the trigger reflects the current skin tone
  const [open, setOpen] = React.useState(false);
  const unified = value === 'neutral' ? '270B' : `270B-${value}`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Tooltip wraps only the trigger to avoid hover conflicts with popover content */}
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button aria-label="Choose skin tone" variant="outline" size="icon">
              <span className="text-xl leading-none select-none">{fromUnified(unified)}</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Select skin tone</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-auto">
        {/* Row of right-hand emojis in each skin tone */}
        <div className="flex items-center gap-1 p-1">
          {SKIN_TONES.map((t) => {
            const u = t.key === 'neutral' ? '270B' : `270B-${t.key}`;
            return (
              <button
                key={t.key}
                type="button"
                aria-label={t.label}
                className="hover:bg-hover flex size-7 items-center justify-center rounded cursor-pointer"
                onClick={() => {
                  onChange(t.key);
                  setOpen(false);
                }}
              >
                <span className="text-xl leading-none select-none">{fromUnified(u)}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EmojiTab({
  blockId,
  onSelected,
  close,
  search$,
}: {
  blockId?: Id<'blocks'>;
  onSelected?: (icon: BlockIcon) => void;
  close: () => void;
  search$: Observable<string>;
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
    // Derived sets
    filteredAllGroups: () => {
      const q = normalize(state$.debouncedQuery.get());
      const tone = state$.skinTone.get();
      const data = state$.data.get();
      if (!data) return [] as { key: CategoryKey; label: string; items: string[] }[];
      const groups = CATEGORY_ORDER.map(({ key, label }) => {
        const list = (data[key] as EmojiData[]) || [];
        const items = q ? list.filter((e) => e.n?.some((nm) => normalize(nm).includes(q))) : list;
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
      const q = normalize(state$.debouncedQuery.get());
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
        return e?.n?.some((nm) => normalize(nm).includes(q));
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
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(RECENT_EMOJIS_KEY) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) state$.recentList.set(parsed.slice(0, RECENT_LIMIT));
      } catch {}
    }
  });

  // listeners
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const unsub = search$.onChange(({ value }) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        state$.debouncedQuery.set(value);
        state$.visibleCount.set(INITIAL_VISIBLE);
      }, SEARCH_DEBOUNCE_MS);
    });
    return () => {
      if (t) clearTimeout(t);
      unsub();
    };
  }, [search$]);

  const handleRecordRecent = (unified: string) =>
    state$.recentList.set((prev) => {
      const withoutDupes = prev.filter((u) => u !== unified);
      const next = [unified, ...withoutDupes].slice(0, RECENT_LIMIT);
      if (typeof window !== 'undefined') window.localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(next));
      return next;
    });

  const handleToneChange = (tone: SkinToneKey) => {
    state$.skinTone.set(tone);
    if (typeof window !== 'undefined') window.localStorage.setItem(SKIN_TONE_KEY, tone);
  };

  const handleSelect = async (unified: string) => {
    try {
      handleRecordRecent(unified);
      const emojiStr = fromUnified(unified);
      if (blockId) {
        await setEmoji({ blockId, emoji: emojiStr });
        toast.success('Icon updated');
      } else {
        onSelected?.({ kind: 'emoji', emoji: emojiStr });
      }
      close();
      search$.set('');
    } catch {
      toast.error('Failed to set emoji');
    }
  };

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

  // Split visibleCount across groups in order to avoid rendering everything at once
  const groupsLimited = use$(state$.groupsLimited);

  const lastLoadMoreAtRef = useRef(0);
  const filteredRecent = use$(state$.filteredRecent);
  const skinTone = use$(state$.skinTone);
  // No tooltip wrapper here; SkinToneSelector handles its own tooltip on the trigger only

  return (
    <div className="">
      <Command shouldFilter={false}>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1.5 pb-1 pt-2">
          <SearchInput search$={search$} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label="Random emoji" variant="outline" size="icon" onClick={handleRandom}>
                <ArrowRightLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Random</TooltipContent>
          </Tooltip>
          <div>
            <SkinToneSelector value={skinTone} onChange={handleToneChange} />
          </div>
        </div>
        <div className={cn('relative pt-1 pb-2')}>
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
            <Show if={() => state$.filteredAllCount.get() === 0}>
              <div className="py-6 text-center text-sm text-muted-foreground">No results</div>
            </Show>
            <Show if={() => state$.filteredRecent.get().length > 0}>
              <CommandGroup heading="Recent" className="text-inherit">
                <EmojiGrid items={filteredRecent} onSelect={handleSelect} />
              </CommandGroup>
            </Show>
            {groupsLimited.map((g) => (
              <CommandGroup key={g.label} heading={g.label} className="text-inherit">
                <EmojiGrid items={g.items} onSelect={handleSelect} />
              </CommandGroup>
            ))}
          </CommandList>
          <Fades />
        </div>
      </Command>
    </div>
  );
}

function EmojiGrid({ items, onSelect }: { items: string[]; onSelect: (unified: string) => void }) {
  return (
    <div className="grid grid-cols-11 gap-0 px-2">
      {items.map((unified) => (
        <button
          key={unified}
          className="hover:bg-hover flex size-8 items-center justify-center rounded p-1 cursor-pointer"
          onClick={() => onSelect(unified)}
          title={fromUnified(unified)}
        >
          <NativeEmoji unified={unified} label="emoji" />
        </button>
      ))}
    </div>
  );
}

export default EmojiTab;
