import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { getCurrentUserDoc, getOrgByWorkOSId } from './helpers';

// --------------------------------
// QUERIES
// --------------------------------

// Fetch a block and its immediate children with basic permission checks
export const getBlock = query({
  args: { blockId: v.id('blocks') },
  handler: async (ctx, args) => {
    const userDoc = await getCurrentUserDoc(ctx);
    const block = await ctx.db.get(args.blockId);
    if (!block) throw new Error('Block not found');

    // Basic permission guard
    if (block.scope === 'private' && block.ownerId !== userDoc._id) throw new Error('Forbidden');
    if (block.scope === 'team') {
      // Use composite index by_team_user to avoid filter scan
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team_user', (q) => q.eq('teamId', block.teamId!).eq('userId', userDoc._id))
        .first();
      if (!membership) throw new Error('Forbidden');
    }

    // Load immediate children (ordered)
    const children = await ctx.db
      .query('blocks')
      .withIndex('by_parent_pos', (q) => q.eq('parentId', block._id))
      .collect();
    children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));

    return {
      block: {
        _id: block._id,
        title: block.title ?? 'Untitled',
        type: block.type,
        scope: block.scope,
        content: block.content ?? null,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      },
      children: children.map((c) => ({
        _id: c._id,
        title: c.title ?? 'Untitled',
        type: c.type,
        position: c.position,
      })),
    } as const;
  },
});

// List top-level private pages for the current user in the selected org
export const listPrivatePages = query({
  args: { workosOrgId: v.string() },
  handler: async (ctx, args) => {
    const userDoc = await getCurrentUserDoc(ctx);
    const orgDoc = await getOrgByWorkOSId(ctx, args.workosOrgId);

    // Fetch private top-level pages for this user within the organization using composite index
    const candidatePages = await ctx.db
      .query('blocks')
      .withIndex('by_owner_scope_org', (q) =>
        q.eq('ownerId', userDoc._id).eq('scope', 'private').eq('organizationId', orgDoc._id),
      )
      .collect();

    const pages = candidatePages.filter((p) => p.type === 'page' && p.depth === 0);

    // Sort by position ascending; fallback to createdAt
    pages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
    return pages.map((p) => ({ _id: p._id, title: p.title ?? 'Untitled', position: p.position }));
  },
});

// List team pages for teams the current user belongs to in the selected org
export const listTeamPagesForUser = query({
  args: { workosOrgId: v.string() },
  handler: async (ctx, args) => {
    const userDoc = await getCurrentUserDoc(ctx);
    const orgDoc = await getOrgByWorkOSId(ctx, args.workosOrgId);

    // Find all teams in this org where the user is a member
    const memberships = await ctx.db
      .query('team_members')
      .withIndex('by_user', (q) => q.eq('userId', userDoc._id))
      .collect();

    // Fetch team docs in parallel and keep only those in the selected org
    const teamDocsRaw = await Promise.all(memberships.map((m) => ctx.db.get(m.teamId)));
    const teamDocs = teamDocsRaw.filter((t): t is Doc<'teams'> => t !== null && t.organizationId === orgDoc._id);

    // For each team, get top-level page blocks in parallel
    const pagesByTeam = await Promise.all(
      teamDocs.map((team) =>
        ctx.db
          .query('blocks')
          .withIndex('by_team', (q) => q.eq('teamId', team._id))
          .collect(),
      ),
    );

    let result: Array<{
      team: { _id: Id<'teams'>; name: string };
      pages: Array<{ _id: Id<'blocks'>; title: string; position?: number }>;
    }> = teamDocs.map((team, idx) => {
      const teamPages = pagesByTeam[idx];
      const pages = teamPages.filter(
        (p) => p.organizationId === orgDoc._id && p.scope === 'team' && p.type === 'page' && p.depth === 0,
      );
      pages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
      return {
        team: { _id: team._id as Id<'teams'>, name: team.name },
        pages: pages.map((p) => ({ _id: p._id, title: p.title ?? 'Untitled', position: p.position })),
      };
    });
    // Sort teams by user's preferred order if available; otherwise by name
    const preferred = (userDoc.sidebar_team_order as Id<'teams'>[] | undefined) ?? [];
    if (preferred.length > 0) {
      const index = new Map(preferred.map((id, i) => [id, i] as const));
      result = result.slice().sort((a, b) => {
        const ai = index.get(a.team._id);
        const bi = index.get(b.team._id);
        if (ai !== undefined && bi !== undefined) return ai - bi;
        if (ai !== undefined) return -1;
        if (bi !== undefined) return 1;
        return a.team.name.localeCompare(b.team.name);
      });
    } else {
      result.sort((a, b) => a.team.name.localeCompare(b.team.name));
    }
    return result;
  },
});

// List child pages for a given parent block (permission based on parent)
export const listChildren = query({
  args: { parentId: v.id('blocks') },
  handler: async (ctx, args) => {
    const userDoc = await getCurrentUserDoc(ctx);
    const parent = await ctx.db.get(args.parentId);
    if (!parent) throw new Error('Parent not found');

    // Permission guard based on parent's scope
    if (parent.scope === 'private' && parent.ownerId !== userDoc._id) throw new Error('Forbidden');
    if (parent.scope === 'team') {
      // Use composite index by_team_user to avoid filter scan
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team_user', (q) => q.eq('teamId', parent.teamId!).eq('userId', userDoc._id))
        .first();
      if (!membership) throw new Error('Forbidden');
    }

    const children = await ctx.db
      .query('blocks')
      .withIndex('by_parent_pos', (q) => q.eq('parentId', args.parentId))
      .collect();
    // Filter type in-memory to avoid an extra index while leveraging parent+position index
    const pageChildren = children.filter((c) => c.type === 'page');
    pageChildren.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
    return pageChildren.map((c) => ({ _id: c._id, title: c.title ?? 'Untitled', position: c.position }));
  },
});

