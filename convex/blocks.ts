import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { getCurrentUserDoc, getSessionInfo } from './helpers';
import { blockIdValidator, scopePrivateTeamValidator, teamIdValidator } from './validators';

// --------------------------------
// QUERIES
// --------------------------------

//! YUO SHOULD BE GETTING THE ORG ID FROM THE COOKIE/AUTH!!!!
//! - getting the entire org doc is almost never needed becasue the id is in the cookie

// Fetch a block and its immediate children with basic permission checks
export const getBlock = query({
  args: { blockId: blockIdValidator },
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId);
    if (!block) throw new Error('Block not found');

    // Get current session user/org ids
    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);

    // Basic permission guard
    if (block.workos_org_id !== workos_org_id) throw new Error('Forbidden');
    if (block.scope === 'private' && block.owner_id !== workos_user_id) throw new Error('Forbidden');
    if (block.scope === 'team') {
      // Use composite index by_team_user to avoid filter scan
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team_user', (q) => q.eq('team_id', block.team_id!).eq('workos_user_id', workos_user_id))
        .first();
      if (!membership) throw new Error('Forbidden');
    }

    // Load immediate children (ordered)
    const children = await ctx.db
      .query('blocks')
      .withIndex('by_parent_pos', (q) => q.eq('parent_id', block._id))
      .collect();
    children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.created_at ?? 0) - (b.created_at ?? 0));

    return {
      block: {
        _id: block._id,
        title: block.title ?? 'Untitled',
        type: block.type,
        scope: block.scope,
        icon: block.icon ?? undefined,
        content: block.content ?? null,
        createdAt: block.created_at,
        updatedAt: block.updated_at,
      },
      children: children.map((c) => ({
        _id: c._id,
        title: c.title ?? 'Untitled',
        type: c.type,
        icon: c.icon ?? undefined,
        position: c.position,
      })),
    } as const;
  },
});

// List top-level private pages for the current user in the selected org
export const listPrivatePages = query({
  handler: async (ctx) => {
    // Most operations only need the session ids
    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);
    // Keep arg to avoid breaking API; rely on session for logic

    const candidatePages = await ctx.db
      .query('blocks')
      .withIndex('by_owner_scope_org', (q) =>
        q.eq('owner_id', workos_user_id).eq('scope', 'private').eq('workos_org_id', workos_org_id),
      )
      .collect();

    const pages = candidatePages.filter((p) => p.type === 'page' && p.depth === 0);
    pages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.created_at ?? 0) - (b.created_at ?? 0));
    return pages.map((p) => ({
      _id: p._id,
      title: p.title ?? 'Untitled',
      position: p.position,
      icon: p.icon ?? undefined,
    }));
  },
});

