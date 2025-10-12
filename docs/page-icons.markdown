### Page Icons

This document explains how page icons work end‑to‑end: database schema, server APIs (mutations), and the client components used to render and select icons.

### Data model (Convex schema)

- Icons are stored on `blocks.icon` as a discriminated union. The table lives in `convex/schema.ts`.
- Files uploaded for icons are tracked in the `files` table with `purpose: 'page_icon'`.

Code reference:

```107:114:convex/schema.ts
    // Optional page icon. Discriminated union across emoji, preset, or uploaded image.
    icon: v.optional(iconValidator),

    // Hierarchy
    parent_id: v.optional(v.id('blocks')),
    position: v.number(),
```

```177:193:convex/schema.ts
  files: defineTable({
    block_id: v.id('blocks'),
    workos_org_id: v.string(),
    storage_id: v.id('_storage'),
    name: v.string(),
    mime: v.string(),
    size: v.number(),
    sha256: v.optional(v.string()),
    uploaded_by: v.string(),
    uploaded_at: v.number(),
    // Light purpose tagging allows fast lookups and constraints per block
    purpose: v.optional(v.union(v.literal('page_icon'), v.literal('page_cover'), v.literal('attachment'))),
  })
    .index('by_block', ['block_id'])
    .index('by_org', ['workos_org_id'])
    // Fetch per-block file by purpose quickly (e.g., active page icon)
    .index('by_block_purpose', ['block_id', 'purpose']),
```

- The `iconValidator` (see `convex/validators.ts`) defines the shape:
  - `emoji`: `{ kind: 'emoji', emoji: string, shortcode?, version? }`
  - `preset`: `{ kind: 'preset', key: string, style?: 'line' | 'solid', color?: Hue }`
  - `image`: `{ kind: 'image', url?: string, file_id?: Id<'files'>, crop?: { x,y,size } }`

How blocks/pages use icons:

- Pages are `blocks` with `type: 'page'`. When an icon is set, the renderer reads `block.icon` and displays accordingly.
- For uploaded images, the block’s `icon.url` is stored for direct rendering. The backing file metadata is stored in `files` and associated via `file_id`.

### Server API (mutations)

All mutations live in `convex/icons.ts`. They guard access via `assertWrite` which ensures org/team ownership rules.

- Set emoji icon

```32:49:convex/icons.ts
export const setPageIconEmoji = mutation({
  args: { blockId: blockIdValidator, emoji: v.string(), shortcode: v.optional(v.string()), version: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertWrite(ctx, args.blockId);
    await ctx.db.patch(args.blockId, { icon: { kind: 'emoji', emoji: args.emoji, ...(args.shortcode && { shortcode: args.shortcode }), ...(args.version && { version: args.version }) } });
  },
});
```

- Set Lucide preset icon

```52:70:convex/icons.ts
export const setPageIconPreset = mutation({
  args: { blockId: blockIdValidator, key: v.string(), style: v.optional(iconStyleValidator), color: v.optional(hueValidator) },
  handler: async (ctx, args) => {
    await assertWrite(ctx, args.blockId);
    await ctx.db.patch(args.blockId, { icon: { kind: 'preset', key: args.key, ...(args.style && { style: args.style }), ...(args.color && { color: args.color }) } });
  },
});
```

- Prepare upload (get short‑lived URL)

```72:90:convex/icons.ts
export const prepareUploadPageIcon = mutation({
  args: { blockId: blockIdValidator, mime: v.string(), size: v.number() },
  handler: async (ctx, { blockId, mime, size }) => {
    await assertWrite(ctx, blockId);
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
    if (!allowed.includes(mime)) throw new Error('Unsupported MIME type');
    if (size > 512 * 1024) throw new Error('File too large');
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl } as const;
  },
});
```

- Finalize upload (persist file + set icon)

