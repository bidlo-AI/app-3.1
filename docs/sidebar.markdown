### Sidebar

The Sidebar is a responsive navigation panel with two desktop modes (pinned and overlay) and a mobile sheet. Its visibility and size are persisted, and interactive state is exposed via a small hook.

### State & Persistence

- The pinned/hidden state is persisted per user via Convex (see `api.users.toggleSidebar`).
- While hidden, an ephemeral `overlay_open` state controls a hover-to-peek overlay.
- Width is:
  - applied immediately via local state for smooth dragging,
  - stored in `localStorage` under `sidebarWidthPx` for initial paint,
  - persisted to Convex on drag end/reset via `api.users.setLayoutWidth` with `target: 'sidebar_width'`.

- Section order:
  - Top-level section order (currently `['teams','private']`) is persisted per user on the `users.sidebar_sections_order` field.
  - Order is applied on load (via `preloadedUser: api.users.getUser`) and defaults to `['teams','private']` if not set.
  - On drag end, order is saved via `api.users.setSidebarSectionsOrder({ order })`.

### Provider and Hook

- Wrap your layout with `SidebarProvider`, passing the initial `sidebar_hidden` boolean from the server.
- Use `useSidebar()` to access an observable Sidebar state; subscribe with `use$` from `@legendapp/state/react`.

Example (simplified):

```tsx
import { SidebarProvider, useSidebar } from '@/features/layout/components/sidebar/providers/SidebarProvider';
import { use$ } from '@legendapp/state/react';

export const Layout = ({ children, initialHidden }: { children: React.ReactNode; initialHidden: boolean }) => (
  <SidebarProvider sidebar_hidden={initialHidden}>{children}</SidebarProvider>
);

export const PinToggle = () => {
  const sidebar$ = useSidebar();
  const isHidden = use$(sidebar$.sidebar_hidden);
  return <button onClick={() => sidebar$.toggleSidebar()}>{isHidden ? 'Pin' : 'Unpin'}</button>;
};
```

Public shape (for reference):

```ts
type SidebarState = {
  sidebar_hidden: boolean;
  overlay_open: boolean; // desktop-only peek when hidden
  panel_width: number; // current px width (client)
  toggleSidebar(): void;
  setSidebar(hidden: boolean): void;
  openOverlay(): void;
  closeOverlay(): void;
  setPanelWidth(w: number): void;
};
```

### Desktop Behavior

- **Pinned (visible)**: Sidebar is part of the layout (`relative`), resizable, full-height.
- **Hidden (unpinned)**: A narrow hover zone on the left edge opens an overlay panel. Moving the cursor past the panel’s right edge plus 8px closes it automatically.

Use the `SidebarWrapper` to render the panel with resize and overlay behavior:

```tsx
import { SidebarWrapper } from '@/features/layout/components/sidebar/components/wrapper';
import { SidebarContent } from '@/features/layout/components/sidebar/components/content';

export const AppChrome = () => (
  <SidebarWrapper>
    <SidebarContent />
  </SidebarWrapper>
);
```

### Resizing

- Drag the right edge handle to resize. Double‑click the handle to reset to the default width.
- Bounds: min 50px, max 400px (configurable on `ResizablePanel`).
- Persistence: `localStorage` (`sidebarWidthPx`) for immediate paint + Convex on drag end/reset.

Example callback wiring (already handled by `SidebarWrapper`):

```tsx
<ResizablePanel
  side="right"
  storageKey="sidebarWidthPx"
  onWidthChange={(w) => sidebar$.setPanelWidth(w)}
  onWidthChangeEnd={(w) => setWidth({ target: 'sidebar_width', width: Math.round(w) })}
  onWidthReset={(w) => setWidth({ target: 'sidebar_width', width: Math.round(w) })}
>
  {children}
</ResizablePanel>
```

### Mobile Behavior

- On small screens, the sidebar is presented in a `Sheet` (drawer) using shadcn/ui.
- Use `SidebarActions` to render the mobile hamburger trigger and (on desktop) a pin button when hidden.

```tsx
import { SidebarActions } from '@/features/layout/components/header/components/sidebar-actions';

export const Header = () => (
  <div className="flex items-center">
    <SidebarActions />
    {/* other header actions */}
  </div>
);
```

### Keyboard Shortcuts

- ⌘/Ctrl + H: Toggle pinned/hidden state.
- Ensure `HotkeysProvider` is mounted once at the app shell level.

```tsx
import { HotkeysProvider } from '@/features/layout/providers/hotkeys';

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <>
    <HotkeysProvider />
    {children}
  </>
);
```

### Notes

- Uses `@legendapp/state` for ergonomic observable state and granular subscriptions.
- Uses shadcn/ui primitives (`Sheet`, `Button`) for the UI, and `lucide-react` icons.
- Server mutations involved: `api.users.toggleSidebar`, `api.users.setLayoutWidth`.

### Drag & Drop

- What is draggable:
  - The two top-level sections in the Pages area: `Teams` and `Private`.
  - Goal is to support more drag-to-sort (teams/pages) later; current implementation focuses on section order.

- Library & setup:
  - Uses `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/modifiers`.
  - Activation uses a pointer sensor with `distance: 3` so a short click still toggles the section open/closed.
  - No explicit drag handle; dragging begins when the header is dragged more than 3px.

- Constraints:
  - Movement is locked to the vertical axis and restricted to the section list container.
  - This prevents horizontal drift and dragging beyond the sidebar area.

- Overlay & visuals:
  - The original section is hidden while dragging to avoid duplicate visuals.
  - A lightweight `DragOverlay` renders only a fixed-size header snapshot (no list body) to avoid expensive re-renders.
  - The overlay size is measured once at drag start and cached to prevent layout thrash.

- Performance considerations:
  - Lists inside sections are memoized (`TeamSectionList`, `PrivateSectionList`) to skip re-renders during drag.
  - Section order is persisted only on drag end via `api.users.setSidebarSectionsOrder`.
  - Default order fallback: `['teams','private']` when no user preference exists.

- Data model & API:
  - Field: `users.sidebar_sections_order?: ('teams' | 'private')[]`.
  - Mutation: `api.users.setSidebarSectionsOrder({ order })`.
  - Loaded with `api.users.getUser` and passed to the sidebar `Pages` component as `preloadedUser`.
