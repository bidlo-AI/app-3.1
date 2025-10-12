import type { CategoryKey, SkinToneKey } from './types';

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

// Minimal emoji record from emoji-picker-react dataset
export type EmojiData = { n: string[]; u: string; v?: string[] };

// Convert a unified code (e.g. "1F600" or "1F44B-1F3FB") to a native character
export const fromUnified = (unified: string) =>
  unified
    .split('-')
    .map((h) => String.fromCodePoint(parseInt(h, 16)))
    .join('');

// For a given base emoji and selected skin tone, return the appropriate unified
export const withSkinToneUnified = (emoji: EmojiData, skinTone: SkinToneKey) => {
  if (skinTone === 'neutral') return emoji.u;
  const vars = emoji.v || [];
  const found = vars.find((v) => v.includes(skinTone));
  return found || emoji.u;
};

// Available skin tone options for the selector UI
export const SKIN_TONES: Array<{ key: SkinToneKey; label: string }> = [
  { key: 'neutral', label: 'Neutral' },
  { key: '1f3fb', label: 'Light' },
  { key: '1f3fc', label: 'Medium Light' },
  { key: '1f3fd', label: 'Medium' },
  { key: '1f3fe', label: 'Medium Dark' },
  { key: '1f3ff', label: 'Dark' },
];
