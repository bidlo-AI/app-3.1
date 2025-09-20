import { mutation, type MutationCtx, type QueryCtx, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

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

async function getOrgByWorkOSId(ctx: QueryCtx | MutationCtx, workosOrgId: string) {
  const orgDoc = await ctx.db
    .query('organizations')
    .withIndex('by_workos_id', (q) => q.eq('workos_id', workosOrgId))
    .first();
  if (!orgDoc) throw new Error('Organization not found');
  return orgDoc;
}

export const createTeam = mutation({
  args: { workosOrgId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const userDoc = await getCurrentUserDoc(ctx);
    const orgDoc = await getOrgByWorkOSId(ctx, args.workosOrgId);
    const now = Date.now();

    const teamId = await ctx.db.insert('teams', {
      organizationId: orgDoc._id,
      name: args.name,
      visibility: 'closed',
      createdAt: now,
      createdBy: userDoc._id,
    });

    await ctx.db.insert('team_members', {
      teamId,
      userId: userDoc._id,
      role: 'owner',
      createdAt: now,
    });

    return { teamId } as { teamId: Id<'teams'> };
  },
});

export const listMyTeams = query({
  args: { workosOrgId: v.string() },
  handler: async (ctx, args) => {
    const userDoc = await getCurrentUserDoc(ctx);
    const orgDoc = await getOrgByWorkOSId(ctx, args.workosOrgId);
    const memberships = await ctx.db
      .query('team_members')
      .withIndex('by_user', (q) => q.eq('userId', userDoc._id))
      .collect();
    const teams: Array<{ _id: Id<'teams'>; name: string }> = [];
    for (const m of memberships) {
      const t = await ctx.db.get(m.teamId);
      if (t && t.organizationId === orgDoc._id) teams.push({ _id: t._id, name: t.name });
    }
    teams.sort((a, b) => a.name.localeCompare(b.name));
    return teams;
  },
});