// List team pages for teams the current user belongs to in the selected org
export const listTeamPagesForUser = query({
  handler: async (ctx) => {
    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);

    // Find all teams in this org where the user is a member
    const memberships = await ctx.db
      .query('team_members')
      .withIndex('by_user', (q) => q.eq('workos_user_id', workos_user_id))
      .collect();

    // Fetch team docs in parallel and keep only those in the selected org
    const teamDocsRaw = await Promise.all(memberships.map((m) => ctx.db.get(m.team_id)));
    const teamDocs = teamDocsRaw.filter((t): t is Doc<'teams'> => t !== null && t.workos_org_id === workos_org_id);

    // For each team, get top-level page blocks in parallel
    const pagesByTeam = await Promise.all(
      teamDocs.map((team) =>
        ctx.db
          .query('blocks')
          .withIndex('by_team', (q) => q.eq('team_id', team._id))
          .collect(),
      ),
    );

    let result: Array<{
      team: { _id: Id<'teams'>; name: string; icon?: Doc<'teams'>['icon'] };
      pages: Array<{ _id: Id<'blocks'>; title: string; position?: number }>;
    }> = teamDocs.map((team, idx) => {
      const teamPages = pagesByTeam[idx];
      const pages = teamPages.filter((p) => p.scope === 'team' && p.type === 'page' && p.depth === 0);
      pages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.created_at ?? 0) - (b.created_at ?? 0));
      return {
        team: { _id: team._id as Id<'teams'>, name: team.name, icon: team.icon ?? undefined },
        pages: pages.map((p) => ({
          _id: p._id,
          title: p.title ?? 'Untitled',
          position: p.position,
          icon: p.icon ?? undefined,
        })),
      };
    });
    // Sort teams by user's preferred order if available; otherwise by name
    const userDoc = await getCurrentUserDoc(ctx);
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
  args: { parentId: blockIdValidator },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent) throw new Error('Parent not found');

    // Only need the current session user/org ids
    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);

    // Permission guard based on parent's scope
    if (parent.workos_org_id !== workos_org_id) throw new Error('Forbidden');
    if (parent.scope === 'private' && parent.owner_id !== workos_user_id) throw new Error('Forbidden');
    if (parent.scope === 'team') {
      // Use composite index by_team_user to avoid filter scan
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team_user', (q) => q.eq('team_id', parent.team_id!).eq('workos_user_id', workos_user_id))
        .first();
      if (!membership) throw new Error('Forbidden');
    }

    const children = await ctx.db
      .query('blocks')
      .withIndex('by_parent_pos', (q) => q.eq('parent_id', args.parentId))
      .collect();
    // Filter type in-memory to avoid an extra index while leveraging parent+position index
    const pageChildren = children.filter((c) => c.type === 'page');
    pageChildren.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.created_at ?? 0) - (b.created_at ?? 0));
    return pageChildren.map((c) => ({
      _id: c._id,
      title: c.title ?? 'Untitled',
      position: c.position,
      icon: c.icon ?? undefined,
    }));
  },
});

// Create a new team in an organization and add current user as owner
// (moved to teams.ts) createTeam

// Create a new top-level page block (private or team)
export const createPage = mutation({
  args: {
    scope: scopePrivateTeamValidator,
    teamId: v.optional(teamIdValidator),
    title: v.optional(v.string()),
    parentId: v.optional(blockIdValidator),
  },
  handler: async (ctx, args) => {
    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);

    // Determine inheritance context (top-level vs child)
    let parentBlock: Doc<'blocks'> | null = null;
    if (args.parentId) {
      const p = await ctx.db.get(args.parentId);
      if (!p) throw new Error('Parent block not found');
      if (p.workos_org_id !== workos_org_id) throw new Error('Parent block is not in selected organization');
      // Basic permission checks aligned with listed sections
      if (p.scope === 'private' && p.owner_id !== workos_user_id)
        throw new Error('Not allowed to add to this private page');
      if (p.scope === 'team') {
        const membership = await ctx.db
          .query('team_members')
          .withIndex('by_team_user', (q) => q.eq('team_id', p.team_id!).eq('workos_user_id', workos_user_id))
          .first();
        if (!membership) throw new Error('Not a member of this team');
      }
      parentBlock = p;
    }

    // Resolve scope/owner/team/org based on parent inheritance or args
    const effectiveScope = parentBlock ? (parentBlock.scope as 'private' | 'team') : args.scope;
    const effectiveOrgId = parentBlock ? parentBlock.workos_org_id : workos_org_id;
    const effectiveOwnerId = parentBlock ? parentBlock.owner_id : workos_user_id;
    let teamId: Id<'teams'> | undefined = parentBlock ? parentBlock.team_id : undefined;
    if (!parentBlock && effectiveScope === 'team') {
      if (!args.teamId) throw new Error('teamId is required when scope is team');
      const team = await ctx.db.get(args.teamId);
      if (!team) throw new Error('Team not found');
      if (team.workos_org_id !== workos_org_id) throw new Error('Team does not belong to selected organization');
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team_user', (q) => q.eq('team_id', team._id).eq('workos_user_id', workos_user_id))
        .first();
      if (!membership) throw new Error('User is not a member of the team');
      teamId = team._id;
    }

    // Choose position using timestamp for stable ordering without extra queries
    const now = Date.now();

    const isChild = !!parentBlock;
    const blockId = await ctx.db.insert('blocks', {
      workos_org_id: effectiveOrgId,
      owner_id: effectiveOwnerId,
      team_id: teamId,
      scope: effectiveScope,
      type: 'page',
      title: args.title ?? 'Untitled',
      parent_id: parentBlock?._id,
      position: now,
      ancestors: parentBlock ? [...(parentBlock.ancestors ?? []), parentBlock._id] : [],
      depth: parentBlock ? (parentBlock.depth ?? 0) + 1 : 0,
      root_id: parentBlock ? (parentBlock.root_id ?? parentBlock._id) : undefined,
      content: undefined,
      is_archived: false,
      archived_at: undefined,
      deleted_at: undefined,
      created_at: now,
      created_by: workos_user_id,
      updated_at: now,
      updated_by: workos_user_id,
    });

    // Set rootId to self for top-level pages
    if (!isChild) {
      await ctx.db.patch(blockId, { root_id: blockId });
    }
    return { blockId } as { blockId: Id<'blocks'> };
  },
});

