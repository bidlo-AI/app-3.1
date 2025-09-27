import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';

// --------------------------------
// HELPERS
// --------------------------------

/**
 * Get the WorkOS user and organization ids from the authenticated WorkOS user.
 * Throws if unauthenticated.
 */
export async function getSessionInfo(
  ctx: QueryCtx | MutationCtx,
): Promise<{ workos_user_id: string; workos_org_id: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('User not authenticated');
  const workos_user_id = identity.subject;
  const workos_org_id = identity.organization as string;
  return { workos_user_id, workos_org_id };
}

/**
 * Get the current Convex `users` document for the authenticated WorkOS user.
 * Throws if unauthenticated or user doc not found.
 */
export async function getCurrentUserDoc(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
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

/**
 * Get an `organizations` document by WorkOS organization id.
 * Throws if the organization is not found.
 */
export async function getOrgByWorkOSId(
  ctx: QueryCtx | MutationCtx,
  workosOrgId: string,
): Promise<Doc<'organizations'>> {
  const orgDoc = await ctx.db
    .query('organizations')
    .withIndex('by_workos_id', (q) => q.eq('workos_id', workosOrgId))
    .first();
  if (!orgDoc) throw new Error('Organization not found');
  return orgDoc;
}
