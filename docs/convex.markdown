### Convex helpers and conventions

- **Where**:
  - Helpers: `convex/helpers.ts`
  - Validators: `convex/validators.ts`
  - Example usage: `convex/blocks.ts`, `convex/teams.ts`
  - Sectioned layout examples: `convex/users.ts`, `convex/organizations.ts`

### Helpers

- **getCurrentUserDoc(ctx) → Doc<'users'>**
  - Auth-required. Reads the authenticated WorkOS user via `ctx.auth.getUserIdentity()` and loads the corresponding `users` row using the `by_workos_id` index.
  - Throws `User not authenticated` or `User not found` to keep callsites simple and safe.

- **getOrgByWorkOSId(ctx, workosOrgId) → Doc<'organizations'>**
  - Looks up an organization by its WorkOS id using the `by_workos_id` index.
  - Throws `Organization not found`.

### Shared validators

- **Where**: `convex/validators.ts`
- **Why**: Centralize common `v.*` unions/objects and id validators used across schema and server functions to keep types consistent and reduce duplication.
- **Key exports**:
  - Icon: `hueValidator`, `iconStyleValidator`, `imageCropValidator`, `iconImageVariantValidator`, `iconValidator`
  - Ids: `blockIdValidator`, `teamIdValidator`, `fileIdValidator`
  - App enums: `scopePrivateTeamValidator`, `agentPanelPageValidator`, `sidebarSectionKeyValidator`
  - Layout targets: `layoutWidthTargetValidator`, `layoutHiddenTargetValidator`
  - Access/status: `permissionLevelValidator`, `shareLevelValidator`, `threadStatusValidator`, `messageRoleValidator`

- **Schema usage example**:

```ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { iconValidator, agentPanelPageValidator, sidebarSectionKeyValidator, teamIdValidator } from './validators';

export default defineSchema({
  users: defineTable({
    agent_panel_page: v.optional(agentPanelPageValidator),
    sidebar_sections_order: v.optional(v.array(sidebarSectionKeyValidator)),
    sidebar_team_order: v.optional(v.array(teamIdValidator)),
  }),
  blocks: defineTable({
    icon: v.optional(iconValidator),
  }),
});
```

- **Server function usage example**:

```ts
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { blockIdValidator, teamIdValidator, scopePrivateTeamValidator } from './validators';

export const getBlock = query({
  args: { blockId: blockIdValidator },
  handler: async (ctx, args) => {
    /* ... */
  },
});

export const createPage = mutation({
  args: {
    scope: scopePrivateTeamValidator,
    teamId: v.optional(teamIdValidator),
    parentId: v.optional(blockIdValidator),
  },
  handler: async (ctx, args) => {
    /* ... */
  },
});
```

### Usage guidelines

- **Always use helpers** for common identity/org lookups instead of re-implementing per file.
- **Prefer indexed queries** over filter scans:
  - Users by subject: `users.by_workos_id`
  - Organizations by WorkOS id: `organizations.by_workos_id`
  - Team membership checks: `team_members.by_team_user`, list by `team_members.by_user`
- **Guard early** with clear errors (e.g., Forbidden, Not found) to avoid leaking information.
- **Sort deterministically** for UI: prefer `position` then `createdAt` for block/page lists; alphabetically for team names.

### File layout convention

Structure Convex modules into clear sections with headers, mirroring `convex/users.ts`:

// --------------------------------
// QUERIES
// --------------------------------
// Short description of what the query does
export const myQuery = query({
// ...
});

// --------------------------------
// MUTATIONS
// --------------------------------
// Short description of what the mutation does
export const myMutation = mutation({
// ...
});

// --------------------------------
// ACTIONS (optional)
// --------------------------------
export const myAction = action({
// ...
});

// --------------------------------
// HELPERS (file-local, rare)
// --------------------------------
// Only when truly file-specific; otherwise put shared helpers in `convex/helpers.ts`.

### Blocks/pages specifics

- Use composite indexes to minimize scans:
  - `blocks.by_parent_pos` for children listing
  - `blocks.by_owner_scope_org` for private pages by org
  - `blocks.by_team` for team pages
- For hierarchical creates:
  - Inherit `scope`, `organizationId`, `ownerId`, and `teamId` from parent when creating children
  - Set `ancestors`, `depth`, and for top-level pages, patch `rootId` to self after insert

### Team permissions

- To verify access to a team resource, check membership via `team_members.by_team_user`.
- To list a user’s teams, select via `team_members.by_user` then fetch teams in parallel.

### Error and DX preferences

- Keep error messages concise and consistent: `User not authenticated`, `User not found`, `Organization not found`, `Forbidden`.
- Keep return payloads minimal and UI-ready (ids, titles, positions) and perform sorting server-side for stable UI.
- Add one-line descriptions above exports; keep comments focused on “why”, not “how”.
