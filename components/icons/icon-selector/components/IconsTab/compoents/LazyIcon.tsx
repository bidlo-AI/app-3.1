'use client';

import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import type { LucideIcon } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

// Lazily load a Lucide icon only when it scrolls into view
export function LazyIcon({ kebab }: { kebab: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const IconComp = useMemo(() => {
    if (!isVisible) return null;
    const loader = (dynamicIconImports as Record<string, () => Promise<{ default: LucideIcon }>>)[kebab];
    return loader ? lazy(loader) : null;
  }, [kebab, isVisible]);

  return (
    <span ref={ref} className="size-5">
      {IconComp ? (
        <Suspense fallback={null}>
          <IconComp className="size-5" />
        </Suspense>
      ) : null}
    </span>
  );
}

export default LazyIcon;
