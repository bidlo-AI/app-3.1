import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { getSessionInfo } from './helpers';

// --------------------------------
// MUTATIONS
// --------------------------------

export const createTeam = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const { workos_org_id, workos_user_id } = await getSessionInfo(ctx);
    const now = Date.now();

    const teamId = await ctx.db.insert('teams', {
      workos_org_id,
      name: args.name,
      visibility: 'closed',
      created_at: now,
      created_by: workos_user_id,
    });

    await ctx.db.insert('team_members', {
      team_id: teamId,
      workos_user_id,
      role: 'owner',
      created_at: now,
    });

    return { teamId } as { teamId: Id<'teams'> };
  },
});

// --------------------------------
// QUERIES
// --------------------------------
export const listMyTeams = query({
  handler: async (ctx) => {
    const { workos_user_id, workos_org_id } = await getSessionInfo(ctx);
    const memberships = await ctx.db
      .query('team_members')
      .withIndex('by_user', (q) => q.eq('workos_user_id', workos_user_id))
      .collect();

    // Fetch team docs in parallel to reduce latency (getMany not available in this setup)
    const teamIds = memberships.map((m) => m.team_id);
    const teamDocs = await Promise.all(teamIds.map((id) => ctx.db.get(id)));

    // Type guard to drop nulls from parallel fetches
    const validTeamDocs = teamDocs.filter((t): t is Doc<'teams'> => t !== null);

    const teams: Array<{ _id: Id<'teams'>; name: string }> = validTeamDocs
      .filter((t) => t.workos_org_id === workos_org_id)
      .map((t) => ({ _id: t._id, name: t.name }));

    // Keep UI stable by sorting alphabetically by team name
    teams.sort((a, b) => a.name.localeCompare(b.name));
    return teams;
  },
});
