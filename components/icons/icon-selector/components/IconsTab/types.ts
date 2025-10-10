import type { Doc } from '@/convex/_generated/dataModel';

export type BlockIcon = Doc<'blocks'>['icon'];

export type IconMeta = {
  kebab: string;
  pascal: string;
  kSearch: string;
  pSearch: string;
};
