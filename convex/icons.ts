import { mutation } from './_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { getSessionInfo } from './helpers';
import { hueValidator, iconStyleValidator, blockIdValidator, fileIdValidator, imageCropValidator } from './validators';

// --------------------------------
// HELPERS (local)
// --------------------------------
async function assertWrite(ctx: MutationCtx, blockId: Id<'blocks'>) {
  // Basic guard leveraging existing scope patterns.
  const block = await ctx.db.get(blockId);
  if (!block) throw new Error('Block not found');
  const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);
  if (block.workos_org_id !== workos_org_id) throw new Error('Forbidden');
  if (block.scope === 'private' && block.owner_id !== workos_user_id) throw new Error('Forbidden');
  if (block.scope === 'team') {
    const membership = await ctx.db
      .query('team_members')
      .withIndex('by_team_user', (q) => q.eq('team_id', block.team_id!).eq('workos_user_id', workos_user_id))
      .first();
    if (!membership) throw new Error('Forbidden');
  }
}

// use ctx.storage.generateUploadUrl directly in handlers

// --------------------------------
// MUTATIONS
// --------------------------------
export const setPageIconEmoji = mutation({
  args: {
    blockId: blockIdValidator,
    emoji: v.string(),
    shortcode: v.optional(v.string()),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertWrite(ctx, args.blockId);
    await ctx.db.patch(args.blockId, {
      icon: {
        kind: 'emoji',
        emoji: args.emoji,
        ...(args.shortcode && { shortcode: args.shortcode }),
        ...(args.version && { version: args.version }),
      },
    });
  },
});

export const setPageIconPreset = mutation({
  args: {
    blockId: blockIdValidator,
    key: v.string(),
    style: v.optional(iconStyleValidator),
    color: v.optional(hueValidator),
  },
  handler: async (ctx, args) => {
    await assertWrite(ctx, args.blockId);
    await ctx.db.patch(args.blockId, {
      icon: {
        kind: 'preset',
        key: args.key,
        ...(args.style && { style: args.style }),
        ...(args.color && { color: args.color }),
      },
    });
  },
});

export const prepareUploadPageIcon = mutation({
  args: {
    blockId: blockIdValidator,
    filename: v.string(),
    mime: v.string(),
    size: v.number(),
  },
  handler: async (ctx, { blockId, filename, mime, size }) => {
    await assertWrite(ctx, blockId);
    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);

    // Simple validation to keep pipeline safe
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
    if (!allowed.includes(mime)) throw new Error('Unsupported MIME type');
    if (size > 512 * 1024) throw new Error('File too large');
    // Step 1: Generate a short-lived upload URL (Convex Storage)
    // See: https://docs.convex.dev/file-storage/upload-files
    const uploadUrl = await ctx.storage.generateUploadUrl();
    // Step 2: Create a placeholder file record now so we can reference it in the UI
    // We'll fill in the actual storage id during finalize.
    const fileId = await ctx.db.insert('files', {
      block_id: blockId,
      workos_org_id,
      storage_key: '',
      name: filename,
      mime,
      size,
      uploaded_by: workos_user_id,
      uploaded_at: Date.now(),
      purpose: 'page_icon',
    });

    return { uploadUrl, fileId } as const;
  },
});

export const finalizeUploadPageIcon = mutation({
  args: {
    blockId: blockIdValidator,
    fileId: fileIdValidator,
    // Storage id returned by Convex after POSTing the file to uploadUrl
    storageId: v.id('_storage'),
    crop: v.optional(imageCropValidator),
  },
  handler: async (ctx, { blockId, fileId, storageId, crop }) => {
    await assertWrite(ctx, blockId);
    const file = await ctx.db.get(fileId);
    if (!file) throw new Error('File not found');
    if (file.block_id !== blockId) throw new Error('Invalid file for block');
    if (file.purpose !== 'page_icon') throw new Error('Invalid purpose for icon');
    // Attach the Convex storage id to the file metadata so it can be resolved later
    if (!file.storage_key) {
      await ctx.db.patch(fileId, { storage_key: storageId });
    }

    // Optional: clean up older icon files for this block
    const others = await ctx.db
      .query('files')
      .withIndex('by_block_purpose', (q) => q.eq('block_id', blockId).eq('purpose', 'page_icon'))
      .collect();
    for (const f of others) {
      if (f._id !== fileId) {
        // Soft delete by removing purpose; alternatively, add deleted_at in schema later
        await ctx.db.patch(f._id, { purpose: undefined } as Partial<Doc<'files'>>);
      }
    }

    // Resolve a temporary URL now and store it on the block's icon for immediate rendering
    const url = await ctx.storage.getUrl(storageId);
    await ctx.db.patch(blockId, {
      icon: { kind: 'image', url: url ?? undefined, file_id: fileId, ...(crop && { crop }) },
    });
    return { success: true } as const;
  },
});

export const clearPageIcon = mutation({
  args: { blockId: blockIdValidator },
  handler: async (ctx, { blockId }) => {
    await assertWrite(ctx, blockId);
    await ctx.db.patch(blockId, { icon: undefined });
    // Optional: garbage collect icon files (left as-is to preserve history)
    return { success: true } as const;
  },
});

// Resolve a file's temporary URL for rendering uploaded image icons.
// Enforces the same read permissions as viewing the owning block.
// Removed legacy URL resolver query; the image URL is embedded directly into the block icon now.
