import { internalQuery, query, action } from './_generated/server';
import { internal } from './_generated/api';
import schema from './schema';
import { crud } from 'convex-helpers/server/crud';
import { v } from 'convex/values';

const organizationInviteFields = schema.tables.organization_invites.validator.fields;

export const { create, destroy, update } = crud(schema, 'organization_invites');

// --------------------------------
// QUERIES (client)
// --------------------------------
export const getInviteCount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.log('no identity');
      return 0;
    }

    return await ctx.db
      .query('organization_invites')
      .filter((q) => q.eq(q.field('email'), identity.email))
      .collect()
      .then((invites) => invites.length);
  },
});
export const getInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      console.log('no identity');
      return [];
    }

    // Get all invites for this user's email using the index
    const invites = await ctx.db
      .query('organization_invites')
      .withIndex('by_email', (q) => q.eq('email', identity.email as string))
      .collect();

    // Get organization details for each invite
    const invitesWithOrganizations = await Promise.all(
      invites.map(async (invite) => {
        const organization = await ctx.db
          .query('organizations')
          .withIndex('by_workos_id', (q) => q.eq('workos_id', invite.workos_org_id))
          .first();

        return {
          _id: invite._id,
          email: invite.email,
          expires_at: invite.expires_at,
          workos_invite_id: invite.workos_invite_id,
          organization: organization
            ? {
                id: organization.workos_id,
                name: organization.name,
              }
            : null,
        };
      }),
    );

    return invitesWithOrganizations;
  },
});

// --------------------------------
// INTERNAL QUERIES
// --------------------------------
export const getByEmailAndOrganization = internalQuery({
  args: {
    email: organizationInviteFields.email,
    workos_org_id: organizationInviteFields.workos_org_id,
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query('organization_invites')
      .filter((q) => q.and(q.eq(q.field('email'), args.email), q.eq(q.field('workos_org_id'), args.workos_org_id)))
      .first();
    return invite;
  },
});
export const getByWorkOSInviteId = internalQuery({
  args: {
    workos_invite_id: organizationInviteFields.workos_invite_id,
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query('organization_invites')
      .filter((q) => q.eq(q.field('workos_invite_id'), args.workos_invite_id))
      .first();
    return invite;
  },
});
export const getUserInvites = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all invites for this user's email
    const invites = await ctx.db
      .query('organization_invites')
      .filter((q) => q.eq(q.field('email'), args.email))
      .collect();

    // Get organization details for each invite
    const invitesWithOrganizations = await Promise.all(
      invites.map(async (invite) => {
        const organization = await ctx.db
          .query('organizations')
          .filter((q) => q.eq(q.field('workos_id'), invite.workos_org_id))
          .first();

        return {
          _id: invite._id,
          email: invite.email,
          expires_at: invite.expires_at,
          workos_invite_id: invite.workos_invite_id,
          organization: organization
            ? {
                id: organization.workos_id,
                name: organization.name,
              }
            : null,
        };
      }),
    );

    return invitesWithOrganizations;
  },
});

// --------------------------------
// ACTIONS
// --------------------------------
// Action to remove an invite by ID - can be called from server actions
export const removeInviteById = action({
  args: {
    inviteId: v.id('organization_invites'),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.organization_invites.destroy, {
      id: args.inviteId,
    });
    return { success: true };
  },
});
// Action to remove invite by WorkOS invitation ID - useful for server actions
export const removeInviteByWorkOSId = action({
  args: {
    workos_invite_id: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.runQuery(internal.organization_invites.getByWorkOSInviteId, {
      workos_invite_id: args.workos_invite_id,
    });

    if (invite) {
      await ctx.runMutation(internal.organization_invites.destroy, {
        id: invite._id,
      });
      return { success: true, removed: true };
    }

    return { success: true, removed: false };
  },
});
// Action to remove invite by email and organization - useful for server actions
export const removeInviteByEmailAndOrg = action({
  args: {
    email: v.string(),
    workos_org_id: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.runQuery(internal.organization_invites.getByEmailAndOrganization, {
      email: args.email,
      workos_org_id: args.workos_org_id,
    });

    if (invite) {
      await ctx.runMutation(internal.organization_invites.destroy, {
        id: invite._id,
      });
      return { success: true, removed: true };
    }

    return { success: true, removed: false };
  },
});
