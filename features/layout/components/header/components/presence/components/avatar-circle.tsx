'use client';

// AvatarCircle: reusable circular avatar with optional image and online state.
// - Uses shadcn/ui design tokens (no raw Tailwind colors).
// - Minimal API: pass `online`, optional `image`, and a `fallback` node.
// - Border styling reflects online vs offline when `showBorder` is true.

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export type AvatarCircleProps = {
  online: boolean;
  image?: string;
  alt?: string;
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function AvatarCircle({ online, image, alt = 'user', fallback, className, style }: AvatarCircleProps) {
  return (
    <div
      className={cn(
        'outline outline-border font-medium rounded-full overflow-hidden flex items-center justify-center bg-background',
        online ? '' : 'opacity-40',
        'cursor-default',
        className,
      )}
      style={style}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <Image
          width={22}
          height={22}
          loading="lazy"
          priority={false}
          quality={100}
          src={image}
          alt={alt}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <span aria-label={alt} role="img" className={cn(!online && 'opacity-40')}>
          {fallback}
        </span>
      )}
    </div>
  );
}

export default AvatarCircle;
