// Shared types/constants for EmojiTab feature
import type { CategoryKey } from './types';

// Order of categories and human-friendly labels used across EmojiTab UI
export const CATEGORY_ORDER: { key: CategoryKey; label: string }[] = [
  { key: 'smileys_people', label: 'People' },
  { key: 'animals_nature', label: 'Animals & Nature' },
  { key: 'food_drink', label: 'Food & Drink' },
  { key: 'travel_places', label: 'Travel & Places' },
  { key: 'activities', label: 'Activities' },
  { key: 'objects', label: 'Objects' },
  { key: 'symbols', label: 'Symbols' },
  { key: 'flags', label: 'Flags' },
];

// Helper map for converting group labels back into stable keys
export const LABEL_TO_KEY: Record<string, CategoryKey> = CATEGORY_ORDER.reduce(
  (acc, { key, label }) => {
    acc[label] = key;
    return acc;
  },
  {} as Record<string, CategoryKey>,
);
