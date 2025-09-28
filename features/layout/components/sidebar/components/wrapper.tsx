'use client';

import { ResizablePanel } from '../../resizable-panel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSidebar } from '@/features/layout/components/sidebar/providers/SidebarProvider';
import { use$ } from '@legendapp/state/react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Show } from '@legendapp/state/react';

const THRESHOLD_PADDING = 8;

export const SidebarWrapper = ({ startingWidth, children }: { startingWidth?: number; children: React.ReactNode }) => {
  const setWidth = useMutation(api.users.setLayoutWidth);
  const sidebar$ = useSidebar();

  const isHidden = use$(sidebar$.sidebar_hidden);
  const overlayOpen = use$(sidebar$.overlay_open);

  // Cache computed right-edge to avoid recalculating in the pointer handler
  const lastXRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  //handlers
  const handleWdithChange = (w: number) => {
    sidebar$.setPanelWidth(w);
    setWidth({ target: 'sidebar_width', width: Math.round(w) });
  };

  // Unified component: switches between pinned and overlay via classes.
  // When unpinned, the wrapper becomes fixed with a hover zone; the panel is translated off-screen until hovered.
  // On unpin while hovered, the group-hover keeps it visible so it doesn't disappear.
  // While overlay is open in unpinned mode, keep it open as long as the cursor's X
  // position is to the left of the panel's right edge (allowing vertical movement
  // above/below to interact with header content without collapsing the overlay).
  useEffect(() => {
    if (!isHidden || !overlayOpen) return;
    const check = () => {
      rafIdRef.current = null;
      const x = lastXRef.current;
      if (x !== null && x > sidebar$.panel_width.get() + THRESHOLD_PADDING) {
        // Avoid redundant writes; this will noop if already closed.
        sidebar$.closeOverlay();
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      lastXRef.current = e.clientX;
      if (rafIdRef.current === null) {
        rafIdRef.current = window.requestAnimationFrame(check);
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isHidden, overlayOpen, sidebar$]);

  return (
    <div className="hidden md:flex">
      <div className={isHidden ? 'fixed inset-y-0 left-0 z-10 group/sidebar' : 'relative h-screen group/sidebar'}>
        <Show if={sidebar$.sidebar_hidden}>
          <div className="absolute inset-y-0 left-0 w-3 " aria-hidden onMouseEnter={() => sidebar$.openOverlay()} />
        </Show>

        <div
          className={cn(
            'flex transition-all duration-200 ease-in-out',
            isHidden
              ? `absolute inset-y-0 left-0 pr-2 pt-10 pb-2 ${overlayOpen ? 'translate-x-0' : '-translate-x-full'} group-hover/sidebar:translate-x-0`
              : 'py-0',
          )}
          style={{ willChange: 'transform', contain: 'paint' }}
        >
          <div className="flex" onMouseEnter={isHidden ? () => sidebar$.openOverlay() : undefined}>
            <ResizablePanel
              side="right"
              minWidth={150}
              maxWidth={460}
              defaultWidth={200}
              startingWidth={startingWidth}
              className={cn(
                'bg-muted relative group/sidebar',
                isHidden ? 'shadow-peek rounded-r-2xl border-y h-full' : 'h-screen ',
              )}
              storageKey={'sidebarWidthPx'}
              onWidthChange={(w) => sidebar$.setPanelWidth(w)}
              onWidthChangeEnd={handleWdithChange}
              onWidthReset={handleWdithChange}
            >
              {children}
            </ResizablePanel>
          </div>
        </div>
      </div>
    </div>
  );
};