// Create a new team in an organization and add current user as owner
// (moved to teams.ts) createTeam

// Create a new top-level page block (private or team)
export const createPage = mutation({
  args: {
    workosOrgId: v.string(),
    scope: v.union(v.literal('private'), v.literal('team')),
    teamId: v.optional(v.id('teams')),
    title: v.optional(v.string()),
    parentId: v.optional(v.id('blocks')),
  },
  handler: async (ctx, args) => {
    const userDoc = await getCurrentUserDoc(ctx);
    const orgDoc = await getOrgByWorkOSId(ctx, args.workosOrgId);

    // Determine inheritance context (top-level vs child)
    let parentBlock: Doc<'blocks'> | null = null;
    if (args.parentId) {
      const p = await ctx.db.get(args.parentId);
      if (!p) throw new Error('Parent block not found');
      if (p.organizationId !== orgDoc._id) throw new Error('Parent block is not in selected organization');
      // Basic permission checks aligned with listed sections
      if (p.scope === 'private' && p.ownerId !== userDoc._id)
        throw new Error('Not allowed to add to this private page');
      if (p.scope === 'team') {
        const membership = await ctx.db
          .query('team_members')
          .withIndex('by_team_user', (q) => q.eq('teamId', p.teamId!).eq('userId', userDoc._id))
          .first();
        if (!membership) throw new Error('Not a member of this team');
      }
      parentBlock = p;
    }

    // Resolve scope/owner/team/org based on parent inheritance or args
    const effectiveScope = parentBlock ? (parentBlock.scope as 'private' | 'team') : args.scope;
    const effectiveOrgId = parentBlock ? parentBlock.organizationId : orgDoc._id;
    const effectiveOwnerId = parentBlock ? parentBlock.ownerId : userDoc._id;
    let teamId: Id<'teams'> | undefined = parentBlock ? parentBlock.teamId : undefined;
    if (!parentBlock && effectiveScope === 'team') {
      if (!args.teamId) throw new Error('teamId is required when scope is team');
      const team = await ctx.db.get(args.teamId);
      if (!team) throw new Error('Team not found');
      if (team.organizationId !== orgDoc._id) throw new Error('Team does not belong to selected organization');
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team_user', (q) => q.eq('teamId', team._id).eq('userId', userDoc._id))
        .first();
      if (!membership) throw new Error('User is not a member of the team');
      teamId = team._id;
    }

    // Choose position using timestamp for stable ordering without extra queries
    const now = Date.now();

    const isChild = !!parentBlock;
    const blockId = await ctx.db.insert('blocks', {
      organizationId: effectiveOrgId,
      ownerId: effectiveOwnerId,
      teamId,
      scope: effectiveScope,
      type: 'page',
      title: args.title ?? 'Untitled',
      parentId: parentBlock?._id,
      position: now,
      ancestors: parentBlock ? [...(parentBlock.ancestors ?? []), parentBlock._id] : [],
      depth: parentBlock ? (parentBlock.depth ?? 0) + 1 : 0,
      rootId: parentBlock ? (parentBlock.rootId ?? parentBlock._id) : undefined, // set to self below if top-level
      content: undefined,
      isArchived: false,
      archivedAt: undefined,
      deletedAt: undefined,
      createdAt: now,
      createdBy: userDoc._id,
      updatedAt: now,
      updatedBy: userDoc._id,
    });

    // Set rootId to self for top-level pages
    if (!isChild) {
      await ctx.db.patch(blockId, { rootId: blockId });
    }
    return { blockId } as { blockId: Id<'blocks'> };
  },
});

// Reorder top-level pages (private or team) by assigning new position values
export const reorderTopLevelPages = mutation({
  args: {
    workosOrgId: v.string(),
    scope: v.union(v.literal('private'), v.literal('team')),
    ids: v.array(v.id('blocks')),
    teamId: v.optional(v.id('teams')),
  },
  handler: async (ctx, args) => {
    const userDoc = await getCurrentUserDoc(ctx);
    const orgDoc = await getOrgByWorkOSId(ctx, args.workosOrgId);

    if (args.scope === 'team') {
      if (!args.teamId) throw new Error('teamId is required for team scope');
      const team = await ctx.db.get(args.teamId);
      if (!team || team.organizationId !== orgDoc._id) throw new Error('Team not found');
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team_user', (q) => q.eq('teamId', args.teamId!).eq('userId', userDoc._id))
        .first();
      if (!membership) throw new Error('Forbidden');
    }

    // Validate that all blocks belong to the correct scope and are top-level pages in this org
    const blocks = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    for (const b of blocks) {
      if (!b) throw new Error('Block not found');
      if (b.organizationId !== orgDoc._id) throw new Error('Block not in selected organization');
      if (b.type !== 'page' || b.depth !== 0) throw new Error('Only top-level pages can be reordered');
      if (args.scope === 'private') {
        if (b.scope !== 'private' || b.ownerId !== userDoc._id) throw new Error('Forbidden');
      } else {
        if (b.scope !== 'team' || b.teamId !== args.teamId) throw new Error('Forbidden');
      }
    }

    // Apply new positions using a dense increasing sequence for stable ordering
    const base = Date.now();
    await Promise.all(
      args.ids.map((id, idx) =>
        ctx.db.patch(id, { position: base + idx, updatedAt: base + idx, updatedBy: userDoc._id }),
      ),
    );
    return { success: true } as const;
  },
});