```93:145:convex/icons.ts
export const finalizeUploadPageIcon = mutation({
  args: { blockId: blockIdValidator, storageId: v.id('_storage'), filename: v.string(), mime: v.string(), size: v.number(), crop: v.optional(imageCropValidator) },
  handler: async (ctx, { blockId, storageId, filename, mime, size, crop }) => {
    await assertWrite(ctx, blockId);
    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
    if (!allowed.includes(mime)) throw new Error('Unsupported MIME type');
    if (size > 512 * 1024) throw new Error('File too large');

    const fileId = await ctx.db.insert('files', { block_id: blockId, workos_org_id, storage_id: storageId, name: filename, mime, size, uploaded_by: workos_user_id, uploaded_at: Date.now(), purpose: 'page_icon' });

    // Ensure only the newest page_icon remains marked
    const others = await ctx.db.query('files').withIndex('by_block_purpose', (q) => q.eq('block_id', blockId).eq('purpose', 'page_icon')).collect();
    for (const f of others) {
      if (f._id !== fileId) await ctx.db.patch(f._id, { purpose: undefined } as Partial<Doc<'files'>>);
    }

    const url = await ctx.storage.getUrl(storageId);
    await ctx.db.patch(blockId, { icon: { kind: 'image', url: url ?? undefined, file_id: fileId, ...(crop && { crop }) } });
    return { success: true, url: url ?? undefined, fileId } as const;
  },
});
```

- Set icon by public URL (no upload)

```164:178:convex/icons.ts
export const setPageIconImageUrl = mutation({
  args: { blockId: blockIdValidator, url: v.string(), crop: v.optional(imageCropValidator) },
  handler: async (ctx, { blockId, url, crop }) => {
    await assertWrite(ctx, blockId);
    await ctx.db.patch(blockId, { icon: { kind: 'image', url, ...(crop && { crop }) } });
    return { success: true } as const;
  },
});
```

- Clear icon

```147:155:convex/icons.ts
export const clearPageIcon = mutation({
  args: { blockId: blockIdValidator },
  handler: async (ctx, { blockId }) => {
    await assertWrite(ctx, blockId);
    await ctx.db.patch(blockId, { icon: undefined });
    return { success: true } as const;
  },
});
```

Notes:

- There are no queries in `convex/icons.ts`; uploaded image URLs are embedded directly into the block icon for rendering.

### Rendering icons (client)

`components/icons/icon.tsx` renders any of the three icon modes. It accepts a `Doc<'blocks'>['icon']` and decides how to render.

Key mechanics:

- **Emoji**: Renders the native glyph at full size inside a square container.
- **Preset**: Resolves a Lucide component by key and maps `style` to stroke/fill, with optional `color`.
- **Image**: Uses Next.js `<Image>` with `object-cover`; if a relative crop is provided, it maps to CSS `object-position`.

Code reference (excerpt):

```47:58:components/icons/icon.tsx
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
```

```60:77:components/icons/icon.tsx
  if (icon.kind === 'preset') {
    const Comp = resolveLucide(icon.key) ?? Lucide.CircleDashed;
    const strokeWidth = icon.style === 'solid' ? 0 : 2;
    const fill = icon.style === 'solid' ? 'currentColor' : 'none';
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
```

```80:109:components/icons/icon.tsx
  if (icon.kind === 'image') {
    const url = (icon as { url?: string })?.url;
    if (!url) return <Monogram title={title} className={className} size={size} />;
    const objectPosition = icon.crop
      ? `${Math.round(icon.crop.x * 100)}% ${Math.round(icon.crop.y * 100)}%`
      : undefined;
    return (
      <span
        aria-label={alt ?? (title ? `${title} icon` : 'icon')}
        className={cn('relative inline-block overflow-hidden rounded', className)}
        style={{ width: size, height: size }}
      >
        <Image src={url} alt={alt ?? (title ? `${title} icon` : 'icon')} fill sizes={`${size}px`} className="object-cover" style={objectPosition ? { objectPosition } : undefined} draggable={false} loading="lazy" />
      </span>
    );
  }
```

### Selecting icons (Icon Selector UI)

`components/icons/icon-selector/index.tsx` provides a popover with three tabs: Emoji, Icons, and Upload. A “Remove” action clears the icon.

