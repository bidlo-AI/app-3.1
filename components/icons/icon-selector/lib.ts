import type { Observable } from '@legendapp/state';

// Shared pagination/search constants used by Icon and Emoji tabs.
export const RECENT_LIMIT = 11; // cap list length and recent UI row
export const PAGE_SIZE = 66; // 11 columns * 6 rows
export const INITIAL_VISIBLE = PAGE_SIZE * 2; // ensure initial overflow to enable scrolling
export const SEARCH_DEBOUNCE_MS = 120; // debounce search input
export const SCROLL_THRESHOLD_PX = 16; // distance from bottom to trigger load-more

// Normalizes strings for search (lowercase, alphanumeric only)
export const normalizeForSearch = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

// Subscribe to an observable search string and invoke a callback after a debounce.
// Returns a cleanup function to cancel the timer and unsubscribe.
export function subscribeDebouncedSearch(
  search$: Observable<string>,
  delayMs: number,
  onDebounced: (value: string) => void,
) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe = search$.onChange(({ value }) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => onDebounced(value), delayMs);
  });
  return () => {
    if (t) clearTimeout(t);
    unsubscribe();
  };
}

// Add an item to a recents list (deduped, capped) and persist to localStorage.
export function upsertRecent(
  storageKey: string,
  prevList: string[],
  item: string,
  limit: number,
  normalize?: (s: string) => string,
) {
  const normalizeOrSelf = (v: string) => (normalize ? normalize(v) : v);
  const normalizedItem = normalizeOrSelf(item);
  const withoutDupes = prevList.filter((v) => normalizeOrSelf(v) !== normalizedItem);
  const next = [normalizedItem, ...withoutDupes].slice(0, limit);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }
  return next;
}

// Load a recents list from localStorage, optionally normalizing and validating entries.
export function loadRecentsFromStorage(
  storageKey: string,
  limit: number,
  normalize?: (s: string) => string,
  validate?: (s: string) => boolean,
) {
  if (typeof window === 'undefined') return [] as string[];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [] as string[];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [] as string[];
    const normalized = parsed
      .map((v: unknown) => (typeof v === 'string' ? (normalize ? normalize(v) : v) : ''))
      .filter(Boolean) as string[];
    const filtered = validate ? normalized.filter(validate) : normalized;
    return filtered.slice(0, limit);
  } catch {
    return [] as string[];
  }
}
