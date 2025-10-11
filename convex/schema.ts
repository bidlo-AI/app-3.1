import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import {
  hueValidator,
  iconValidator,
  agentPanelPageValidator,
  sidebarSectionKeyValidator,
  teamIdValidator,
  permissionLevelValidator,
  shareLevelValidator,
  threadStatusValidator,
  messageRoleValidator,
} from './validators';

// Notes
// - created_by, owner_id, updated_by are all workos_user_ids (not the convex user ids)

// Icon validator shared across tables

export default defineSchema({
  users: defineTable({
    email: v.string(),
    workos_id: v.string(),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    profile_picture: v.optional(v.string()),
    theme: v.union(v.literal('light'), v.literal('dark')),
    color: hueValidator,
    sidebar_hidden: v.optional(v.boolean()),
    sidebar_width: v.optional(v.number()),
    agent_panel_hidden: v.optional(v.boolean()),
    agent_panel_width: v.optional(v.number()),
    agent_panel_page: v.optional(agentPanelPageValidator),
    // Order of high-level sidebar sections for this user
    sidebar_sections_order: v.optional(v.array(sidebarSectionKeyValidator)),
    // Optional per-user ordering of teams in the sidebar
    sidebar_team_order: v.optional(v.array(teamIdValidator)),
  })
    .index('by_email', ['email'])
    .index('by_workos_id', ['workos_id']),
  organizations: defineTable({
    workos_id: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    default_state: v.optional(v.string()),
    default_contractor: v.optional(v.string()),
  }).index('by_workos_id', ['workos_id']),
  organization_members: defineTable({
    role: v.union(v.literal('admin'), v.literal('member'), v.literal('viewer')),
    status: v.union(v.literal('active'), v.literal('pending')),
    workos_org_id: v.string(),
    workos_user_id: v.string(),
    workos_membership_id: v.string(),
  })
    // Composite index to efficiently fetch active memberships by user
    .index('by_user_status', ['workos_user_id', 'status']),
  organization_invites: defineTable({
    email: v.string(),
    workos_org_id: v.string(), // WorkOS organization ID
    workos_invite_id: v.string(), // WorkOS invitation ID
    expires_at: v.number(),
    // workos_user_id: v.string(), //<-- you can't know this when the invite is created
  })
    .index('by_email', ['email'])
    .index('by_workos_invite_id', ['workos_invite_id']),

  // ------------------------------------------------------------
  // TEAMS
  // ------------------------------------------------------------
  teams: defineTable({
    workos_org_id: v.string(),
    name: v.string(),
    // Optional team icon, same shape as blocks.icon
    icon: v.optional(iconValidator),
    visibility: v.union(v.literal('open'), v.literal('closed'), v.literal('private')),
    created_at: v.number(),
    created_by: v.string(),
  })
    .index('by_org', ['workos_org_id'])
    .index('by_org_name', ['workos_org_id', 'name']),

  team_members: defineTable({
    team_id: v.id('teams'),
    workos_user_id: v.string(),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('member')),
    created_at: v.number(),
  })
    .index('by_team', ['team_id'])
    .index('by_user', ['workos_user_id'])
    .index('by_team_user', ['team_id', 'workos_user_id']),

  // ------------------------------------------------------------
  // BLOCK GRAPH
  // ------------------------------------------------------------
  blocks: defineTable({
    workos_org_id: v.string(),
    owner_id: v.string(),
    team_id: v.optional(v.id('teams')),
    scope: v.union(v.literal('private'), v.literal('team'), v.literal('org'), v.literal('custom')),
    type: v.union(
      v.literal('page'),
      v.literal('widget'),
      v.literal('file'),
      v.literal('thread'),
      v.literal('document'),
    ),
    title: v.optional(v.string()),
    // Optional page icon. Discriminated union across emoji, preset, or uploaded image.
    icon: v.optional(iconValidator),

    // Hierarchy
    parent_id: v.optional(v.id('blocks')),
    position: v.number(),
    ancestors: v.array(v.id('blocks')),
    depth: v.number(),
    // Optional during create; set to own id post-insert for top-level pages
    root_id: v.optional(v.id('blocks')),

    // Content
    content: v.optional(v.any()),

    // Lifecycle / audit
    is_archived: v.optional(v.boolean()),
    archived_at: v.optional(v.number()),
    deleted_at: v.optional(v.number()),
    created_at: v.number(),
    created_by: v.string(),
    updated_at: v.number(),
    updated_by: v.string(),
  })
    .index('by_org', ['workos_org_id'])
    .index('by_parent_pos', ['parent_id', 'position'])
    .index('by_owner_scope', ['owner_id', 'scope'])
    .index('by_owner_scope_org', ['owner_id', 'scope', 'workos_org_id'])
    .index('by_team', ['team_id'])
    .index('by_type', ['type'])
    .index('by_root_pos', ['root_id', 'position']),

  // ------------------------------------------------------------
  // PERMISSIONS
  // ------------------------------------------------------------
  block_permissions: defineTable({
    block_id: v.id('blocks'),
    subject: v.union(
      v.object({ kind: v.literal('user'), workos_user_id: v.string() }),
      v.object({ kind: v.literal('team'), team_id: v.id('teams') }),
      v.object({ kind: v.literal('org'), workos_org_id: v.string() }),
      v.object({ kind: v.literal('public') }),
    ),
    level: permissionLevelValidator,
    subject_key: v.string(),
    created_at: v.number(),
    created_by: v.string(),
  })
    .index('by_block', ['block_id'])
    .index('by_subjectKey', ['subject_key'])
    .index('by_block_subject', ['block_id', 'subject_key']),

  // ------------------------------------------------------------
  // SHARE LINKS
  // ------------------------------------------------------------
  share_links: defineTable({
    block_id: v.id('blocks'),
    token: v.string(),
    level: shareLevelValidator,
    expires_at: v.optional(v.number()),
    created_at: v.number(),
    created_by: v.string(),
  })
    .index('by_token', ['token'])
    .index('by_block', ['block_id']),

  // ------------------------------------------------------------
  // FILES (metadata)
  //! shuold just be moved to conent or the content of a new "file-chunks" block type
  // ------------------------------------------------------------
  files: defineTable({
    block_id: v.id('blocks'),
    workos_org_id: v.string(),
    storage_key: v.string(),
    name: v.string(),
    mime: v.string(),
    size: v.number(),
    sha256: v.optional(v.string()),
    uploaded_by: v.string(),
    uploaded_at: v.number(),
    // Light purpose tagging allows fast lookups and constraints per block
    purpose: v.optional(v.union(v.literal('page_icon'), v.literal('page_cover'), v.literal('attachment'))),
  })
    .index('by_block', ['block_id'])
    .index('by_org', ['workos_org_id'])
    // Fetch per-block file by purpose quickly (e.g., active page icon)
    .index('by_block_purpose', ['block_id', 'purpose']),

  // ------------------------------------------------------------
  // THREADS (metadata)
  //! tbd on how to implement threads
  // ------------------------------------------------------------
  threads: defineTable({
    block_id: v.id('blocks'),
    workos_org_id: v.string(),
    created_by: v.string(),
    model: v.optional(v.string()),
    status: v.optional(threadStatusValidator),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index('by_org', ['workos_org_id'])
    .index('by_block', ['block_id']),

  messages: defineTable({
    // legacy fields
    content: v.string(),
    author: v.string(), // user email or name
    author_id: v.string(),
    workos_org_id: v.string(),
    timestamp: v.number(),

    // new optional fields
    thread_id: v.optional(v.id('threads')),
    role: v.optional(messageRoleValidator),
    block_id: v.optional(v.id('blocks')),
    meta: v.optional(v.any()),
    org_id: v.optional(v.string()),
    workos_user_id: v.optional(v.string()),
  })
    .index('by_organization', ['workos_org_id'])
    .index('by_thread', ['thread_id']),

  // ------------------------------------------------------------
  // PRESENCE
  // ------------------------------------------------------------
  // Presence component tables (localized copy from @convex-dev/presence)
  presence: defineTable({
    room_id: v.string(),
    user_id: v.string(),
    online: v.boolean(),
    last_disconnected: v.number(),
  })
    .index('user_online_room', ['user_id', 'online', 'room_id'])
    .index('room_order', ['room_id', 'online', 'last_disconnected']),

  presence_sessions: defineTable({
    room_id: v.string(),
    user_id: v.string(),
    session_id: v.string(),
  })
    .index('room_user_session', ['room_id', 'user_id', 'session_id'])
    .index('sessionId', ['session_id']),

  presence_room_tokens: defineTable({
    token: v.string(),
    room_id: v.string(),
  })
    .index('token', ['token'])
    .index('room', ['room_id']),

  presence_session_tokens: defineTable({
    token: v.string(),
    session_id: v.string(),
  })
    .index('token', ['token'])
    .index('sessionId', ['session_id']),

  presence_session_timeouts: defineTable({
    session_id: v.string(),
    scheduled_function_id: v.id('_scheduled_functions'),
  }).index('sessionId', ['session_id']),
});