// Reorder top-level pages (private or team) by assigning new position values
export const reorderTopLevelPages = mutation({
  args: {
    scope: scopePrivateTeamValidator,
    ids: v.array(blockIdValidator),
    teamId: v.optional(teamIdValidator),
  },
  handler: async (ctx, args) => {
    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);

    if (args.scope === 'team') {
      if (!args.teamId) throw new Error('teamId is required for team scope');
      const team = await ctx.db.get(args.teamId);
      if (!team || team.workos_org_id !== workos_org_id) throw new Error('Team not found');
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team_user', (q) => q.eq('team_id', args.teamId!).eq('workos_user_id', workos_user_id))
        .first();
      if (!membership) throw new Error('Forbidden');
    }

    // Validate that all blocks belong to the correct scope and are top-level pages in this org
    const blocks = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    for (const b of blocks) {
      if (!b) throw new Error('Block not found');
      if (b.workos_org_id !== workos_org_id) throw new Error('Block not in selected organization');
      if (b.type !== 'page' || b.depth !== 0) throw new Error('Only top-level pages can be reordered');
      if (args.scope === 'private') {
        if (b.scope !== 'private' || b.owner_id !== workos_user_id) throw new Error('Forbidden');
      } else {
        if (b.scope !== 'team' || b.team_id !== args.teamId) throw new Error('Forbidden');
      }
    }

    // Apply new positions using a dense increasing sequence for stable ordering
    const base = Date.now();
    await Promise.all(
      args.ids.map((id, idx) =>
        ctx.db.patch(id, { position: base + idx, updated_at: base + idx, updated_by: workos_user_id }),
      ),
    );
    return { success: true } as const;
  },
});

// Update a block's title with permission checks
export const updateTitle = mutation({
  args: { blockId: blockIdValidator, title: v.string() },
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId);
    if (!block) throw new Error('Block not found');

    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);

    // Basic permission guard aligned with getBlock
    if (block.workos_org_id !== workos_org_id) throw new Error('Forbidden');
    if (block.scope === 'private' && block.owner_id !== workos_user_id) throw new Error('Forbidden');
    if (block.scope === 'team') {
      const membership = await ctx.db
        .query('team_members')
        .withIndex('by_team_user', (q) => q.eq('team_id', block.team_id!).eq('workos_user_id', workos_user_id))
        .first();
      if (!membership) throw new Error('Forbidden');
    }

    const now = Date.now();
    await ctx.db.patch(args.blockId, { title: args.title, updated_at: now, updated_by: workos_user_id });
    return { success: true } as const;
  },
});