- Entry point:
  - `IconSelector` wraps children with a popover trigger; manages open state via `popOverState$`.
  - When open, it renders `Content`, which shows tab buttons and the active tab body.

Code reference (header and remove):

```78:88:components/icons/icon-selector/index.tsx
      <PopoverGroup>
        <div className="flex items-center p-0.5">
          <TabButton tab$={uiState$.iconPicker.tab} label="emoji" />
          <TabButton tab$={uiState$.iconPicker.tab} label="icons" />
          <TabButton tab$={uiState$.iconPicker.tab} label="upload" />
          <div className="ml-auto">
            <Button variant="ghost" size="xs" onClick={handleClear} className="text-muted-foreground">
              Remove
            </Button>
          </div>
        </div>
      </PopoverGroup>
```

- Remove mechanics:
  - If a `blockId` is provided, calls `api.icons.clearPageIcon({ blockId })` then closes.
  - If used without a `blockId`, invokes `callback(undefined)` to let the parent clear local state.

```60:71:components/icons/icon-selector/index.tsx
  async function handleClear() {
    try {
      if (blockId) clearIcon({ blockId });
      search$.set('');
      callback?.(undefined);
      close();
    } catch {
      toast.error('Failed to remove icon');
    }
  }
```

#### EmojiTab

- Dataset: lazy-loads emoji JSON from `emoji-picker-react` and organizes by category.
- Search: debounced via shared helpers; filters by normalized names.
- Skin tones: applies selected tone to supported emojis.
- Recents: maintained in `localStorage` (`emoji:recent`) with capped, deduped list.
- Selection: sets `api.icons.setPageIconEmoji({ blockId, emoji })`, updates recents, optionally closes.
- Navigation: bottom section bar to jump between categories; scroll‑spy highlights the active section.

```124:133:components/icons/icon-selector/components/EmojiTab/index.tsx
  const onDebounced = React.useCallback(
    (value: string) => {
      state$.debouncedQuery.set(value);
      state$.visibleCount.set(INITIAL_VISIBLE);
    },
    [state$],
  );
```

```135:147:components/icons/icon-selector/components/EmojiTab/index.tsx
  const handleSelect = React.useCallback(
    async (unified: string, opts?: { close?: boolean; clearSearch?: boolean }) => {
      state$.recentList.set((prev) => upsertRecent(RECENT_EMOJIS_KEY, prev, unified, RECENT_LIMIT));
      const emojiStr = fromUnified(unified);
      if (blockId) {
        void setEmoji({ blockId, emoji: emojiStr }).catch(() => toast.error('Failed to set emoji'));
        callback?.({ emoji: emojiStr, kind: 'emoji' });
      }
      if (opts?.close !== false) close();
      if (opts?.clearSearch !== false) search$.set('');
    },
    [blockId, setEmoji, callback, close, search$, state$],
  );
```

#### IconsTab (Lucide presets)

- Source: `lucide-react/dynamicIconImports` provides the full catalog.
- Search: works across kebab and PascalCase names; debounced and normalized.
- Recents: stored in `localStorage` (`icons:recent`).
- Color & style: defaults to `style: 'line'` and uses `uiState$.iconPicker.iconColor` for `color`.
- Selection: sets `api.icons.setPageIconPreset({ blockId, key, style: 'line', color })`.

```104:117:components/icons/icon-selector/components/IconsTab/index.tsx
  const handleSelect = useCallback(
    async (key: string, opts?: { close?: boolean; clearSearch?: boolean }) => {
      if (!state$.keyExists(key)) return toast.error('Icon not found');
      state$.recentList.set((prev) => upsertRecent(RECENT_ICONS_KEY, prev, key, RECENT_LIMIT, normalizeKey));
      if (blockId) {
        const c = uiState$.iconPicker.iconColor.get();
        void setPreset({ blockId, key, style: 'line', color: c }).catch(() => toast.error('Failed to set icon'));
        callback?.({ key, style: 'line', color: c, kind: 'preset' });
      }
      if (opts?.close !== false) close();
      if (opts?.clearSearch !== false) search$.set('');
    },
    [blockId, setPreset, callback, close, search$, state$],
  );
```

