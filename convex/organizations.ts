import { internalQuery, query } from './_generated/server';
import schema from './schema';
import { crud } from 'convex-helpers/server/crud';
import { mutation } from './_generated/server';

const organizationFields = schema.tables.organizations.validator.fields;

export const { create, destroy, update } = crud(schema, 'organizations');

// --------------------------------
// MUTATIONS
// --------------------------------

// Mutation to update organization name to "NEW NAME"
export const updateOrganizationName = mutation({
  args: {
    workos_id: organizationFields.workos_id,
  },
  handler: async (ctx, args) => {
    // Find the organization by workos_id
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_workos_id', (q) => q.eq('workos_id', args.workos_id))
      .first();

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Update the organization name to "NEW NAME"
    await ctx.db.patch(organization._id, {
      name: 'NEW NAME',
    });

    return {
      success: true,
      updatedOrganization: {
        id: organization.workos_id,
        name: 'NEW NAME',
      },
    };
  },
});

// --------------------------------
// QUERIES
// --------------------------------

export const getUserOrganizations = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    const workos_user_id = user?.subject;

    if (!workos_user_id) {
      throw new Error('User not authenticated');
    }

    // Get all organization memberships for this user
    const memberships = await ctx.db
      .query('organization_members')
      .withIndex('by_user_status', (q) => q.eq('workos_user_id', workos_user_id).eq('status', 'active'))
      .collect();

    // Get organization details for each membership
    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const organization = await ctx.db
          .query('organizations')
          .withIndex('by_workos_id', (q) => q.eq('workos_id', membership.workos_org_id))
          .first();

        if (!organization) return null;

        return {
          id: organization.workos_id, // Use WorkOS ID for compatibility with existing action
          name: organization.name,
          avatar: organization.avatar,
          default_state: organization.default_state,
          default_contractor: organization.default_contractor,
          role: membership.role,
        };
      }),
    );

    // Filter out null values and convert to object with organization id as key
    const organizationsObject: Record<string, { id: string; name: string; role: string }> = {};

    organizations.forEach((org) => {
      if (org) organizationsObject[org.id] = org;
    });

    return organizationsObject;
  },
});

//--------------------------------
// INTERNAL QUERIES
//--------------------------------
export const getByWorkOSId = internalQuery({
  args: { workos_id: organizationFields.workos_id },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_workos_id', (q) => q.eq('workos_id', args.workos_id))
      .first();
    return organization;
  },
});
