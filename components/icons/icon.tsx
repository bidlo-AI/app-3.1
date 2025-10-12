import { memo } from 'react';
import Image from 'next/image';
import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';

type BlockIcon = Doc<'blocks'>['icon'];

// Cache Lucide component lookups to avoid repeated reflection per render
const lucideCache = new Map<string, LucideIcon>();

// Narrowed local shape for stronger typing in memo comparisons
type EmojiIcon = { kind: 'emoji'; emoji: string; shortcode?: string; version?: string };
type PresetIcon = { kind: 'preset'; key: string; style?: 'line' | 'solid'; color?: string };
type ImageCrop = { x: number; y: number; size: number };
type ImageIcon = {
  kind: 'image';
  url?: string;
  file_id?: Id<'files'>;
  crop?: ImageCrop;
  variant?: 'original' | '512' | '128';
};
type BlockIconShape = EmojiIcon | PresetIcon | ImageIcon;

/**
 * Render a block's icon in one of three modes:
 * - emoji: rendered via Twemoji image for consistent cross-OS appearance
 * - preset: Lucide icon by key (e.g., "wrench")
 * - image: uploaded file (requires resolveFileUrl)
 *
 * Keep this component dumb: it doesn't fetch. Provide a resolver to map file ids to URLs.
 */
function IconComponent({
  icon,
  title,
  className,
  alt,
  size,
  resolveFileUrl,
}: {
  icon?: BlockIcon | null;
  title?: string;
  className?: string;
  alt?: string;
  size: number;
  resolveFileUrl?: (fileId: Id<'files'>) => string | undefined;
}) {
  // Fallback monogram when no icon is set
  if (!icon) return <Monogram title={title} className={className} size={size} />;

  if (icon.kind === 'emoji')
    return (
      <span
        role="img"
        aria-label={alt ?? icon.shortcode ?? 'emoji'}
        className={cn('grid place-items-center select-none [container-type:size]', className)}
        style={{ width: size, height: size }}
        draggable={false}
      >
        <span className="leading-none text-[100cqmin]">{icon.emoji}</span>
      </span>
    );

  if (icon.kind === 'preset') {
    const Comp = resolveLucide(icon.key) ?? Lucide.CircleDashed;
    // Map style to stroke/fill intent (minimal)
    const strokeWidth = icon.style === 'solid' ? 0 : 2;
    const fill = icon.style === 'solid' ? 'currentColor' : 'none';
    // Optional hue for Lucide icons; falls back to foreground
    const hue = (icon as { color?: string })?.color;
    const hueClass = hue && hue !== 'default' ? `text-${hue}` : 'text-foreground';
    return (
      <Comp
        aria-label={alt ?? icon.key}
        className={cn('p-[5%]', hueClass, className)}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        fill={fill}
      />
    );
  }

  if (icon.kind === 'image') {
    // Prefer a directly stored URL if available; fallback to resolver if provided
    const directUrl = (icon as { url?: string })?.url;
    const fileId = (icon as { file_id?: Id<'files'> }).file_id;
    const resolvedUrl = fileId && resolveFileUrl ? resolveFileUrl(fileId) : undefined;
    const url = directUrl ?? resolvedUrl;
    if (!url) return <Monogram title={title} className={className} size={size} />;

    // If crop provided as relative {x,y,size} (0..1), map to object-position percent
    const objectPosition = icon.crop
      ? `${Math.round(icon.crop.x * 100)}% ${Math.round(icon.crop.y * 100)}%`
      : undefined;
    return (
      <Image
        src={url}
        alt={alt ?? (title ? `${title} icon` : 'icon')}
        width={size}
        height={size}
        className={cn('rounded object-cover', className)}
        style={objectPosition ? { objectPosition } : undefined}
        draggable={false}
        loading="lazy"
      />
    );
  }

  return null;
}

function Monogram({ title, className, size }: { title?: string; className?: string; size: number }) {
  const letter = (title?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <div
      aria-label={title ? `${title} icon` : 'icon'}
      className={cn(
        'rounded bg-hover text-secondary-foreground grid place-items-center text-3 font-semibold',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {letter}
    </div>
  );
}

function resolveLucide(key: string): LucideIcon | undefined {
  // Convert kebab/underscore to PascalCase to match Lucide export names
  const name = key
    .split(/[-_\s]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  const cached = lucideCache.get(name);
  if (cached) return cached;
  const comp = (Lucide as unknown as Record<string, LucideIcon>)[name];
  if (comp) lucideCache.set(name, comp);
  return comp;
}

// Removed LazyImage fallback to avoid requiring Convex provider in low-level component

// Shallow, mode-aware comparison to avoid re-renders when nothing relevant changed
function iconsEqual(a?: BlockIcon | null, b?: BlockIcon | null): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  const ai = a as BlockIconShape;
  const bi = b as BlockIconShape;
  if (ai.kind !== bi.kind) return false;
  switch (ai.kind) {
    case 'emoji':
      return ai.emoji === (bi as EmojiIcon).emoji;
    case 'preset':
      return (
        ai.key === (bi as PresetIcon).key &&
        ai.style === (bi as PresetIcon).style &&
        ai.color === (bi as PresetIcon).color
      );
    case 'image': {
      const ac = ai.crop ?? ({} as ImageCrop);
      const bc = (bi as ImageIcon).crop ?? ({} as ImageCrop);
      const aid = ai.url ?? ai.file_id;
      const bid = (bi as ImageIcon).url ?? (bi as ImageIcon).file_id;
      return aid === bid && ac.x === bc.x && ac.y === bc.y && ac.size === bc.size;
    }
  }
}

function areIconPropsEqual(
  prev: {
    icon?: BlockIcon | null;
    title?: string;
    className?: string;
    alt?: string;
    size: number;
    resolveFileUrl?: (fileId: Id<'files'>) => string | undefined;
  },
  next: {
    icon?: BlockIcon | null;
    title?: string;
    className?: string;
    alt?: string;
    size: number;
    resolveFileUrl?: (fileId: Id<'files'>) => string | undefined;
  },
): boolean {
  return (
    prev.size === next.size &&
    prev.className === next.className &&
    prev.title === next.title &&
    prev.alt === next.alt &&
    prev.resolveFileUrl === next.resolveFileUrl &&
    iconsEqual(prev.icon, next.icon)
  );
}

export const Icon = memo(IconComponent, areIconPropsEqual);
export default Icon;