#### UploadTab (images)

- Two flows:
  1. Upload file: calls `prepareUploadPageIcon` → POST file to `uploadUrl` → `finalizeUploadPageIcon` → sets `block.icon` with `kind: 'image'` and resolved `url`.
  2. Public URL: pasting or selecting a recent URL calls `setPageIconImageUrl`.
- UX:
  - Shows upload button, paste‑to‑upload hint, progress bar, error alert, and grid of recent URLs.
  - Maintains a capped `upload_urls:recent` list for quick reuse.

```45:72:components/icons/icon-selector/components/UploadTab/index.tsx
  const onPickFile = React.useCallback(
    async (file: File) => {
      if (!file) return;
      if (!blockId) {
        setError('Cannot upload without a block');
        toast.error('Cannot upload without a block');
        return;
      }
      try {
        setUploading(true);
        setProgress(0);
        setError(null);
        const { uploadUrl } = await prepareUpload({ blockId, mime: file.type, size: file.size });
        const { storageId } = await uploadFileWithProgress(uploadUrl, file, file.type, setProgress);
        const result = await finalizeUpload({ blockId, storageId, filename: file.name, mime: file.type, size: file.size });
        const url = result?.url;
        if (url) setRecentUrls((prev) => upsertRecent(RECENT_UPLOAD_URLS_KEY, prev, url, RECENT_LIMIT));
        toast.success('Icon updated');
        callback?.({ kind: 'image', file_id: result.fileId, ...(url ? { url } : {}) } as BlockIcon);
        onDone?.();
      } catch (err) {
        const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Upload failed';
        setError(message);
        toast.error(message);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [blockId, prepareUpload, finalizeUpload, callback, onDone],
  );
```

```112:166:components/icons/icon-selector/components/UploadTab/index.tsx
  React.useEffect(() => {
    const onPaste = (event: Event) => {
      if (uploading) return;
      const e = event as ClipboardEvent;
      const cd = e.clipboardData;
      if (!cd) return;
      const active = (document.activeElement as HTMLElement | null) ?? undefined;
      const isEditable = !!active && (active.isContentEditable || ['INPUT', 'TEXTAREA'].includes(active.tagName));
      if (isEditable) return;
      const items = cd.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            void onPickFile(file);
            e.preventDefault();
            return;
          }
        }
      }
      const text = cd.getData('text');
      if (text && /^https?:\/\//.test(text.trim())) {
        const url = text.trim();
        if (!blockId) {
          const msg = 'Cannot set image without a block';
          setError(msg);
          toast.error(msg);
          return;
        }
        setRecentUrls((prev) => upsertRecent(RECENT_UPLOAD_URLS_KEY, prev, url, RECENT_LIMIT));
        (async () => {
          try {
            await setImageByUrl({ blockId, url });
            callback?.({ kind: 'image', url } as BlockIcon);
            onDone?.();
            toast.success('Icon updated');
          } catch {
            toast.error('Failed to set image');
          }
        })();
        e.preventDefault();
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [uploading, blockId, setImageByUrl, callback, onDone, onPickFile]);
```

### Usage

- Render the current icon:

```tsx
import { Icon } from '@/components/icons/icon';

// inside a page item
<Icon icon={block.icon} title={block.title} size={24} className="text-foreground" />;
```

- Let users set/clear the icon:

```tsx
import { IconSelector } from '@/components/icons/icon-selector';

<IconSelector blockId={block._id}>
  <button className="text-muted-foreground">Change icon</button>
</IconSelector>;
```

Notes:

- The selector can also be used without `blockId` by passing a `callback(icon)` to manage local state.
- The UI uses shadcn/ui primitives (`Popover`, `Command`, `Button`, `Tooltip`) and respects theme color variables. Avoid hardcoded Tailwind colors.

### Accessibility & UX

- All interactive elements have labels/tooltips; emoji buttons set `aria-label` to the human name when available.
- Image icons use `loading=\"lazy\"` and `object-position` when cropping is provided.
- Debounced search, infinite-scroll lists, and capped recents for performance.
