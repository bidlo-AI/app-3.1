import { mutation, query, type QueryCtx, type MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';

// Utility: get current user's Convex user doc by WorkOS user id
async function getCurrentUserDoc(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const workosUserId = identity?.subject;
  if (!workosUserId) throw new Error('User not authenticated');

  const userDoc = await ctx.db
    .query('users')
    .withIndex('by_workos_id', (q) => q.eq('workos_id', workosUserId))
    .first();
  if (!userDoc) throw new Error('User not found');
  return userDoc;
}

// Utility: get org doc from WorkOS org id
async function getOrgByWorkOSId(ctx: QueryCtx | MutationCtx, workosOrgId: string) {
  const orgDoc = await ctx.db
    .query('organizations')
    .withIndex('by_workos_id', (q) => q.eq('workos_id', workosOrgId))
    .first();
  if (!orgDoc) throw new Error('Organization not found');
  return orgDoc;
}

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
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team', (q) => q.eq('teamId', block.teamId!))
        .filter((q) => q.eq(q.field('userId'), userDoc._id))
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

    const pages = await ctx.db
      .query('blocks')
      .withIndex('by_owner_scope', (q) => q.eq('ownerId', userDoc._id).eq('scope', 'private'))
      .filter((q) => q.eq(q.field('organizationId'), orgDoc._id))
      .filter((q) => q.eq(q.field('type'), 'page'))
      .filter((q) => q.eq(q.field('depth'), 0))
      .collect();

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

    // Fetch team docs and keep only those in the selected org
    const teamDocs: Array<{ _id: Id<'teams'>; name: string; organizationId: Id<'organizations'> }> = [];
    for (const m of memberships) {
      const team = await ctx.db.get(m.teamId);
      if (team && team.organizationId === orgDoc._id) teamDocs.push(team);
    }

    // For each team, get top-level page blocks
    const result: Array<{
      team: { _id: Id<'teams'>; name: string };
      pages: Array<{ _id: Id<'blocks'>; title: string; position?: number }>;
    }> = [];
    for (const team of teamDocs) {
      const pages = await ctx.db
        .query('blocks')
        .withIndex('by_team', (q) => q.eq('teamId', team._id))
        .filter((q) => q.eq(q.field('organizationId'), orgDoc._id))
        .filter((q) => q.eq(q.field('scope'), 'team'))
        .filter((q) => q.eq(q.field('type'), 'page'))
        .filter((q) => q.eq(q.field('depth'), 0))
        .collect();
      pages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
      result.push({
        team: { _id: team._id as Id<'teams'>, name: team.name },
        pages: pages.map((p) => ({ _id: p._id, title: p.title ?? 'Untitled', position: p.position })),
      });
    }
    // Sort teams by name for consistent UI
    result.sort((a, b) => a.team.name.localeCompare(b.team.name));
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
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team', (q) => q.eq('teamId', parent.teamId!))
        .filter((q) => q.eq(q.field('userId'), userDoc._id))
        .first();
      if (!membership) throw new Error('Forbidden');
    }

    const children = await ctx.db
      .query('blocks')
      .withIndex('by_parent_pos', (q) => q.eq('parentId', args.parentId))
      .filter((q) => q.eq(q.field('type'), 'page'))
      .collect();
    children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
    return children.map((c) => ({ _id: c._id, title: c.title ?? 'Untitled', position: c.position }));
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
          .withIndex('by_team', (q) => q.eq('teamId', p.teamId!))
          .filter((q) => q.eq(q.field('userId'), userDoc._id))
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
        .withIndex('by_team', (q) => q.eq('teamId', team._id))
        .filter((q) => q.eq(q.field('userId'), userDoc._id))
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
