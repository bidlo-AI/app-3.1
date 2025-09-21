import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { getCurrentUserDoc, getOrgByWorkOSId } from './helpers';

// --------------------------------
// MUTATIONS
// --------------------------------

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

// --------------------------------
// QUERIES
// --------------------------------
export const listMyTeams = query({
  args: { workosOrgId: v.string() },
  handler: async (ctx, args) => {
    const userDoc = await getCurrentUserDoc(ctx);
    const orgDoc = await getOrgByWorkOSId(ctx, args.workosOrgId);
    const memberships = await ctx.db
      .query('team_members')
      .withIndex('by_user', (q) => q.eq('userId', userDoc._id))
      .collect();

    // Fetch team docs in parallel to reduce latency (getMany not available in this setup)
    const teamIds = memberships.map((m) => m.teamId);
    const teamDocs = await Promise.all(teamIds.map((id) => ctx.db.get(id)));

    // Type guard to drop nulls from parallel fetches
    const validTeamDocs = teamDocs.filter((t): t is Doc<'teams'> => t !== null);

    const teams: Array<{ _id: Id<'teams'>; name: string }> = validTeamDocs
      .filter((t) => t.organizationId === orgDoc._id)
      .map((t) => ({ _id: t._id, name: t.name }));

    // Keep UI stable by sorting alphabetically by team name
    teams.sort((a, b) => a.name.localeCompare(b.name));
    return teams;
  },
});
