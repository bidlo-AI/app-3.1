import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { IconMeta } from './types';

// Normalize helper for kebab-case to PascalCase
export const kebabToPascal = (kebab: string) =>
  kebab
    .split(/[-_\s]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');

// Normalize a string for search indexing
export const normalizeForSearch = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

// Normalize a key to kebab-case-like lookups (spaces/underscores to dashes)
export const normalizeKey = (key: string) =>
  key
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

// Build the complete list of Lucide icon metadata
export const ALL_LUCIDE_KEBAB = Object.keys(dynamicIconImports).sort((a, b) => a.localeCompare(b));

export const ALL_ICONS: IconMeta[] = ALL_LUCIDE_KEBAB.map((kebab) => {
  const pascal = kebabToPascal(kebab);
  return {
    kebab,
    pascal,
    kSearch: normalizeForSearch(kebab),
    pSearch: normalizeForSearch(pascal),
  };
});

export const ICON_LOOKUP = new Map<string, IconMeta>(ALL_ICONS.map((m) => [m.kebab, m] as const));
