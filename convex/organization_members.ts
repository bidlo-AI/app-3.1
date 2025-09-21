import { internalQuery, query, action } from './_generated/server';
import { internal } from './_generated/api';
import schema from './schema';
import { crud } from 'convex-helpers/server/crud';
import { v } from 'convex/values';

const organizationMemberFields = schema.tables.organization_members.validator.fields;

export const { create, destroy, update } = crud(schema, 'organization_members');

// --------------------------------
// INTERNAL QUERIES
// --------------------------------
export const getByWorkOSIds = internalQuery({
  args: {
    workos_org_id: organizationMemberFields.workos_org_id,
    workos_user_id: organizationMemberFields.workos_user_id,
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query('organization_members')
      .filter((q) =>
        q.and(q.eq(q.field('workos_org_id'), args.workos_org_id), q.eq(q.field('workos_user_id'), args.workos_user_id)),
      )
      .first();
    return member;
  },
});

// --------------------------------
// QUERIES
// --------------------------------
export const getByUserId = query({
  args: {
    workos_user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query('organization_members')
      .filter((q) => q.eq(q.field('workos_user_id'), args.workos_user_id))
      .collect();
    return memberships;
  },
});

export const getAllByUserId = internalQuery({
  args: {
    workos_user_id: organizationMemberFields.workos_user_id,
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query('organization_members')
      .filter((q) => q.eq(q.field('workos_user_id'), args.workos_user_id))
      .collect();
    return memberships;
  },
});

// --------------------------------
// ACTIONS
// --------------------------------
// Action to remove organization member by WorkOS IDs - useful for server actions
export const removeByWorkOSIds = action({
  args: {
    workos_org_id: v.string(),
    workos_user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.runQuery(internal.organization_members.getByWorkOSIds, {
      workos_org_id: args.workos_org_id,
      workos_user_id: args.workos_user_id,
    });

    if (member) {
      await ctx.runMutation(internal.organization_members.destroy, {
        id: member._id,
      });
      return { success: true, removed: true };
    }

    return { success: true, removed: false };
  },
});
