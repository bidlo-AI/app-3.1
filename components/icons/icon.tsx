import * as React from 'react';
import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';

type BlockIcon = Doc<'blocks'>['icon'];

/**
 * Render a block's icon in one of three modes:
 * - emoji: rendered via Twemoji image for consistent cross-OS appearance
 * - preset: Lucide icon by key (e.g., "wrench")
 * - image: uploaded file (requires resolveFileUrl)
 *
 * Keep this component dumb: it doesn't fetch. Provide a resolver to map file ids to URLs.
 */
export function Icon({
  icon,
  title,
  className,
  alt,
  resolveFileUrl,
}: {
  icon?: BlockIcon | null;
  title?: string;
  className?: string;
  alt?: string;
  resolveFileUrl?: (fileId: Id<'files'>) => string | undefined;
}) {
  // Fallback monogram when no icon is set
  if (!icon) return <Monogram title={title} className={className} />;

  if (icon.kind === 'emoji')
    return (
      <span
        role="img"
        aria-label={alt ?? icon.shortcode ?? 'emoji'}
        className={cn('size-5 grid place-items-center select-none [container-type:size]', className)}
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
    const hue = (icon as unknown as { color?: string })?.color;
    const hueClass = hue && hue !== 'default' ? `text-${hue}` : 'text-foreground';
    return (
      <Comp
        aria-label={alt ?? icon.key}
        className={cn('size-5 p-[5%]', hueClass, className)}
        strokeWidth={strokeWidth}
        fill={fill}
      />
    );
  }

  if (icon.kind === 'image') {
    // Prefer a directly stored URL if available; fallback to resolver if provided
    const directUrl = (icon as unknown as { url?: string })?.url;
    const fileId = (icon as unknown as { file_id?: Id<'files'> }).file_id;
    const resolvedUrl = fileId && resolveFileUrl ? resolveFileUrl(fileId) : undefined;
    const url = directUrl ?? resolvedUrl;
    if (!url) return <Monogram title={title} className={className} />;

    // If crop provided as relative {x,y,size} (0..1), map to object-position percent
    const objectPosition = icon.crop
      ? `${Math.round(icon.crop.x * 100)}% ${Math.round(icon.crop.y * 100)}%`
      : undefined;
    return (
      <img
        src={url}
        alt={alt ?? (title ? `${title} icon` : 'icon')}
        className={cn('size-5 rounded object-cover', className)}
        style={objectPosition ? { objectPosition } : undefined}
        draggable={false}
      />
    );
  }

  return null;
}

function Monogram({ title, className }: { title?: string; className?: string }) {
  const letter = (title?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <div
      aria-label={title ? `${title} icon` : 'icon'}
      className={cn(
        'size-5 rounded bg-hover text-secondary-foreground grid place-items-center text-3 font-semibold',
        className,
      )}
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
  return (Lucide as unknown as Record<string, LucideIcon>)[name];
}

// Removed LazyImage fallback to avoid requiring Convex provider in low-level component

export default Icon;
